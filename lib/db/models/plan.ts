import { Schema, model, models, type Model } from "mongoose";

export type PlanDocument = {
  code: "starter" | "growth" | "pro";
  name: string;
  monthly_price_mxn: number;
  max_products?: number | null;
  max_catalogs?: number | null;
  branding_visible: boolean;
  analytics_level: number;
  created_at?: Date;
};

const planSchema = new Schema<PlanDocument>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    monthly_price_mxn: { type: Number, required: true },
    max_products: { type: Number, default: null },
    max_catalogs: { type: Number, default: null },
    branding_visible: { type: Boolean, default: true },
    analytics_level: { type: Number, default: 1 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export const PlanModel: Model<PlanDocument> =
  models.Plan || model<PlanDocument>("Plan", planSchema);
