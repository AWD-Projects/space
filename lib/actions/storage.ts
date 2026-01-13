"use server";

import { storageAdminClient } from "@/lib/storage/server";
import { connectToDatabase } from "@/lib/db/connection";
import { StoreModel } from "@/lib/db/models/store";
import { generateStoragePath, getPublicImageUrl } from "@/lib/utils/storage";
import { requireAuthUserId } from "@/lib/auth";

const STORAGE_BUCKET = process.env.STORAGE_BUCKET ?? "public-images";

function getExtension(fileName?: string, contentType?: string) {
  if (fileName && fileName.includes(".")) {
    return fileName.split(".").pop() || "png";
  }
  if (contentType) {
    const parts = contentType.split("/");
    if (parts.length === 2) {
      return parts[1];
    }
  }
  return "png";
}

export async function createSignedUploadUrl({
  storeId,
  productId,
  fileName,
  contentType,
}: {
  storeId: string;
  productId?: string;
  fileName?: string;
  contentType?: string;
}) {
  const userId = await requireAuthUserId();
  await connectToDatabase();

  const store = await StoreModel.findOne({ _id: storeId, owner_id: userId });
  if (!store) {
    return { error: "No autorizado" };
  }

  const extension = getExtension(fileName, contentType);
  const path = generateStoragePath(storeId, productId ? "product" : "logo", productId, extension);

  const { data, error } = await storageAdminClient
    .storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return { error: error?.message ?? "No se pudo generar el URL firmado" };
  }

  return {
    data: {
      signedUrl: data.signedUrl,
      path,
      publicUrl: getPublicImageUrl(path),
    },
  };
}
