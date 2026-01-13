const STORAGE_BUCKET = process.env.STORAGE_BUCKET ?? "public-images";
const STORAGE_PUBLIC_URL = process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL;

export function getPublicImageUrl(path: string): string {
  if (!STORAGE_PUBLIC_URL) {
    throw new Error("NEXT_PUBLIC_STORAGE_SUPABASE_URL is not defined");
  }
  return `${STORAGE_PUBLIC_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

export function parseStoragePath(value: string): string {
  if (!value) return value;
  if (!value.startsWith("http")) {
    return value.replace(/^\/+/, "");
  }

  try {
    const url = new URL(value);
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const index = url.pathname.indexOf(marker);
    if (index >= 0) {
      return url.pathname.slice(index + marker.length);
    }
  } catch {
    return value;
  }

  return value;
}

export function generateStoragePath(
  storeId: string,
  type: "logo" | "product",
  productId?: string,
  extension: string = "png"
): string {
  const uuid = crypto.randomUUID();
  const safeExt = extension.replace(".", "");

  if (type === "logo") {
    return `stores/${storeId}/logo/${uuid}.${safeExt}`;
  }

  if (type === "product" && productId) {
    return `stores/${storeId}/products/${productId}/${uuid}.${safeExt}`;
  }

  throw new Error("Invalid storage path configuration");
}
