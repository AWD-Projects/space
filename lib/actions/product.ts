"use server";

import { createClient } from "@/lib/supabase/server";
import { createProductSchema, updateProductSchema } from "@/lib/validators/product";
import { revalidatePath } from "next/cache";

export async function createProduct(storeId: string, data: any) {
  const supabase = await createClient();

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
