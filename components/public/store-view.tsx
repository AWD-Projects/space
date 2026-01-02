"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FolderOpen, X, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { searchProducts } from "@/lib/actions/public";
import { trackEvent } from "@/lib/actions/analytics";
import ProductCard from "./product-card";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { formatNumberMX } from "@/lib/utils/formatters";

interface StoreViewProps {
  store: any;
}

const PRODUCTS_PER_PAGE = 10;

export default function StoreView({ store }: StoreViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(async () => {
        setIsSearching(true);
        const { data } = await searchProducts(store.id, searchQuery);
        setSearchResults(data || []);
        setIsSearching(false);
        // Track search
        trackEvent(store.id, "search", { query: searchQuery }).catch(() => {});
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, store.id]);

  const visibleCatalogs = store.catalogs?.filter((c: any) => c.visible) || [];

  // Get all active products
  const allProducts = visibleCatalogs.flatMap((cat: any) =>
    (cat.products || []).filter((p: any) =>
      p.status === "active" && (p.stock > 0 || p.out_of_stock_behavior === "label")
    )
  );

  // Filter products by selected catalog
  const filteredProducts = selectedCatalog
    ? allProducts.filter((p: any) => p.catalog_id === selectedCatalog)
    : allProducts;

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCatalog, searchQuery]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Premium & Minimal */}
      <div
        className="relative py-16 sm:py-20 md:py-28 px-4 border-b-2"
        style={{ borderBottomColor: store.primary_color }}
      >
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-4 sm:mb-6 tracking-tight leading-tight">
            {store.name}
          </h1>
          {store.description && (
            <p className="text-base sm:text-lg md:text-xl mb-10 sm:mb-14 max-w-2xl mx-auto px-2 font-light leading-relaxed" style={{ color: store.accent_color }}>
              {store.description}
            </p>
          )}

          {/* Search - Minimal & Elegant */}
          <div className="max-w-lg mx-auto px-2 sm:px-0">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-gray-600" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="pl-11 pr-4 h-12 sm:h-13 bg-white border border-gray-200 hover:border-gray-300 transition-all text-sm sm:text-base rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400"
                style={{
                  '--focus-border-color': store.primary_color
                } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = store.primary_color}
                onBlur={(e) => e.target.style.borderColor = ''}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Premium & Minimal */}
      {visibleCatalogs.length > 0 && (
        <div className="border-b border-gray-100 bg-white sticky top-0 z-10 backdrop-blur-sm bg-white/95">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <nav className="flex items-center gap-6 sm:gap-8 py-5 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setSelectedCatalog(null)}
                className="flex-shrink-0 whitespace-nowrap pb-1 transition-all text-sm sm:text-base tracking-wide font-normal border-b-2"
                style={!selectedCatalog ? {
                  color: store.primary_color,
                  borderBottomColor: store.primary_color,
                  fontWeight: 500
                } : {
                  color: '#6B7280',
                  borderBottomColor: 'transparent'
                }}
              >
                Todos
              </button>
              {visibleCatalogs.map((catalog: any) => {
                const catalogProducts = allProducts.filter((p: any) => p.catalog_id === catalog.id);
                const isSelected = selectedCatalog === catalog.id;
                return (
                  <button
                    key={catalog.id}
                    onClick={() => setSelectedCatalog(catalog.id)}
                    className="flex-shrink-0 whitespace-nowrap pb-1 transition-all text-sm sm:text-base tracking-wide font-normal border-b-2 hover:text-gray-700"
                    style={isSelected ? {
                      color: store.primary_color,
                      borderBottomColor: store.primary_color,
                      fontWeight: 500
                    } : {
                      color: '#6B7280',
                      borderBottomColor: 'transparent'
                    }}
                  >
                    {catalog.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Content - Premium Layout */}
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        {searchQuery ? (
          <div>
            <div className="flex items-center justify-between mb-10 sm:mb-12">
              <h2 className="text-xl sm:text-2xl font-light text-gray-900 tracking-tight">
                Resultados para &ldquo;{searchQuery}&rdquo;
              </h2>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1.5 flex-shrink-0 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Limpiar</span>
              </button>
            </div>
            {isSearching ? (
              <ProductGridSkeleton count={6} />
            ) : searchResults.length === 0 ? (
              <div className="text-center py-20 sm:py-28">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 flex items-center justify-center">
                  <Search className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm sm:text-base font-light">No se encontraron productos</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10">
                  {searchResults.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE).map((product: any) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      store={store}
                    />
                  ))}
                </div>

                {/* Search Pagination */}
                {Math.ceil(searchResults.length / PRODUCTS_PER_PAGE) > 1 && (
                  <div className="mt-12 sm:mt-16 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      style={currentPage !== 1 ? { borderColor: store.primary_color, color: store.primary_color } : {}}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.ceil(searchResults.length / PRODUCTS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 flex items-center justify-center text-sm transition-all ${
                            currentPage === page
                              ? "font-medium"
                              : "font-light text-gray-600 hover:text-gray-900"
                          }`}
                          style={currentPage === page ? {
                            backgroundColor: store.primary_color,
                            color: 'white'
                          } : {}}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(Math.ceil(searchResults.length / PRODUCTS_PER_PAGE), p + 1))}
                      disabled={currentPage === Math.ceil(searchResults.length / PRODUCTS_PER_PAGE)}
                      className="p-2 border border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      style={currentPage !== Math.ceil(searchResults.length / PRODUCTS_PER_PAGE) ? { borderColor: store.primary_color, color: store.primary_color } : {}}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div>
            {selectedCatalog && (
              <div className="mb-10 sm:mb-12">
                <h2 className="text-xl sm:text-2xl font-light text-gray-900 tracking-tight">
                  {visibleCatalogs.find((c: any) => c.id === selectedCatalog)?.name}
                </h2>
              </div>
            )}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 sm:py-28">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 flex items-center justify-center">
                  <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-3 tracking-tight">Sin productos</h2>
                <p className="text-sm sm:text-base text-gray-400 font-light">
                  {selectedCatalog ? "No hay productos en este catálogo" : "No hay productos disponibles"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10">
                  {paginatedProducts.map((product: any) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      store={store}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 sm:mt-16 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      style={currentPage !== 1 ? { borderColor: store.primary_color, color: store.primary_color } : {}}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 flex items-center justify-center text-sm transition-all ${
                            currentPage === page
                              ? "font-medium"
                              : "font-light text-gray-600 hover:text-gray-900"
                          }`}
                          style={currentPage === page ? {
                            backgroundColor: store.primary_color,
                            color: 'white'
                          } : {}}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      style={currentPage !== totalPages ? { borderColor: store.primary_color, color: store.primary_color } : {}}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
