import { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/lib/types/database";

type PlanLimits = {
  planCode: PlanCode;
  maxProducts: number | null;
  maxCatalogs: number | null;
};

export async function getPlanLimitsForUser(userId: string): Promise<PlanLimits | null> {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_code")
    .eq("user_id", userId)
    .maybeSingle<{ plan_code: PlanCode }>();

  if (!subscription) {
    return null;
  }

  const { data: plan } = await supabase
    .from("plans")
    .select("code, max_products, max_catalogs")
    .eq("code", subscription.plan_code)
    .maybeSingle<{ code: PlanCode; max_products: number | null; max_catalogs: number | null }>();

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

  const supabase = await createClient();
  const table = type === "products" ? "products" : "catalogs";
  const max = type === "products" ? planLimits.maxProducts : planLimits.maxCatalogs;

  if (!max || max <= 0) {
    return { allowed: true };
  }

  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("store_id", storeId);

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
