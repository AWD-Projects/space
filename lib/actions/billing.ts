"use server";

import type { User, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { getPriceIdForPlan } from "@/lib/stripe/plans";
import type { Plan, PlanCode, Store, Subscription } from "@/lib/types/database";
import { PLAN_CODES } from "@/lib/constants/plans";
import { getTrialDaysLeft, isPaidPlan } from "@/lib/utils/billing";

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

async function ensureStripeCustomer(
  supabase: SupabaseClient,
  subscription: Subscription,
  user: User
) {
  if (subscription.stripe_customer_id) {
    return subscription.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    name: user.user_metadata?.full_name ?? undefined,
    metadata: {
      supabase_user_id: user.id,
    },
  });

  await supabase
    .from("subscriptions")
    .update({
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  return customer.id;
}

export async function getBillingOverview(): Promise<{ data?: BillingOverviewResult; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "No autenticado" };
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single<Subscription>();

  if (subscriptionError || !subscription) {
    return { error: "No se encontró la suscripción" };
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("code", subscription.plan_code)
    .single<Plan>();

  if (planError || !plan) {
    return { error: "No se encontró el plan" };
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id,name,slug")
    .eq("owner_id", user.id)
    .single<Pick<Store, "id" | "name" | "slug">>();

  const storeId = store?.id;

  const [{ count: products = 0 }, { count: catalogs = 0 }] = await Promise.all([
    storeId
      ? supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("store_id", storeId)
      : Promise.resolve({ count: 0 }),
    storeId
      ? supabase
          .from("catalogs")
          .select("*", { count: "exact", head: true })
          .eq("store_id", storeId)
      : Promise.resolve({ count: 0 }),
  ]);

  await ensureStripeCustomer(supabase, subscription, user);

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
      store,
    },
  };
}

export async function getAvailablePlans(): Promise<{ data?: Plan[]; error?: string }> {
  const supabase = await createClient();

  const { data: plans, error } = await supabase.from("plans").select("*").returns<Plan[]>();

  if (error || !plans) {
    return { error: "No se pudieron cargar los planes" };
  }

  const ordered = [...plans].sort((a, b) => {
    const indexA = PLAN_CODES.indexOf(a.code as PlanCode);
    const indexB = PLAN_CODES.indexOf(b.code as PlanCode);
    return indexA - indexB;
  });

  return { data: ordered };
}

export async function createCheckoutSession(planCode: PlanCode) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single<Subscription>();

  if (!subscription) {
    return { error: "No se encontró la suscripción" };
  }

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("code", planCode)
    .single<Plan>();

  if (!plan) {
    return { error: "Plan no disponible" };
  }

  if (!isPaidPlan(plan.code as PlanCode)) {
    return { error: "El plan gratuito no requiere pago" };
  }

  const priceId = getPriceIdForPlan(plan.code as PlanCode);

  if (!priceId) {
    return { error: "Falta configurar el precio en Stripe" };
  }

  const customerId = await ensureStripeCustomer(supabase, subscription, user);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    allow_promotion_codes: true,
    client_reference_id: subscription.id,
    metadata: {
      supabase_user_id: user.id,
      target_plan_code: plan.code,
      current_plan_code: subscription.plan_code,
    },
    success_url: `${APP_URL}/billing?status=success`,
    cancel_url: `${APP_URL}/billing`,
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
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

  return { data: { url: session.url } };
}

export async function createCustomerPortalSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!subscription) {
    return { error: "No se encontró la suscripción" };
  }

  const customerId = await ensureStripeCustomer(supabase, subscription, user);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/billing`,
  });

  return { data: { url: session.url } };
}
