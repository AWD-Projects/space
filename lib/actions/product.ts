"use server";

import { createClient } from "@/lib/supabase/server";
import { createProductSchema, updateProductSchema } from "@/lib/validators/product";
import { generateSlug } from "@/lib/utils/slug";
import { revalidatePath } from "next/cache";
import { ensureWithinPlanLimit } from "@/lib/utils/plan-check";

interface BulkProductRow {
  rowNumber?: number;
  name?: string;
  slug?: string;
  url?: string;
  description?: string;
  price_text?: string;
  stock?: string | number;
  catalog_slug?: string;
}

function extractSlugFromUrl(input: string) {
  try {
    const url = new URL(input);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch {
    const sanitized = input.split(/[?#]/)[0];
    const parts = sanitized.split("/").filter(Boolean);
    return parts[parts.length - 1] || sanitized;
  }
}

export async function createProduct(storeId: string, data: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const planCheck = await ensureWithinPlanLimit(storeId, user.id, "products");
  if (!planCheck.allowed) {
    return { error: planCheck.error };
  }

  // Separate images from product data
  const { images, ...productData } = data;

  const validation = createProductSchema.safeParse(productData);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { data: product, error } = await (supabase
    .from("products") as any)
    .insert({
      ...validation.data,
      store_id: storeId,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Insert product images if provided
  if (images && images.length > 0) {
    const imageRecords = images.map((img: any, index: number) => ({
      product_id: product.id,
      path: img.url, // Database uses 'path' column, not 'url'
      sort_order: img.sort_order || index,
    }));

    await (supabase.from("product_images") as any).insert(imageRecords);
  }

  revalidatePath("/products");
  return { data: product };
}

export async function updateProduct(productId: string, data: any) {
  const supabase = await createClient();

  // Separate images from product data
  const { images, ...productData } = data;

  const validation = updateProductSchema.safeParse(productData);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { data: product, error } = await (supabase
    .from("products") as any)
    .update({
      ...validation.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Update product images if provided
  if (images !== undefined) {
    // Delete existing images
    await supabase.from("product_images").delete().eq("product_id", productId);

    // Insert new images
    if (images.length > 0) {
      const imageRecords = images.map((img: any, index: number) => ({
        product_id: productId,
        path: img.url, // Database uses 'path' column, not 'url'
        sort_order: img.sort_order || index,
      }));

      await (supabase.from("product_images") as any).insert(imageRecords);
    }
  }

  revalidatePath("/products");
  return { data: product };
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/products");
  return { success: true };
}

export async function getProducts(storeId: string) {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(`
      *,
      images:product_images(*)
    `)
    .eq("store_id", storeId)
    .order("sort_order");

  if (error) {
    return { error: error.message };
  }

  // Map 'path' to 'url' for frontend compatibility
  const productsWithUrls = products?.map((product: any) => ({
    ...product,
    images: product.images?.map((img: any) => ({
      ...img,
      url: img.path // Map path to url for frontend
    }))
  }));

  return { data: productsWithUrls };
}

export async function importProducts(storeId: string, rows: BulkProductRow[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const initialCheck = await ensureWithinPlanLimit(storeId, user.id, "products");
  if (!initialCheck.allowed) {
    return { error: initialCheck.error };
  }

  const { data: catalogs, error: catalogError } = await supabase
    .from("catalogs")
    .select("id, slug")
    .eq("store_id", storeId);

  if (catalogError) {
    return { error: catalogError.message };
  }

  const { data: existingProducts, error: productsError } = await supabase
    .from("products")
    .select("slug")
    .eq("store_id", storeId);

  if (productsError) {
    return { error: productsError.message };
  }

  const catalogMap = new Map((catalogs || []).map((catalog: any) => [catalog.slug?.toLowerCase(), catalog.id]));
  const usedSlugs = new Set((existingProducts || []).map((product: any) => product.slug));

  const errors: { rowNumber: number; message: string }[] = [];
  let successCount = 0;

  for (const [index, row] of (rows || []).entries()) {
    const rowNumber = row.rowNumber ?? index + 2;
    const name = row.name?.trim();

    if (!name) {
      errors.push({ rowNumber, message: "El nombre es obligatorio" });
      continue;
    }

    const slugFromUrl = row.url?.trim() ? extractSlugFromUrl(row.url.trim()) : "";
    const slugInput = row.slug?.trim();
    let slugCandidate = slugFromUrl || slugInput || "";
    slugCandidate = slugCandidate ? generateSlug(slugCandidate) : "";
    let slug = slugCandidate || generateSlug(name);

    if (!slug) {
      errors.push({ rowNumber, message: "No se pudo generar el slug" });
      continue;
    }

    if (slugInput) {
      if (usedSlugs.has(slug)) {
        errors.push({ rowNumber, message: `El slug "${slug}" ya existe` });
        continue;
      }
    } else {
      const baseSlug = slug;
      let counter = 1;
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter++}`;
      }
    }

    usedSlugs.add(slug);

    let catalogId: string | null = null;
    if (row.catalog_slug && row.catalog_slug.trim() !== "") {
      const normalizedCatalogSlug = row.catalog_slug.trim().toLowerCase();
      const catalog = catalogMap.get(normalizedCatalogSlug);
      if (!catalog) {
        errors.push({ rowNumber, message: `Catálogo "${normalizedCatalogSlug}" no encontrado` });
        continue;
      }
      catalogId = catalog;
    }

    let stockValue = 0;
    if (row.stock !== undefined && row.stock !== null && row.stock !== "") {
      const normalizedStock = typeof row.stock === "string" ? row.stock.replace(/,/g, "") : row.stock;
      const parsedStock = Number(normalizedStock);
      if (Number.isNaN(parsedStock) || parsedStock < 0) {
        errors.push({ rowNumber, message: "Stock inválido" });
        continue;
      }
      stockValue = Math.floor(parsedStock);
    }

    const productData = {
      name,
      slug,
      description: row.description?.trim() ? row.description.trim() : null,
      price_text: row.price_text?.trim() ? row.price_text.trim() : null,
      stock: stockValue,
      status: "active" as const,
      catalog_id: catalogId,
      out_of_stock_behavior: "label" as const,
      cta_override: null,
      payment_url: null,
      whatsapp_message: null,
      contact_url: null,
      sort_order: 0,
    };

    const validation = createProductSchema.safeParse(productData);
    if (!validation.success) {
      errors.push({ rowNumber, message: validation.error.issues[0].message });
      continue;
    }

    const { error } = await (supabase
      .from("products") as any)
      .insert({
        ...validation.data,
        store_id: storeId,
      });

    if (error) {
      errors.push({ rowNumber, message: error.message });
      continue;
    }

    successCount++;

    // Re-check plan limit before the next insert
    const planCheck = await ensureWithinPlanLimit(storeId, user.id, "products");
    if (!planCheck.allowed) {
      errors.push({ rowNumber, message: planCheck.error ?? "Límite alcanzado" });
      break;
    }
  }

  revalidatePath("/products");

  return {
    data: {
      imported: successCount,
      failed: errors.length,
      errors,
    },
  };
}
