"use server";

import type { PlanCode } from "@/lib/types/database";
import { connectToDatabase } from "@/lib/db/connection";
import { PlanModel } from "@/lib/db/models/plan";
import { SubscriptionModel } from "@/lib/db/models/subscription";
import { StoreModel } from "@/lib/db/models/store";
import { ProductModel } from "@/lib/db/models/product";
import { CatalogModel } from "@/lib/db/models/catalog";
import { ensurePlansSeeded } from "@/lib/db/utils/plans";
import { requireAuthUserId } from "@/lib/auth";
import { getOrCreateSubscription } from "@/lib/db/utils/subscription";

export type PlanUsageSummary = {
  planCode: PlanCode;
  planName: string;
  maxProducts: number | null;
  maxCatalogs: number | null;
  productsUsed: number;
  catalogsUsed: number;
};

export async function getPlanUsageSummary(): Promise<{ data?: PlanUsageSummary; error?: string }> {
  const userId = await requireAuthUserId();
  await connectToDatabase();
  await ensurePlansSeeded();

  const subscriptionDoc = await SubscriptionModel.findOne({ user_id: userId }).lean<{ plan_code: PlanCode }>();
  const subscription = subscriptionDoc ?? (await getOrCreateSubscription(userId));

  const plan = await PlanModel.findOne({ code: subscription.plan_code }).lean<{
    code: PlanCode;
    name: string;
    max_products: number | null;
    max_catalogs: number | null;
  }>();

  if (!plan) {
    return { error: "No pudimos cargar los límites de tu plan." };
  }

  const store = await StoreModel.findOne({ owner_id: userId }).select("_id").lean<{ _id: string }>();

  const storeId = store?._id ? String(store._id) : null;
  const [productsUsed, catalogsUsed] = storeId
    ? await Promise.all([
        ProductModel.countDocuments({ store_id: storeId }),
        CatalogModel.countDocuments({ store_id: storeId }),
      ])
    : [0, 0];

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
