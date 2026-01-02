import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Package } from "lucide-react";
import { formatPriceDisplay } from "@/lib/utils/formatters";

interface ProductCardProps {
  product: any;
  store: any;
}

export default function ProductCard({ product, store }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;
  const firstImage = product.images?.[0];

  return (
    <Link href={`/${store.slug}/product/${product.slug}`} className="group block">
      <div className="h-full flex flex-col">
        {/* Product Image - Clean and Minimal */}
        <div className="aspect-square bg-gray-50 relative overflow-hidden mb-4 border-2 border-transparent transition-colors duration-300 group-hover:border-gray-200">
          {firstImage?.url ? (
            <Image
              src={firstImage.url}
              alt={product.name}
              fill
              className="object-cover transition-opacity duration-500 group-hover:opacity-95"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 sm:h-14 sm:w-14 text-gray-200" />
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute top-3 right-3">
              <span className="text-xs font-light text-gray-500 bg-white/90 backdrop-blur-sm px-2.5 py-1">
                Agotado
              </span>
            </div>
          )}
        </div>

        {/* Product Info - Minimal Typography */}
        <div className="flex-1 flex flex-col gap-2">
          <h3 className="text-sm sm:text-base text-gray-900 font-light tracking-wide line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors">
            {product.name}
          </h3>

          {product.price_text && (
            <p className="text-sm sm:text-base font-normal  transition-colors" style={{ color: store.accent_color }}>
              {formatPriceDisplay(product.price_text)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
