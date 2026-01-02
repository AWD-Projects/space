"use server";

import { createClient } from "@/lib/supabase/server";
import { createCatalogSchema, updateCatalogSchema } from "@/lib/validators/catalog";
import { revalidatePath } from "next/cache";

export async function createCatalog(storeId: string, data: any) {
  const supabase = await createClient();

  const validation = createCatalogSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { data: catalog, error } = await (supabase
    .from("catalogs") as any)
    .insert({
      ...validation.data,
      store_id: storeId,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/catalogs");
  return { data: catalog };
}

export async function updateCatalog(catalogId: string, data: any) {
  const supabase = await createClient();

  const validation = updateCatalogSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { data: catalog, error } = await (supabase
    .from("catalogs") as any)
    .update({
      ...validation.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", catalogId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/catalogs");
  return { data: catalog };
}

export async function deleteCatalog(catalogId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("catalogs")
    .delete()
    .eq("id", catalogId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/catalogs");
  return { success: true };
}

export async function getCatalogs(storeId: string) {
  const supabase = await createClient();

  const { data: catalogs, error } = await supabase
    .from("catalogs")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order");

  if (error) {
    return { error: error.message };
  }

  return { data: catalogs };
}
