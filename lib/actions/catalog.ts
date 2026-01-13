"use server";

import { createCatalogSchema, updateCatalogSchema } from "@/lib/validators/catalog";
import { revalidatePath } from "next/cache";
import { ensureWithinPlanLimit } from "@/lib/utils/plan-check";
import { connectToDatabase } from "@/lib/db/connection";
import { CatalogModel } from "@/lib/db/models/catalog";
import { StoreModel } from "@/lib/db/models/store";
import { serializeDoc } from "@/lib/db/serialization";
import { requireAuthUserId } from "@/lib/auth";

export async function createCatalog(storeId: string, data: any) {
  const userId = await requireAuthUserId();

  const planCheck = await ensureWithinPlanLimit(storeId, userId, "catalogs");
  if (!planCheck.allowed) {
    return { error: planCheck.error };
  }

  const validation = createCatalogSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  await connectToDatabase();
  const store = await StoreModel.findOne({ _id: storeId, owner_id: userId });
  if (!store) {
    return { error: "No autorizado" };
  }

  try {
    const catalog = await CatalogModel.create({
      ...validation.data,
      store_id: storeId,
    });
    revalidatePath("/app/catalogs");
    return { data: serializeDoc(catalog) };
  } catch (error: any) {
    if (error?.code === 11000) {
      return { error: "Ya existe un catálogo con este slug" };
    }
    return { error: "No se pudo crear el catálogo" };
  }
}

export async function updateCatalog(catalogId: string, data: any) {
  const userId = await requireAuthUserId();

  const validation = updateCatalogSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  await connectToDatabase();
  const catalog = await CatalogModel.findOne({ _id: catalogId });
  if (!catalog) {
    return { error: "Catálogo no encontrado" };
  }

  const store = await StoreModel.findOne({ _id: catalog.store_id, owner_id: userId });
  if (!store) {
    return { error: "No autorizado" };
  }

  const updated = await CatalogModel.findByIdAndUpdate(
    catalogId,
    { ...validation.data, updated_at: new Date() },
    { new: true }
  );

  revalidatePath("/app/catalogs");
  return { data: serializeDoc(updated) };
}

export async function deleteCatalog(catalogId: string) {
  const userId = await requireAuthUserId();
  await connectToDatabase();

  const catalog = await CatalogModel.findOne({ _id: catalogId });
  if (!catalog) {
    return { error: "Catálogo no encontrado" };
  }

  const store = await StoreModel.findOne({ _id: catalog.store_id, owner_id: userId });
  if (!store) {
    return { error: "No autorizado" };
  }

  await CatalogModel.deleteOne({ _id: catalogId });
  revalidatePath("/app/catalogs");
  return { success: true };
}

export async function getCatalogs(storeId: string) {
  const userId = await requireAuthUserId();
  await connectToDatabase();

  const store = await StoreModel.findOne({ _id: storeId, owner_id: userId });
  if (!store) {
    return { error: "No autorizado" };
  }

  const catalogs = await CatalogModel.find({ store_id: storeId }).sort({ sort_order: 1 });
  return { data: catalogs.map((catalog) => serializeDoc(catalog)) };
}
