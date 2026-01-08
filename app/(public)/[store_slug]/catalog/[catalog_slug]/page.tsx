import { getPublicCatalog, getPublicStore } from "@/lib/actions/public";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import ProductCard from "@/components/public/product-card";
import { formatNumberMX } from "@/lib/utils/formatters";

interface PageProps {
  params: Promise<{ store_slug: string; catalog_slug: string }>;
}

export default async function CatalogPage({ params }: PageProps) {
  const { store_slug, catalog_slug } = await params;

  const { data: storeRaw } = await getPublicStore(store_slug);
  const { data: catalogRaw, error } = await getPublicCatalog(store_slug, catalog_slug);

  if (error || !catalogRaw || !storeRaw) {
    notFound();
  }

  const store = storeRaw as any;
  const catalog = catalogRaw as any;
  const activeProducts = (catalog.products || []).filter(
    (p: any) => p.status === "active" && (p.stock > 0 || p.out_of_stock_behavior === "label")
  );

  const template = store.template || "minimal";

  const gridCols = template === "compact"
    ? "grid-cols-1"
    : template === "visual"
    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    : "grid-cols-1 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Premium & Minimal */}
      <div
        className="py-16 sm:py-20 md:py-24 px-4 border-b-2"
        style={{ borderBottomColor: store.primary_color }}
      >
        <div className="container mx-auto max-w-6xl">
          <Link href={`/${store_slug}`}>
            <button
              className="flex items-center gap-2 transition-opacity hover:opacity-70 text-sm sm:text-base font-light mb-8 sm:mb-10"
              style={{ color: store.accent_color }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a {store.name}</span>
            </button>
          </Link>
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 tracking-tight">
              {catalog.name}
            </h1>
            <p
              className="text-sm sm:text-base font-light"
              style={{ color: store.accent_color }}
            >
              {formatNumberMX(activeProducts.length)} {activeProducts.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid - Premium Layout */}
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        {activeProducts.length === 0 ? (
          <div className="text-center py-20 sm:py-28">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 flex items-center justify-center">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-3 tracking-tight">Sin productos</h2>
            <p className="text-sm sm:text-base text-gray-400 font-light">
              No hay productos disponibles en este catálogo
            </p>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-6 sm:gap-8 md:gap-10`}>
            {activeProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                store={store}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
