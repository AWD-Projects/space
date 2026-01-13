import { PLAN_MARKETING, PLAN_CODES } from "@/lib/constants/plans";
import { PlanModel } from "@/lib/db/models/plan";

export async function ensurePlansSeeded() {
  const existing = await PlanModel.find({ code: { $in: PLAN_CODES } }).lean();
  const existingCodes = new Set(existing.map((plan) => plan.code));

  const inserts = PLAN_CODES.filter((code) => !existingCodes.has(code)).map((code) => {
    const marketing = PLAN_MARKETING[code];
    return {
      code,
      name: marketing.title,
      monthly_price_mxn: marketing.price_mxn,
      max_products: code === "starter" ? 20 : code === "growth" ? 200 : null,
      max_catalogs: code === "starter" ? 2 : code === "growth" ? 10 : null,
      branding_visible: code !== "pro",
      analytics_level: code === "starter" ? 1 : code === "growth" ? 2 : 3,
      created_at: new Date(),
    };
  });

  if (inserts.length > 0) {
    await PlanModel.insertMany(inserts);
  }
}
