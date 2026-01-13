import { addDays } from "date-fns";
import { SubscriptionModel } from "@/lib/db/models/subscription";

export async function getOrCreateSubscription(userId: string) {
  const existing = await SubscriptionModel.findOne({ user_id: userId });
  if (existing) {
    return existing;
  }

  const now = new Date();
  const trialEndsAt = addDays(now, 30);

  return SubscriptionModel.create({
    user_id: userId,
    plan_code: "pro",
    status: "trialing",
    trial_started_at: now,
    trial_ends_at: trialEndsAt,
    created_at: now,
    updated_at: now,
  });
}
