import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMyStore } from "@/lib/actions/store";
import { getStoreAnalytics } from "@/lib/actions/analytics";
import { Eye, MousePointerClick, Package, AlertCircle, TrendingUp, Store, ShoppingCart, BarChart3 } from "lucide-react";
import { formatNumberMX } from "@/lib/utils/formatters";

export const metadata: Metadata = {
  title: "Dashboard · SPACE",
  description: "Resumen de rendimiento y métricas de tu tienda.",
};

export default async function HomePage() {
  const { data: storeRaw } = await getMyStore();

  if (!storeRaw) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No se encontró la tienda</p>
      </div>
    );
  }

  const store = storeRaw as any;
  const analytics7 = await getStoreAnalytics(store.id, 7);
  const analytics30 = await getStoreAnalytics(store.id, 30);

  // Calculate percentage changes
  const storeViewsChange = analytics30.storeViews > 0
    ? ((analytics7.storeViews / analytics30.storeViews) * 100).toFixed(0)
    : 0;
  const productViewsChange = analytics30.productViews > 0
    ? ((analytics7.productViews / analytics30.productViews) * 100).toFixed(0)
    : 0;
  const ctaClicksChange = analytics30.ctaClicks > 0
    ? ((analytics7.ctaClicks / analytics30.ctaClicks) * 100).toFixed(0)
    : 0;

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Bienvenido, {store.name}
          </p>
        </div>

        {/* Main KPIs - 7 days */}
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold">Últimos 7 días</h2>
            <Badge variant="secondary" className="text-xs">Actualizado hoy</Badge>
          </div>
          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Visitas
                </CardTitle>
                <div className="rounded-full bg-blue-500/10 p-1.5 sm:p-2">
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1">{formatNumberMX(analytics7.storeViews)}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5 sm:gap-1">
                  <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {storeViewsChange}% del mes
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Productos
                </CardTitle>
                <div className="rounded-full bg-green-500/10 p-1.5 sm:p-2">
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1">{formatNumberMX(analytics7.productViews)}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5 sm:gap-1">
                  <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {productViewsChange}% del mes
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Clicks
                </CardTitle>
                <div className="rounded-full bg-purple-500/10 p-1.5 sm:p-2">
                  <MousePointerClick className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1">{formatNumberMX(analytics7.ctaClicks)}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5 sm:gap-1">
                  <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {ctaClicksChange}% del mes
                </p>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${analytics7.outOfStock > 0 ? 'border-l-orange-500' : 'border-l-gray-300'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Stock
                </CardTitle>
                <div className={`rounded-full ${analytics7.outOfStock > 0 ? 'bg-orange-500/10' : 'bg-gray-500/10'} p-1.5 sm:p-2`}>
                  <ShoppingCart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${analytics7.outOfStock > 0 ? 'text-orange-500' : 'text-gray-500'}`} />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1">{formatNumberMX(analytics7.activeProducts)}</div>
                <p className={`text-[10px] sm:text-xs ${analytics7.outOfStock > 0 ? 'text-orange-600 font-medium' : 'text-muted-foreground'} flex items-center gap-0.5 sm:gap-1`}>
                  {analytics7.outOfStock > 0 && <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                  {analytics7.outOfStock > 0 ? `${formatNumberMX(analytics7.outOfStock)} sin stock` : 'Todos en stock'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 30 days overview */}
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold">Últimos 30 días</h2>
          </div>
          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-transparent">
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                <CardDescription className="text-[10px] sm:text-xs font-medium">Total Visitas</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <div className="text-xl sm:text-2xl font-bold">{formatNumberMX(analytics30.storeViews)}</div>
                  <div className="rounded-full bg-blue-500/10 p-1 sm:p-1.5">
                    <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-transparent">
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                <CardDescription className="text-[10px] sm:text-xs font-medium">Vistas de Productos</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <div className="text-xl sm:text-2xl font-bold">{formatNumberMX(analytics30.productViews)}</div>
                  <div className="rounded-full bg-green-500/10 p-1 sm:p-1.5">
                    <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-transparent">
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                <CardDescription className="text-[10px] sm:text-xs font-medium">Total Clicks</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <div className="text-xl sm:text-2xl font-bold">{formatNumberMX(analytics30.ctaClicks)}</div>
                  <div className="rounded-full bg-purple-500/10 p-1 sm:p-1.5">
                    <MousePointerClick className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${analytics30.outOfStock > 0 ? 'from-orange-50' : 'from-gray-50'} to-transparent`}>
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                <CardDescription className="text-[10px] sm:text-xs font-medium">Sin Stock</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <div className="text-xl sm:text-2xl font-bold">{formatNumberMX(analytics30.outOfStock)}</div>
                  <div className={`rounded-full ${analytics30.outOfStock > 0 ? 'bg-orange-500/10' : 'bg-gray-500/10'} p-1 sm:p-1.5`}>
                    <AlertCircle className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${analytics30.outOfStock > 0 ? 'text-orange-500' : 'text-gray-500'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Products */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Productos Destacados</h2>
          <div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <Eye className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Top por Vistas</CardTitle>
                  <CardDescription className="text-xs">Más vistos en 7 días</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {analytics7.topProductsByViews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No hay datos disponibles
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {analytics7.topProductsByViews.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Badge
                          variant={index === 0 ? "default" : "secondary"}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center p-0 text-[10px] sm:text-xs flex-shrink-0"
                        >
                          {index + 1}
                        </Badge>
                        <span className="text-xs sm:text-sm font-medium truncate">{product.name}</span>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                        <span className="text-xs sm:text-sm font-bold">{formatNumberMX(product.count)}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">vistas</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <MousePointerClick className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Top por Clicks</CardTitle>
                  <CardDescription className="text-xs">Más clicados en 7 días</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {analytics7.topProductsByClicks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <MousePointerClick className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No hay datos disponibles
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {analytics7.topProductsByClicks.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Badge
                          variant={index === 0 ? "default" : "secondary"}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center p-0 text-[10px] sm:text-xs flex-shrink-0"
                        >
                          {index + 1}
                        </Badge>
                        <span className="text-xs sm:text-sm font-medium truncate">{product.name}</span>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                        <span className="text-xs sm:text-sm font-bold">{formatNumberMX(product.count)}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">clicks</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
