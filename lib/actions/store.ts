"use server";

import { createClient } from "@/lib/supabase/server";
import { createStoreSchema, updateStoreSchema } from "@/lib/validators/store";
import { revalidatePath } from "next/cache";

export async function createStore(data: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const validation = createStoreSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { data: store, error } = await (supabase
    .from("stores") as any)
    .insert({
      ...validation.data,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/home");
  revalidatePath("/branding");
  return { data: store };
}

export async function updateStore(storeId: string, data: any) {
  const supabase = await createClient();

  const validation = updateStoreSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { data: store, error } = await (supabase
    .from("stores") as any)
    .update({
      ...validation.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/home");
  revalidatePath("/branding");
  revalidatePath("/preview");
  return { data: store };
}

export async function publishStore(storeId: string) {
  const supabase = await createClient();

  const { data: store, error } = await (supabase
    .from("stores") as any)
    .update({
      status: "published",
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/home");
  revalidatePath("/preview");
  revalidatePath(`/${store.slug}`);
  return { data: store };
}

export async function getMyStore() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { data: store, error } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return { error: error.message };
  }

  return { data: store };
}
