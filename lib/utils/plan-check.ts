import type { PlanCode } from "@/lib/types/database";
import { connectToDatabase } from "@/lib/db/connection";
import { SubscriptionModel } from "@/lib/db/models/subscription";
import { PlanModel } from "@/lib/db/models/plan";
import { ProductModel } from "@/lib/db/models/product";
import { CatalogModel } from "@/lib/db/models/catalog";
import { ensurePlansSeeded } from "@/lib/db/utils/plans";
import { getOrCreateSubscription } from "@/lib/db/utils/subscription";

type PlanLimits = {
  planCode: PlanCode;
  maxProducts: number | null;
  maxCatalogs: number | null;
};

export async function getPlanLimitsForUser(userId: string): Promise<PlanLimits | null> {
  await connectToDatabase();
  await ensurePlansSeeded();

  const subscriptionDoc = await SubscriptionModel.findOne({ user_id: userId }).lean<{ plan_code: PlanCode }>();
  const subscription = subscriptionDoc ?? (await getOrCreateSubscription(userId));

  if (!subscription) {
    return null;
  }

  const plan = await PlanModel.findOne({ code: subscription.plan_code }).lean<{
    code: PlanCode;
    max_products: number | null;
    max_catalogs: number | null;
  }>();

  if (!plan) {
    return null;
  }

  return {
    planCode: plan.code as PlanCode,
    maxProducts: plan.max_products,
    maxCatalogs: plan.max_catalogs,
  };
}

export async function ensureWithinPlanLimit(
  storeId: string,
  userId: string,
  type: "products" | "catalogs"
): Promise<{ allowed: boolean; error?: string }> {
  const planLimits = await getPlanLimitsForUser(userId);

  if (!planLimits) {
    return { allowed: false, error: "No encontramos tu suscripción." };
  }

  const max = type === "products" ? planLimits.maxProducts : planLimits.maxCatalogs;

  if (!max || max <= 0) {
    return { allowed: true };
  }

  await connectToDatabase();
  const count =
    type === "products"
      ? await ProductModel.countDocuments({ store_id: storeId })
      : await CatalogModel.countDocuments({ store_id: storeId });

  if ((count ?? 0) >= max) {
    const planName = planLimits.planCode === "starter" ? "Starter" : "Growth";
    const upgradeTarget = planLimits.planCode === "starter" ? "Growth" : "Pro";
    const resourceLabel = type === "products" ? "productos" : "catálogos";
    return {
      allowed: false,
      error: `Plan ${planName}: llegaste al límite de ${resourceLabel}. Actualiza a ${upgradeTarget} para seguir creciendo.`,
    };
  }

  return { allowed: true };
}
