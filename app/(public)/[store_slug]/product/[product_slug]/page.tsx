"use client";

import { getPublicProduct } from "@/lib/actions/public";
import { trackEvent } from "@/lib/actions/analytics";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, ExternalLink, Mail, Package } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumberMX, formatPriceDisplay } from "@/lib/utils/formatters";

export type PageProps = {
  params: Promise<{ store_slug: string; product_slug: string }>;
};

export default function ProductPage({ params }: PageProps) {
  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    async function loadData() {
      const { store_slug, product_slug } = await params;
      const { data, error } = await getPublicProduct(store_slug, product_slug);

      if (error || !data) {
        notFound();
      }

      const prod = data.product as any;
      const str = data.store as any;

      setProduct(prod);
      setStore(str);
      setLoading(false);

      // Track product view
      trackEvent(str.id, "product_view", { productId: prod.id }).catch(() => {});
    }

    loadData();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b-2 border-gray-200">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-5">
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-6 sm:space-y-8">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  // Use product CTA override if set, otherwise use store default
  const ctaKind = (product.cta_override && product.cta_override !== "")
    ? product.cta_override
    : store.default_cta;

  console.log("Product CTA Debug:", {
    productName: product.name,
    productCtaOverride: product.cta_override,
    storeDefaultCta: store.default_cta,
    finalCtaKind: ctaKind,
    storeWhatsappPhone: store.whatsapp_phone,
    storeDefaultPaymentUrl: store.default_payment_url,
    storeContactEmail: store.contact_email,
    productPaymentUrl: product.payment_url,
    productContactUrl: product.contact_url,
  });

  let ctaUrl = "";
  let ctaText = "";
  let ctaIcon = null;

  if (ctaKind === "whatsapp") {
    const phone = store.whatsapp_phone || "";
    const message = product.whatsapp_message || `Hola 👋 vi el producto ${product.name} en tu Space. ¿Está disponible?`;
    if (phone) {
      ctaUrl = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
      ctaText = "Contactar por WhatsApp";
      ctaIcon = <MessageCircle className="h-5 w-5" />;
    }
  } else if (ctaKind === "payment_link") {
    const paymentUrl = product.payment_url || store.default_payment_url || "";
    if (paymentUrl) {
      ctaUrl = paymentUrl;
      ctaText = "Comprar Ahora";
      ctaIcon = <ExternalLink className="h-5 w-5" />;
    }
  } else if (ctaKind === "contact") {
    const contactUrl = product.contact_url || (store.contact_email ? `mailto:${store.contact_email}` : "");
    if (contactUrl) {
      ctaUrl = contactUrl;
      ctaText = "Contactar";
      ctaIcon = <Mail className="h-5 w-5" />;
    }
  }

  console.log("CTA Result:", { ctaUrl, ctaText, isOutOfStock });

  async function handleCtaClick() {
    await trackEvent(store.id, "cta_click", {
      productId: product.id,
      ctaKind
    });
  }

  const images = product.images || [];
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Premium & Minimal */}
      <div
        className="border-b-2 bg-white sticky top-0 z-10 backdrop-blur-sm bg-white/95"
        style={{ borderBottomColor: store.primary_color }}
      >
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-5">
          <Link href={`/${store.slug}`}>
            <button
              className="flex items-center gap-2 transition-opacity hover:opacity-70 text-sm sm:text-base font-light"
              style={{ color: store.accent_color }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Product Content - Premium Layout */}
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16">
          {/* Images Gallery - Clean & Spacious */}
          <div className="space-y-4 sm:space-y-5">
            {/* Main Image */}
            <div className="aspect-square bg-gray-50 overflow-hidden relative">
              {hasImages ? (
                <Image
                  src={images[selectedImage].url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-gray-200" />
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute top-4 right-4">
                  <span className="text-xs sm:text-sm font-light text-gray-500 bg-white/90 backdrop-blur-sm px-3 py-1.5">
                    Agotado
                  </span>
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {images.map((img: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-gray-50 overflow-hidden transition-opacity ${
                      selectedImage === index
                        ? "opacity-100"
                        : "opacity-50 hover:opacity-75"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name} - ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info - Premium Typography */}
          <div className="space-y-6 sm:space-y-8 md:space-y-10">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 tracking-tight leading-tight">
                {product.name}
              </h1>
              {product.catalog && (
                <Link href={`/${store.slug}/catalog/${product.catalog.slug}`}>
                  <span
                    className="text-xs sm:text-sm uppercase tracking-widest transition-opacity hover:opacity-70"
                    style={{ color: store.accent_color }}
                  >
                    {product.catalog.name}
                  </span>
                </Link>
              )}
            </div>

            {product.price_text && (
              <div
                className="text-2xl sm:text-3xl md:text-4xl font-normal "
                style={{ color: store.primary_color }}
              >
                {formatPriceDisplay(product.price_text)}
              </div>
            )}

            {product.description && (
              <div className="prose max-w-none">
                <p
                  className="text-base sm:text-lg leading-relaxed font-light"
                  style={{ color: store.accent_color }}
                >
                  {product.description}
                </p>
              </div>
            )}

            <div
              className="border-t border-b py-5"
              style={{ borderColor: `${store.primary_color}15` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm sm:text-base font-light">Stock disponible</span>
                <span
                  className="text-base sm:text-lg font-normal"
                  style={{ color: store.primary_color }}
                >
                  {formatNumberMX(product.stock)} {product.stock === 1 ? 'unidad' : 'unidades'}
                </span>
              </div>
            </div>

            {!isOutOfStock && ctaUrl && (
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCtaClick}
                className="w-full flex items-center justify-center gap-3 text-white text-sm sm:text-base h-12 sm:h-14 transition-opacity hover:opacity-90 font-light tracking-wide"
                style={{ backgroundColor: store.primary_color }}
              >
                {ctaIcon}
                {ctaText}
              </a>
            )}

            {!isOutOfStock && !ctaUrl && (
              <div className="border border-gray-200 p-4 sm:p-5 text-center">
                <p className="text-xs sm:text-sm text-gray-500 font-light">
                  Botón de compra no disponible. El vendedor necesita configurar el método de contacto.
                </p>
              </div>
            )}

            {isOutOfStock && (
              <button
                disabled
                className="w-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm sm:text-base h-12 sm:h-14 cursor-not-allowed font-light tracking-wide"
              >
                Producto Agotado
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
