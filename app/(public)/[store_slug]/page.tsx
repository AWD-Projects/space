import { getPublicStore } from "@/lib/actions/public";
import { trackEvent } from "@/lib/actions/analytics";
import { notFound } from "next/navigation";
import StoreView from "@/components/public/store-view";

interface PageProps {
  params: Promise<{ store_slug: string }>;
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
