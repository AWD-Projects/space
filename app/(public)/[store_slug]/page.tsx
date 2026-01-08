import { getPublicStore } from "@/lib/actions/public";
import { trackEvent } from "@/lib/actions/analytics";
import { notFound } from "next/navigation";
import StoreView from "@/components/public/store-view";
import type { Metadata } from "next";

export type PageProps = {
  params: Promise<{ store_slug: string }>;
};

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { store_slug } = await params;
  const { data } = await getPublicStore(store_slug);

  if (!data) {
    return {
      title: "Tienda no encontrada · SPACE",
      description: "Este catálogo ya no está disponible.",
    };
  }

  const store = data as any;
  const description = store.description || `Explora el catálogo de ${store.name} en SPACE.`;

  return {
    title: `${store.name} · Catálogo`,
    description,
    openGraph: {
      title: `${store.name} · Catálogo`,
      description,
      url: `/${store.slug}`,
    },
    twitter: {
      title: `${store.name} · Catálogo`,
      description,
    },
  };
}

export default async function StorePage({ params }: PageProps) {
  const { store_slug } = await params;
  const { data: storeRaw, error } = await getPublicStore(store_slug);

  if (error || !storeRaw) {
    notFound();
  }

  const store = storeRaw as any;

  // Track store view (fire and forget)
  trackEvent(store.id, "store_view").catch(() => {});

  return <StoreView store={store} />;
}
