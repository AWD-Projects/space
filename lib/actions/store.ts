"use server";

import { createStoreSchema, updateStoreSchema } from "@/lib/validators/store";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connection";
import { StoreModel } from "@/lib/db/models/store";
import { serializeDoc } from "@/lib/db/serialization";
import { requireAuthUserId } from "@/lib/auth";

export async function createStore(data: any) {
  const userId = await requireAuthUserId();

  const validation = createStoreSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  await connectToDatabase();

  try {
    const store = await StoreModel.create({
      ...validation.data,
      owner_id: userId,
      status: "draft",
      template: "minimal",
    });

    revalidatePath("/app/home");
    revalidatePath("/app/branding");
    return { data: serializeDoc(store) };
  } catch (error: any) {
    if (error?.code === 11000) {
      return { error: "Ya existe una tienda con este slug o usuario." };
    }
    return { error: "No se pudo crear la tienda" };
  }

}

export async function updateStore(storeId: string, data: any) {
  const userId = await requireAuthUserId();

  const validation = updateStoreSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  await connectToDatabase();
  const store = await StoreModel.findOneAndUpdate(
    { _id: storeId, owner_id: userId },
    {
      ...validation.data,
      updated_at: new Date(),
    },
    { new: true }
  );

  if (!store) {
    return { error: "No se encontró la tienda" };
  }

  revalidatePath("/app/home");
  revalidatePath("/app/branding");
  revalidatePath("/app/preview");
  return { data: serializeDoc(store) };
}

export async function publishStore(storeId: string) {
  const userId = await requireAuthUserId();
  await connectToDatabase();

  const store = await StoreModel.findOneAndUpdate(
    { _id: storeId, owner_id: userId },
    { status: "published", updated_at: new Date() },
    { new: true }
  );

  if (!store) {
    return { error: "No se encontró la tienda" };
  }

  revalidatePath("/app/home");
  revalidatePath("/app/preview");
  revalidatePath(`/${store.slug}`);
  return { data: serializeDoc(store) };
}

export async function getMyStore() {
  const userId = await requireAuthUserId();
  await connectToDatabase();

  const store = await StoreModel.findOne({ owner_id: userId });
  if (!store) {
    return { data: null };
  }

  return { data: serializeDoc(store) };
}
