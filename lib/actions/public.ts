"use server";

import { createClient } from "@/lib/supabase/server";

// Helper function to map 'path' to 'url' in images
function mapImagesToUrl(data: any): any {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(item => mapImagesToUrl(item));
  }

  if (typeof data === 'object') {
    const mapped = { ...data };

    // Map images array
    if (mapped.images) {
      mapped.images = mapped.images.map((img: any) => ({
        ...img,
        url: img.path
      }));
    }

    // Map nested products
    if (mapped.products) {
      mapped.products = mapImagesToUrl(mapped.products);
    }

    // Map nested catalogs
    if (mapped.catalogs) {
      mapped.catalogs = mapImagesToUrl(mapped.catalogs);
    }

    return mapped;
  }

  return data;
}

export async function getPublicStore(slug: string) {
  const supabase = await createClient();

  const { data: store, error } = await supabase
    .from("stores")
    .select(`
      *,
      catalogs(
        *,
        products(
          *,
          images:product_images(*)
        )
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: mapImagesToUrl(store) };
}

export async function getPublicCatalog(storeSlug: string, catalogSlug: string) {
  const supabase = await createClient();

  // Get store first
  const { data: storeRaw } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", storeSlug)
    .eq("status", "published")
    .single();

  if (!storeRaw) {
    return { error: "Store not found" };
  }

  const store = storeRaw as any;

  // Get catalog with products
  const { data: catalog, error } = await supabase
    .from("catalogs")
    .select(`
      *,
      products(
        *,
        images:product_images(*)
      )
    `)
    .eq("store_id", store.id)
    .eq("slug", catalogSlug)
    .eq("visible", true)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: mapImagesToUrl(catalog) };
}

export async function getPublicProduct(storeSlug: string, productSlug: string) {
  const supabase = await createClient();

  // Get store first
  const { data: storeRaw } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", storeSlug)
    .eq("status", "published")
    .single();

  if (!storeRaw) {
    return { error: "Store not found" };
  }

  const store = storeRaw as any;

  // Get product with images
  const { data: productRaw, error } = await supabase
    .from("products")
    .select(`
      *,
      images:product_images(*),
      catalog:catalogs(*)
    `)
    .eq("store_id", store.id)
    .eq("slug", productSlug)
    .eq("status", "active")
    .single();

  if (error) {
    return { error: error.message };
  }

  const product = productRaw as any;

  // Check if product is hidden by stock
  if (product.stock === 0 && product.out_of_stock_behavior === "auto_hide") {
    return { error: "Product not available" };
  }

  return { data: { product: mapImagesToUrl(product), store } };
}

export async function searchProducts(storeId: string, query: string) {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      images:product_images(*)
    `)
    .eq("store_id", storeId)
    .eq("status", "active")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order("sort_order");

  return { data: mapImagesToUrl(products || []) };
}
