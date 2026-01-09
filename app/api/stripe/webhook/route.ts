import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { adminClient } from "@/lib/supabase/admin";
import { getPlanCodeFromPriceId } from "@/lib/stripe/plans";

export const runtime = "nodejs";

function mapStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    default:
      return "canceled";
  }
}

type SubscriptionWithPeriods = Stripe.Subscription & {
  current_period_start?: number;
  current_period_end?: number;
};

async function updateSubscriptionFromStripe(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  if (!customerId) return;

  const { data: current } = await adminClient
    .from("subscriptions")
    .select("id,plan_code")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!current) {
    return;
  }

  const priceId = sub.items.data[0]?.price.id ?? null;
  const planCode = getPlanCodeFromPriceId(priceId) ?? current.plan_code;

  const legacy = sub as SubscriptionWithPeriods;

  await adminClient
    .from("subscriptions")
    .update({
      plan_code: planCode,
      status: mapStatus(sub.status),
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      cancel_at_period_end: sub.cancel_at_period_end,
      current_period_starts_at: legacy.current_period_start
        ? new Date(legacy.current_period_start * 1000).toISOString()
        : null,
      current_period_ends_at: legacy.current_period_end
        ? new Date(legacy.current_period_end * 1000).toISOString()
        : null,
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer;
  if (!customerId || typeof customerId !== "string") {
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  const userId = session.metadata?.supabase_user_id ?? null;

  const updatePayload: Record<string, string | null> = {
    stripe_customer_id: customerId,
  };

  if (subscriptionId) {
    updatePayload.stripe_subscription_id = subscriptionId;
  }

  if (userId) {
    await adminClient
      .from("subscriptions")
      .update(updatePayload)
      .eq("user_id", userId);
  } else {
    await adminClient
      .from("subscriptions")
      .update(updatePayload)
      .eq("stripe_customer_id", customerId);
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  if (!customerId) return;

  await adminClient
    .from("subscriptions")
    .update({
      plan_code: "starter",
      status: "active",
      stripe_subscription_id: null,
      stripe_price_id: null,
      cancel_at_period_end: false,
      current_period_starts_at: null,
      current_period_ends_at: null,
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const payload = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: `Webhook Error: ${(error as Error).message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await updateSubscriptionFromStripe(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook error", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
