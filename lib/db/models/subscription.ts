import { Schema, model, models, type Model } from "mongoose";

export type SubscriptionDocument = {
  user_id: string;
  plan_code: "starter" | "growth" | "pro";
  status: "trialing" | "active" | "past_due" | "canceled";
  trial_started_at: Date;
  trial_ends_at: Date;
  current_period_starts_at?: Date | null;
  current_period_ends_at?: Date | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  cancel_at_period_end?: boolean;
  canceled_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
};

const subscriptionSchema = new Schema<SubscriptionDocument>(
  {
    user_id: { type: String, required: true, unique: true, index: true },
    plan_code: { type: String, default: "pro" },
    status: { type: String, default: "trialing" },
    trial_started_at: { type: Date, required: true },
    trial_ends_at: { type: Date, required: true },
    current_period_starts_at: { type: Date, default: null },
    current_period_ends_at: { type: Date, default: null },
    stripe_customer_id: { type: String, default: null },
    stripe_subscription_id: { type: String, default: null },
    stripe_price_id: { type: String, default: null },
    cancel_at_period_end: { type: Boolean, default: false },
    canceled_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

subscriptionSchema.index({ stripe_customer_id: 1 });

export const SubscriptionModel: Model<SubscriptionDocument> =
  models.Subscription || model<SubscriptionDocument>("Subscription", subscriptionSchema);
