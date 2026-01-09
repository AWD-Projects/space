"use server";

import { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/lib/types/database";

export type PlanUsageSummary = {
  planCode: PlanCode;
  planName: string;
  maxProducts: number | null;
  maxCatalogs: number | null;
  productsUsed: number;
  catalogsUsed: number;
};

export async function getPlanUsageSummary(): Promise<{ data?: PlanUsageSummary; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("plan_code")
    .eq("user_id", user.id)
    .maybeSingle<{ plan_code: PlanCode }>();

  if (subscriptionError || !subscription) {
    return { error: "No encontramos tu plan actual." };
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("code, name, max_products, max_catalogs")
    .eq("code", subscription.plan_code)
    .maybeSingle<{ code: PlanCode; name: string; max_products: number | null; max_catalogs: number | null }>();

  if (planError || !plan) {
    return { error: "No pudimos cargar los límites de tu plan." };
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle<{ id: string }>();

  let productsUsed = 0;
  let catalogsUsed = 0;

  if (store?.id) {
    const [productCount, catalogCount] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("store_id", store.id),
      supabase.from("catalogs").select("*", { count: "exact", head: true }).eq("store_id", store.id),
    ]);

    productsUsed = productCount.count ?? 0;
    catalogsUsed = catalogCount.count ?? 0;
  }

  return {
    data: {
      planCode: plan.code,
      planName: plan.name,
      maxProducts: plan.max_products,
      maxCatalogs: plan.max_catalogs,
      productsUsed,
      catalogsUsed,
    },
  };
}
