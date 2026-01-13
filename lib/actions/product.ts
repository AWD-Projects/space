"use server";

import { createProductSchema, updateProductSchema } from "@/lib/validators/product";
import { generateSlug } from "@/lib/utils/slug";
import { revalidatePath } from "next/cache";
import { ensureWithinPlanLimit } from "@/lib/utils/plan-check";
import { connectToDatabase } from "@/lib/db/connection";
import { ProductModel } from "@/lib/db/models/product";
import { ProductImageModel } from "@/lib/db/models/product-image";
import { CatalogModel } from "@/lib/db/models/catalog";
import { StoreModel } from "@/lib/db/models/store";
import { serializeDoc } from "@/lib/db/serialization";
import { requireAuthUserId } from "@/lib/auth";
import { getPublicImageUrl, parseStoragePath } from "@/lib/utils/storage";

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
  const userId = await requireAuthUserId();

  const planCheck = await ensureWithinPlanLimit(storeId, userId, "products");
  if (!planCheck.allowed) {
    return { error: planCheck.error };
  }

  // Separate images from product data
  const { images, id: productId, ...productData } = data;

  const validation = createProductSchema.safeParse(productData);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  await connectToDatabase();
  const store = await StoreModel.findOne({ _id: storeId, owner_id: userId });
  if (!store) {
    return { error: "No autorizado" };
  }

  try {
    const product = await ProductModel.create({
      ...(productId ? { _id: productId } : {}),
      ...validation.data,
      store_id: storeId,
    });

    if (images && images.length > 0) {
      const imageRecords = images.map((img: any, index: number) => ({
        product_id: String(product._id),
        path: parseStoragePath(img.path ?? img.url),
        sort_order: img.sort_order ?? index,
      }));

      await ProductImageModel.insertMany(imageRecords);
    }

    revalidatePath("/app/products");
    return { data: serializeDoc(product) };
  } catch (error: any) {
    if (error?.code === 11000) {
      return { error: "Ya existe un producto con este slug" };
    }
    return { error: "No se pudo crear el producto" };
  }
}

export async function updateProduct(productId: string, data: any) {
  const userId = await requireAuthUserId();

  // Separate images from product data
  const { images, ...productData } = data;

  const validation = updateProductSchema.safeParse(productData);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  await connectToDatabase();
  const product = await ProductModel.findOne({ _id: productId });
  if (!product) {
    return { error: "Producto no encontrado" };
  }

  const store = await StoreModel.findOne({ _id: product.store_id, owner_id: userId });
  if (!store) {
    return { error: "No autorizado" };
  }

  const updated = await ProductModel.findByIdAndUpdate(
    productId,
    {
      ...validation.data,
      updated_at: new Date(),
    },
    { new: true }
  );

  if (images !== undefined) {
    await ProductImageModel.deleteMany({ product_id: productId });

    if (images.length > 0) {
      const imageRecords = images.map((img: any, index: number) => ({
        product_id: productId,
        path: parseStoragePath(img.path ?? img.url),
        sort_order: img.sort_order ?? index,
      }));

      await ProductImageModel.insertMany(imageRecords);
    }
  }

  revalidatePath("/app/products");
  return { data: serializeDoc(updated) };
}

export async function deleteProduct(productId: string) {
  const userId = await requireAuthUserId();
  await connectToDatabase();

  const product = await ProductModel.findOne({ _id: productId });
  if (!product) {
    return { error: "Producto no encontrado" };
  }

  const store = await StoreModel.findOne({ _id: product.store_id, owner_id: userId });
  if (!store) {
    return { error: "No autorizado" };
  }

  await ProductModel.deleteOne({ _id: productId });
  await ProductImageModel.deleteMany({ product_id: productId });

  revalidatePath("/app/products");
  return { success: true };
}

export async function getProducts(storeId: string) {
  const userId = await requireAuthUserId();
  await connectToDatabase();
  const store = await StoreModel.findOne({ _id: storeId, owner_id: userId });
  if (!store) {
    return { error: "No autorizado" };
  }

  const products = await ProductModel.find({ store_id: storeId }).sort({ sort_order: 1 });
  const productIds = products.map((product) => String(product._id));
  const images = await ProductImageModel.find({ product_id: { $in: productIds } }).sort({ sort_order: 1 });

  const imagesByProduct = new Map<string, any[]>();
  images.forEach((img) => {
    const productId = String(img.product_id);
    const list = imagesByProduct.get(productId) ?? [];
    list.push({
      ...serializeDoc(img),
      url: getPublicImageUrl(parseStoragePath(img.path)),
    });
    imagesByProduct.set(productId, list);
  });

  const productsWithUrls = products.map((product) => {
    const serialized = serializeDoc(product) as any;
    const id = String(product._id);
    return {
      ...serialized,
      images: imagesByProduct.get(id) ?? [],
    };
  });

  return { data: productsWithUrls };
}

export async function importProducts(storeId: string, rows: BulkProductRow[]) {
  const userId = await requireAuthUserId();

  const initialCheck = await ensureWithinPlanLimit(storeId, userId, "products");
  if (!initialCheck.allowed) {
    return { error: initialCheck.error };
  }

  await connectToDatabase();
  const store = await StoreModel.findOne({ _id: storeId, owner_id: userId });
  if (!store) {
    return { error: "No autorizado" };
  }

  const catalogs = await CatalogModel.find({ store_id: storeId }).select("slug");
  const existingProducts = await ProductModel.find({ store_id: storeId }).select("slug");

  const catalogMap = new Map(
    catalogs.map((catalog: any) => [catalog.slug?.toLowerCase(), String(catalog._id)])
  );
  const usedSlugs = new Set(existingProducts.map((product: any) => product.slug));

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

    try {
      await ProductModel.create({
        ...validation.data,
        store_id: storeId,
      });
    } catch (error: any) {
      errors.push({ rowNumber, message: error?.message ?? "Error al guardar el producto" });
      continue;
    }

    successCount++;

    // Re-check plan limit before the next insert
    const planCheck = await ensureWithinPlanLimit(storeId, userId, "products");
    if (!planCheck.allowed) {
      errors.push({ rowNumber, message: planCheck.error ?? "Límite alcanzado" });
      break;
    }
  }

  revalidatePath("/app/products");

  return {
    data: {
      imported: successCount,
      failed: errors.length,
      errors,
    },
  };
}
