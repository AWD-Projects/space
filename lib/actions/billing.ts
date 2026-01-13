"use server";

import { stripe } from "@/lib/stripe/client";
import { getPriceIdForPlan } from "@/lib/stripe/plans";
import type { Plan, PlanCode, Store, Subscription } from "@/lib/types/database";
import { PLAN_CODES } from "@/lib/constants/plans";
import { getTrialDaysLeft, isPaidPlan } from "@/lib/utils/billing";
import { connectToDatabase } from "@/lib/db/connection";
import { PlanModel } from "@/lib/db/models/plan";
import { StoreModel } from "@/lib/db/models/store";
import { SubscriptionModel } from "@/lib/db/models/subscription";
import { ensurePlansSeeded } from "@/lib/db/utils/plans";
import { getOrCreateSubscription } from "@/lib/db/utils/subscription";
import { serializeDoc } from "@/lib/db/serialization";
import { getClerkProfile, requireAuthUserId } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type BillingOverviewResult = {
  subscription: Subscription;
  plan: Plan;
  usage: {
    products: number;
    catalogs: number;
  };
  trialDaysLeft: number;
  store?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

async function ensureStripeCustomer(subscription: Subscription, userId: string) {
  if (subscription.stripe_customer_id) {
    return subscription.stripe_customer_id;
  }

  const clerkProfile = await getClerkProfile(userId);
  const customer = await stripe.customers.create({
    email: clerkProfile.email ?? undefined,
    name: clerkProfile.fullName ?? undefined,
    metadata: {
      clerk_user_id: userId,
    },
  });

  await SubscriptionModel.updateOne(
    { _id: subscription.id },
    { stripe_customer_id: customer.id, updated_at: new Date() }
  );

  return customer.id;
}

export async function getBillingOverview(): Promise<{ data?: BillingOverviewResult; error?: string }> {
  const userId = await requireAuthUserId();
  await connectToDatabase();
  await ensurePlansSeeded();

  const subscriptionDoc = await getOrCreateSubscription(userId);
  const subscription = serializeDoc(subscriptionDoc) as unknown as Subscription;

  const plan = await PlanModel.findOne({ code: subscription.plan_code }).lean<Plan>();
  if (!plan) {
    return { error: "No se encontró el plan" };
  }

  const store = await StoreModel.findOne({ owner_id: userId }).select("name slug");
  const storeId = store?._id ? String(store._id) : null;

  const [products, catalogs] = storeId
    ? await Promise.all([
        import("@/lib/db/models/product").then(({ ProductModel }) =>
          ProductModel.countDocuments({ store_id: storeId })
        ),
        import("@/lib/db/models/catalog").then(({ CatalogModel }) =>
          CatalogModel.countDocuments({ store_id: storeId })
        ),
      ])
    : [0, 0];

  await ensureStripeCustomer(subscription, userId);

  return {
    data: {
      subscription: {
        ...subscription,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      },
      plan,
      usage: {
        products: products ?? 0,
        catalogs: catalogs ?? 0,
      },
      trialDaysLeft: getTrialDaysLeft(subscription),
      store: store
        ? {
            id: String(store._id),
            name: store.name,
            slug: store.slug,
          }
        : null,
    },
  };
}

export async function getAvailablePlans(): Promise<{ data?: Plan[]; error?: string }> {
  await connectToDatabase();
  await ensurePlansSeeded();

  const plans = await PlanModel.find({}).lean<Plan[]>();
  if (!plans || plans.length === 0) {
    return { error: "No se pudieron cargar los planes" };
  }

  const ordered = [...plans].sort((a, b) => {
    const indexA = PLAN_CODES.indexOf(a.code as PlanCode);
    const indexB = PLAN_CODES.indexOf(b.code as PlanCode);
    return indexA - indexB;
  });

  return { data: ordered };
}

export async function createCheckoutSession(
  planCode: PlanCode
): Promise<{ data: { url: string | null } } | { error: string }> {
  const userId = await requireAuthUserId();
  await connectToDatabase();
  await ensurePlansSeeded();

  const subscriptionDoc = await getOrCreateSubscription(userId);
  const subscription = serializeDoc(subscriptionDoc) as unknown as Subscription;

  const plan = await PlanModel.findOne({ code: planCode }).lean<Plan>();
  if (!plan) {
    return { error: "Plan no disponible" };
  }

  if (!isPaidPlan(plan.code as PlanCode)) {
    return { error: "El plan gratuito no requiere pago" } as const;
  }

  const priceId = getPriceIdForPlan(plan.code as PlanCode);

  if (!priceId) {
    return { error: "Falta configurar el precio en Stripe" } as const;
  }

  const customerId = await ensureStripeCustomer(subscription, userId);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    allow_promotion_codes: true,
    client_reference_id: subscription.id,
    metadata: {
      clerk_user_id: userId,
      target_plan_code: plan.code,
      current_plan_code: subscription.plan_code,
    },
    success_url: `${APP_URL}/app/billing?status=success`,
    cancel_url: `${APP_URL}/app/billing`,
    subscription_data: {
      metadata: {
        clerk_user_id: userId,
        plan_code: plan.code,
      },
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
  });

  return { data: { url: session.url } } as const;
}

export async function createCustomerPortalSession(): Promise<
  | { data: { url: string } }
  | { error: string }
> {
  const userId = await requireAuthUserId();
  await connectToDatabase();

  const subscriptionDoc = await getOrCreateSubscription(userId);
  const subscription = serializeDoc(subscriptionDoc) as unknown as Subscription;

  const customerId = await ensureStripeCustomer(subscription, userId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/app/billing`,
  });

  return { data: { url: session.url } };
}
