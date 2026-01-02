export function getPublicImageUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/public-images/${path}`;
}

export function generateStoragePath(
  storeId: string,
  type: "logo" | "product",
  productId?: string
): string {
  const uuid = crypto.randomUUID();

  if (type === "logo") {
    return `stores/${storeId}/logo/${uuid}.png`;
  }

  if (type === "product" && productId) {
    return `stores/${storeId}/products/${productId}/${uuid}.jpg`;
  }

  throw new Error("Invalid storage path configuration");
}
