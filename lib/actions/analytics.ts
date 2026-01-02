"use server";

import { createClient } from "@/lib/supabase/server";
import { subDays } from "date-fns";

export async function getStoreAnalytics(storeId: string, days: number = 7) {
  const supabase = await createClient();
  const startDate = subDays(new Date(), days).toISOString();

  // Store views
  const { count: storeViews } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("kind", "store_view")
    .gte("occurred_at", startDate);

  // Product views
  const { count: productViews } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("kind", "product_view")
    .gte("occurred_at", startDate);

  // CTA clicks
  const { count: ctaClicks } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("kind", "cta_click")
    .gte("occurred_at", startDate);

  // Active products
  const { count: activeProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("status", "active");

  // Out of stock products
  const { count: outOfStock } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("stock", 0);

  // Top products by views
  const { data: topProductsByViews } = await supabase
    .from("events")
    .select(`
      product_id,
      products(name)
    `)
    .eq("store_id", storeId)
    .eq("kind", "product_view")
    .not("product_id", "is", null)
    .gte("occurred_at", startDate);

  // Top products by clicks
  const { data: topProductsByClicks } = await supabase
    .from("events")
    .select(`
      product_id,
      products(name)
    `)
    .eq("store_id", storeId)
    .eq("kind", "cta_click")
    .not("product_id", "is", null)
    .gte("occurred_at", startDate);

  // Aggregate top products
  const productViewCounts: Record<string, { name: string; count: number }> = {};
  topProductsByViews?.forEach((event: any) => {
    if (event.product_id && event.products) {
      if (!productViewCounts[event.product_id]) {
        productViewCounts[event.product_id] = {
          name: event.products.name,
          count: 0,
        };
      }
      productViewCounts[event.product_id].count++;
    }
  });

  const productClickCounts: Record<string, { name: string; count: number }> = {};
  topProductsByClicks?.forEach((event: any) => {
    if (event.product_id && event.products) {
      if (!productClickCounts[event.product_id]) {
        productClickCounts[event.product_id] = {
          name: event.products.name,
          count: 0,
        };
      }
      productClickCounts[event.product_id].count++;
    }
  });

  const topViews = Object.entries(productViewCounts)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topClicks = Object.entries(productClickCounts)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    storeViews: storeViews || 0,
    productViews: productViews || 0,
    ctaClicks: ctaClicks || 0,
    activeProducts: activeProducts || 0,
    outOfStock: outOfStock || 0,
    topProductsByViews: topViews,
    topProductsByClicks: topClicks,
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
  const supabase = await createClient();

  await supabase.from("events").insert({
    store_id: storeId,
    kind,
    product_id: data?.productId || null,
    query: data?.query || null,
    cta_kind: data?.ctaKind || null,
    session_id: data?.sessionId || null,
    client_hash: data?.clientHash || null,
    occurred_at: new Date().toISOString(),
  } as any);
}
