"use server";

import { subDays } from "date-fns";
import { connectToDatabase } from "@/lib/db/connection";
import { EventModel } from "@/lib/db/models/event";
import { ProductModel } from "@/lib/db/models/product";

export async function getStoreAnalytics(storeId: string, days: number = 7) {
  await connectToDatabase();
  const startDate = subDays(new Date(), days);

  const [storeViews, productViews, ctaClicks] = await Promise.all([
    EventModel.countDocuments({ store_id: storeId, kind: "store_view", occurred_at: { $gte: startDate } }),
    EventModel.countDocuments({ store_id: storeId, kind: "product_view", occurred_at: { $gte: startDate } }),
    EventModel.countDocuments({ store_id: storeId, kind: "cta_click", occurred_at: { $gte: startDate } }),
  ]);

  const [activeProducts, outOfStock] = await Promise.all([
    ProductModel.countDocuments({ store_id: storeId, status: "active" }),
    ProductModel.countDocuments({ store_id: storeId, stock: 0 }),
  ]);

  const [topViewCounts, topClickCounts] = await Promise.all([
    EventModel.aggregate([
      { $match: { store_id: storeId, kind: "product_view", product_id: { $ne: null }, occurred_at: { $gte: startDate } } },
      { $group: { _id: "$product_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    EventModel.aggregate([
      { $match: { store_id: storeId, kind: "cta_click", product_id: { $ne: null }, occurred_at: { $gte: startDate } } },
      { $group: { _id: "$product_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const topIds = Array.from(new Set([
    ...topViewCounts.map((item: any) => String(item._id)),
    ...topClickCounts.map((item: any) => String(item._id)),
  ]));

  const products = await ProductModel.find({ _id: { $in: topIds } }).select("name");
  const productNameMap = new Map(products.map((product) => [String(product._id), product.name]));

  return {
    storeViews: storeViews || 0,
    productViews: productViews || 0,
    ctaClicks: ctaClicks || 0,
    activeProducts: activeProducts || 0,
    outOfStock: outOfStock || 0,
    topProductsByViews: topViewCounts.map((item: any) => ({
      id: String(item._id),
      name: productNameMap.get(String(item._id)) ?? "Producto",
      count: item.count,
    })),
    topProductsByClicks: topClickCounts.map((item: any) => ({
      id: String(item._id),
      name: productNameMap.get(String(item._id)) ?? "Producto",
      count: item.count,
    })),
  };
}

export async function trackEvent(
  storeId: string,
  kind: "store_view" | "product_view" | "search" | "cta_click",
  data?: {
    productId?: string;
    query?: string;
    ctaKind?: "whatsapp" | "payment_link" | "contact";
    sessionId?: string;
    clientHash?: string;
  }
) {
  await connectToDatabase();

  await EventModel.create({
    store_id: storeId,
    kind,
    product_id: data?.productId || null,
    query: data?.query || null,
    cta_kind: data?.ctaKind || null,
    session_id: data?.sessionId || null,
    client_hash: data?.clientHash || null,
    occurred_at: new Date(),
  });
}
