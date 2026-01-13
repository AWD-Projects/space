"use server";

import { connectToDatabase } from "@/lib/db/connection";
import { StoreModel } from "@/lib/db/models/store";
import { CatalogModel } from "@/lib/db/models/catalog";
import { ProductModel } from "@/lib/db/models/product";
import { ProductImageModel } from "@/lib/db/models/product-image";
import { serializeDoc } from "@/lib/db/serialization";
import { getPublicImageUrl, parseStoragePath } from "@/lib/utils/storage";

function attachImages(products: any[], images: any[]): any[] {
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

  return products.map((product) => ({
    ...serializeDoc(product),
    images: imagesByProduct.get(String(product._id)) ?? [],
  }));
}

export async function getPublicStore(slug: string) {
  await connectToDatabase();
  const store = await StoreModel.findOne({ slug, status: "published" });
  if (!store) {
    return { error: "Store not found" };
  }

  const catalogs = await CatalogModel.find({ store_id: store._id }).sort({ sort_order: 1 });
  const products = await ProductModel.find({ store_id: store._id }).sort({ sort_order: 1 });
  const productIds = products.map((product) => String(product._id));
  const images = await ProductImageModel.find({ product_id: { $in: productIds } }).sort({ sort_order: 1 });

  const productsWithImages = attachImages(products, images) as any[];
  const productsByCatalog = new Map<string, any[]>();
  productsWithImages.forEach((product: any) => {
    const catalogId = product.catalog_id ?? "__uncategorized__";
    const list = productsByCatalog.get(catalogId) ?? [];
    list.push(product);
    productsByCatalog.set(catalogId, list);
  });

  const catalogPayload = catalogs.map((catalog) => ({
    ...serializeDoc(catalog),
    products: productsByCatalog.get(String(catalog._id)) ?? [],
  }));

  return {
    data: {
      ...serializeDoc(store),
      catalogs: catalogPayload,
    },
  };
}

export async function getPublicCatalog(storeSlug: string, catalogSlug: string) {
  await connectToDatabase();
  const store = await StoreModel.findOne({ slug: storeSlug, status: "published" });
  if (!store) {
    return { error: "Store not found" };
  }

  const catalog = await CatalogModel.findOne({
    store_id: store._id,
    slug: catalogSlug,
    visible: true,
  });

  if (!catalog) {
    return { error: "Catalog not found" };
  }

  const products = await ProductModel.find({
    store_id: store._id,
    catalog_id: String(catalog._id),
  }).sort({ sort_order: 1 });
  const productIds = products.map((product) => String(product._id));
  const images = await ProductImageModel.find({ product_id: { $in: productIds } }).sort({ sort_order: 1 });
  const productsWithImages = attachImages(products, images);

  return {
    data: {
      ...serializeDoc(catalog),
      products: productsWithImages,
    },
  };
}

export async function getPublicProduct(storeSlug: string, productSlug: string) {
  await connectToDatabase();
  const store = await StoreModel.findOne({ slug: storeSlug, status: "published" });
  if (!store) {
    return { error: "Store not found" };
  }

  const product = await ProductModel.findOne({
    store_id: store._id,
    slug: productSlug,
    status: "active",
  });

  if (!product) {
    return { error: "Product not available" };
  }

  if (product.stock === 0 && product.out_of_stock_behavior === "auto_hide") {
    return { error: "Product not available" };
  }

  const catalog = product.catalog_id
    ? await CatalogModel.findOne({ _id: product.catalog_id })
    : null;
  const images = await ProductImageModel.find({ product_id: String(product._id) }).sort({ sort_order: 1 });
  const productWithImages = attachImages([product], images)[0];

  return {
    data: {
      product: {
        ...productWithImages,
        catalog: catalog ? serializeDoc(catalog) : null,
      },
      store: serializeDoc(store),
    },
  };
}

export async function searchProducts(storeId: string, query: string) {
  await connectToDatabase();
  const sanitized = query.trim();
  if (!sanitized) {
    return { data: [] };
  }

  const products = await ProductModel.find({
    store_id: storeId,
    status: "active",
    $text: { $search: sanitized },
  }).sort({ sort_order: 1 });
  const productIds = products.map((product) => String(product._id));
  const images = await ProductImageModel.find({ product_id: { $in: productIds } }).sort({ sort_order: 1 });
  const productsWithImages = attachImages(products, images);
  return { data: productsWithImages };
}
