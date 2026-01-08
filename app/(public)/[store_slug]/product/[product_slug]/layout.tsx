import type { Metadata } from "next";
import { getPublicProduct } from "@/lib/actions/public";

type ProductLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ store_slug: string; product_slug: string }>;
};

export async function generateMetadata({ params }: ProductLayoutProps): Promise<Metadata> {
  const { store_slug, product_slug } = await params;
  const { data } = await getPublicProduct(store_slug, product_slug);

  if (!data) {
    return {
      title: "Producto no disponible · SPACE",
      description: "Este producto ya no está publicado",
    };
  }

  const product = data.product as any;
  const store = data.store as any;
  const description = product.description || store.description || `Descubre ${product.name} en ${store.name}`;

  return {
    title: `${product.name} · ${store.name}`,
    description,
    openGraph: {
      title: `${product.name} · ${store.name}`,
      description,
      url: `/${store.slug}/product/${product.slug}`,
    },
    twitter: {
      title: `${product.name} · ${store.name}`,
      description,
    },
  };
}

export default function ProductLayout({ children }: ProductLayoutProps) {
  return <>{children}</>;
}
