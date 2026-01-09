"use client";

import { useEffect, useRef, useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Package2, Image as ImageIcon, AlertCircle, ChevronLeft, ChevronRight, Upload, Download, X, Loader2 } from "lucide-react";
import { getMyStore } from "@/lib/actions/store";
import { getProducts, createProduct, updateProduct, deleteProduct, importProducts } from "@/lib/actions/product";
import { getCatalogs } from "@/lib/actions/catalog";
import { generateSlug } from "@/lib/utils/slug";
import { formatStock, parseStock, formatNumberMX, formatPriceDisplay } from "@/lib/utils/formatters";
import Image from "next/image";
import { useToast } from "@/components/ui/toast-provider";
import { PlanLimitBanner } from "@/components/billing/plan-limit-banner";
import { getPlanUsageSummary, type PlanUsageSummary } from "@/lib/actions/plan";

interface ProductImage {
  id?: string;
  url: string;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_text: string | null;
  status: "active" | "hidden";
  stock: number;
  catalog_id: string | null;
  images?: ProductImage[];
  cta_override: "whatsapp" | "payment_link" | "contact" | null;
  payment_url: string | null;
  whatsapp_message: string | null;
  contact_url: string | null;
  out_of_stock_behavior: "label" | "auto_hide";
}

interface Catalog {
  id: string;
  name: string;
  slug: string;
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: { rowNumber: number; message: string }[];
}

interface CsvRecord {
  rowNumber: number;
  values: Record<string, string>;
}

interface ParsedCsvResult {
  rows: CsvRecord[];
  error?: string;
}

const CSV_HEADERS = [
  "name",
  "url",
  "description",
  "price_text",
  "stock",
  "catalog_slug",
] as const;

const CSV_SAMPLE_ROW: Record<(typeof CSV_HEADERS)[number], string> = {
  name: "Camisa Premium Azul",
  url: "https://space.store/marca/product/camisa-premium-azul",
  description: "Camisa slim fit en tela italiana",
  price_text: "$799 MXN",
  stock: "25",
  catalog_slug: "camisas",
};

function escapeCsvValue(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildTemplateCsv() {
  const headerLine = CSV_HEADERS.join(",");
  const sampleLine = CSV_HEADERS
    .map((header) => escapeCsvValue(CSV_SAMPLE_ROW[header] || ""))
    .join(",");

  return `${headerLine}\n${sampleLine}\n`;
}

function parseCsv(content: string): ParsedCsvResult {
  const text = content.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  const commitCell = () => {
    row.push(current);
    current = "";
  };

  const commitRow = () => {
    commitCell();
    const hasValue = row.some((cell) => cell.trim() !== "");
    if (hasValue) {
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === "\"") {
      if (inQuotes && text[i + 1] === "\"") {
        current += "\"";
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      commitCell();
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }
      commitRow();
    } else {
      current += char;
    }
  }

  if (current !== "" || row.length > 0) {
    commitRow();
  }

  if (rows.length === 0) {
    return { rows: [], error: "El archivo CSV está vacío" };
  }

  const headerCells = rows[0].map((cell) => cell.trim().toLowerCase());
  if (!headerCells.includes("name")) {
    return { rows: [], error: "La cabecera debe incluir la columna 'name'" };
  }

  const dataRows = rows
    .slice(1)
    .map((cells, idx) => {
      const values: Record<string, string> = {};
      headerCells.forEach((header, colIndex) => {
        values[header] = (cells[colIndex] ?? "").trim();
      });
      return {
        rowNumber: idx + 2,
        values,
      } satisfies CsvRecord;
    })
    .filter((record) => Object.values(record.values).some((value) => value !== ""));

  return { rows: dataRows };
}

const PRODUCTS_PER_PAGE = 10;

export default function ProductsPage() {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [planUsage, setPlanUsage] = useState<PlanUsageSummary | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [priceText, setPriceText] = useState("");
  const [stock, setStock] = useState("0");
  const [status, setStatus] = useState<"active" | "hidden">("active");
  const [catalogId, setCatalogId] = useState("");
  const [images, setImages] = useState<ProductImage[]>([]);
  const [ctaOverride, setCtaOverride] = useState<"whatsapp" | "payment_link" | "contact" | "" | null>("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [contactUrl, setContactUrl] = useState("");
  const [outOfStockBehavior, setOutOfStockBehavior] = useState<"label" | "auto_hide">("label");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { addToast } = useToast();

  function notifyImportError(message: string) {
    setImportMessage(message);
    addToast({ title: "Error de importación", description: message, variant: "error" });
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const storeResult: any = await getMyStore();
    if (storeResult.data) {
      setStore(storeResult.data);
      const productsResult: any = await getProducts(storeResult.data.id);
      const catalogsResult: any = await getCatalogs(storeResult.data.id);

      if (productsResult.data) setProducts(productsResult.data);
      if (catalogsResult.data) setCatalogs(catalogsResult.data);
    }
    const planSummary = await getPlanUsageSummary();
    if (planSummary?.data) {
      setPlanUsage(planSummary.data);
    }
    setLoading(false);
  }

  function openCreateForm() {
    setEditingProduct(null);
    setName("");
    setSlug("");
    setDescription("");
    setPriceText("");
    setStock("0");
    setStatus("active");
    setCatalogId("");
    setImages([]);
    setCtaOverride("");
    setPaymentUrl("");
    setWhatsappMessage("");
    setContactUrl("");
    setOutOfStockBehavior("label");
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setSlug(product.slug);
    setDescription(product.description || "");
    setPriceText(product.price_text || "");
    setStock(product.stock.toString());
    setStatus(product.status);
    setCatalogId(product.catalog_id || "");
    setImages(product.images || []);
    setCtaOverride(product.cta_override || "");
    setPaymentUrl(product.payment_url || "");
    setWhatsappMessage(product.whatsapp_message || "");
    setContactUrl(product.contact_url || "");
    setOutOfStockBehavior(product.out_of_stock_behavior || "label");
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!store) return;

    setSaving(true);

    const data = {
      name,
      slug,
      description: description || null,
      price_text: priceText || null,
      stock: parseInt(stock),
      status,
      catalog_id: catalogId || null,
      cta_override: ctaOverride || null,
      payment_url: paymentUrl || null,
      whatsapp_message: whatsappMessage || null,
      contact_url: contactUrl || null,
      out_of_stock_behavior: outOfStockBehavior,
      sort_order: 0,
      images, // Include images
    };

    const result = editingProduct
      ? await updateProduct(editingProduct.id, data)
      : await createProduct(store.id, data);

    if (result?.error) {
      addToast({ title: "No pudimos guardar el producto", description: result.error, variant: "error" });
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    await deleteProduct(id);
    loadData();
  }

  function handleDownloadTemplate() {
    const csv = buildTemplateCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla_productos_space.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !store) {
      event.target.value = "";
      return;
    }

    setImportMessage(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const parsed = parseCsv(text);

      if (parsed.error) {
        notifyImportError(parsed.error);
        return;
      }

      if (parsed.rows.length === 0) {
        notifyImportError("No se encontraron filas con datos en el archivo.");
        return;
      }

      setImporting(true);

      const payload = parsed.rows.map(({ rowNumber, values }) => ({
        rowNumber,
        name: values.name,
        slug: values.slug,
        url: values.url,
        description: values.description,
        price_text: values.price_text,
        stock: values.stock,
        catalog_slug: values.catalog_slug,
      }));

      const result: any = await importProducts(store.id, payload);

      if (result?.error) {
        notifyImportError(result.error);
      } else if (result?.data) {
        setImportResult(result.data);
        if (result.data.imported > 0) {
          loadData();
        }
      } else {
        notifyImportError("No se pudo procesar el archivo.");
      }
    } catch (error: any) {
      notifyImportError(error?.message || "No se pudo leer el archivo.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-6 sm:h-8 w-32 sm:w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 sm:h-4 w-48 sm:w-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              {editingProduct ? "Actualiza la información" : "Agrega un nuevo producto"}
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
            <Button variant="outline" size="sm" className="sm:size-default" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button size="sm" className="sm:size-default" onClick={handleSubmit} disabled={!name || !slug || saving}>
              {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>) : editingProduct ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del producto *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingProduct) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                  placeholder="Ej: iPhone 15 Pro Max"
                  maxLength={80}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL (generada automáticamente)</Label>
                <Input
                  id="slug"
                  value={slug}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe las características principales del producto..."
                rows={4}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">
                  Precio <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="price"
                  value={priceText}
                  onChange={(e) => setPriceText(e.target.value)}
                  placeholder="$1,234.56 MXN"
                />
                <p className="text-xs text-muted-foreground">
                  Ejemplo: <span className="font-semibold">$1,500.00 MXN</span> o <span className="font-semibold">desde $500</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock" className="text-sm font-medium">
                  Stock disponible <span className="text-muted-foreground font-normal">(unidades)</span>
                </Label>
                <Input
                  id="stock"
                  type="text"
                  inputMode="numeric"
                  value={formatStock(stock)}
                  onChange={(e) => setStock(String(parseStock(e.target.value)))}
                  placeholder="1,000"
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground">
                  Se muestra con formato: <span className="font-semibold">{formatNumberMX(parseInt(stock) || 0)}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Estado del producto</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "hidden")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">✓ Activo (visible en tienda)</option>
                  <option value="hidden">✕ Oculto (no visible)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="catalog" className="text-sm font-medium">Catálogo</Label>
                <select
                  id="catalog"
                  value={catalogId}
                  onChange={(e) => setCatalogId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Sin catálogo</option>
                  {catalogs.map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>
                      {catalog.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outOfStock" className="text-sm font-medium">Cuando no hay stock</Label>
                <select
                  id="outOfStock"
                  value={outOfStockBehavior}
                  onChange={(e) => setOutOfStockBehavior(e.target.value as "label" | "auto_hide")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="label">Mostrar &quot;Agotado&quot;</option>
                  <option value="auto_hide">Ocultar automáticamente</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imágenes del producto</CardTitle>
            <CardDescription>
              Sube hasta 5 imágenes. La primera será la imagen principal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Botón de acción (CTA)</CardTitle>
            <CardDescription>
              Configura un botón personalizado para este producto (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ctaOverride" className="text-sm font-medium">Tipo de botón</Label>
              <select
                id="ctaOverride"
                value={ctaOverride || ""}
                onChange={(e) => setCtaOverride(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Usar configuración de la tienda</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="payment_link">Link de pago</option>
                <option value="contact">Contacto personalizado</option>
              </select>
            </div>

            {ctaOverride === "whatsapp" && (
              <div className="space-y-2">
                <Label htmlFor="whatsappMessage">Mensaje de WhatsApp</Label>
                <Textarea
                  id="whatsappMessage"
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder="Hola, me interesa este producto..."
                  rows={3}
                />
              </div>
            )}

            {ctaOverride === "payment_link" && (
              <div className="space-y-2">
                <Label htmlFor="paymentUrl">URL de pago</Label>
                <Input
                  id="paymentUrl"
                  type="url"
                  value={paymentUrl}
                  onChange={(e) => setPaymentUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}

            {ctaOverride === "contact" && (
              <div className="space-y-2">
                <Label htmlFor="contactUrl">URL de contacto</Label>
                <Input
                  id="contactUrl"
                  type="url"
                  value={contactUrl}
                  onChange={(e) => setContactUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const paginatedProducts = products.slice(startIndex, endIndex);
  const productLimitReached = !!(planUsage?.maxProducts && planUsage.productsUsed >= planUsage.maxProducts);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleImportFile}
      />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Productos</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Gestiona tu inventario ({formatNumberMX(products.length)} {products.length === 1 ? 'producto' : 'productos'})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setImportMessage(null);
                setImportResult(null);
                setShowImportDialog(true);
              }}
              size="sm"
              className="sm:size-default md:size-lg flex-shrink-0"
              disabled={productLimitReached}
            >
              <Upload className="h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Importar CSV</span>
              <span className="sm:hidden">Importar</span>
            </Button>
            <Button
              onClick={openCreateForm}
              size="sm"
              className="sm:size-default md:size-lg flex-shrink-0"
              disabled={productLimitReached}
            >
              <Plus className="h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Nuevo</span>
            </Button>
          </div>
        </div>

      {planUsage?.maxProducts ? (
        <PlanLimitBanner
          planCode={planUsage.planCode}
          resource="products"
          used={planUsage.productsUsed}
          limit={planUsage.maxProducts}
        />
      ) : null}

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="rounded-full bg-muted p-4 sm:p-6 mb-3 sm:mb-4">
              <Package2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">No tienes productos aún</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 text-center max-w-sm">
              Comienza agregando tu primer producto
            </p>
            <Button onClick={openCreateForm} size="default" className="sm:size-lg" disabled={productLimitReached}>
              <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Crear primer producto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:gap-4">
            {paginatedProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex gap-3 sm:gap-6">
                    <div className="relative h-16 w-16 sm:h-24 sm:w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-lg truncate">{product.name}</h3>
                            <Badge variant={product.status === "active" ? "default" : "secondary"} className="text-xs">
                              {product.status === "active" ? "Activo" : "Oculto"}
                            </Badge>
                            {product.stock === 0 && (
                              <Badge variant="destructive" className="gap-0.5 sm:gap-1 text-xs">
                                <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                <span className="hidden sm:inline">Sin stock</span>
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                            <span className="truncate">/{product.slug}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>Stock: {formatNumberMX(product.stock)} unidades</span>
                            {product.price_text && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="font-medium  text-foreground">{formatPriceDisplay(product.price_text)}</span>
                              </>
                            )}
                          </div>
                          {product.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 sm:h-10 sm:w-10"
                            onClick={() => openEditForm(product)}
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 sm:h-10 sm:w-10"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                    className="w-10 h-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !importing && setShowImportDialog(false)}
          />
          <div className="relative w-full max-w-2xl px-3 sm:px-4">
            <Card className="shadow-2xl">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>Importar productos por CSV</CardTitle>
                  <CardDescription>
                    Sigue los pasos para cargar tu catálogo de forma masiva.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => setShowImportDialog(false)}
                  disabled={importing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                <ol className="space-y-4 text-sm sm:text-base">
                  <li className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">1</div>
                    <div className="space-y-2">
                      <p className="font-medium">Descarga la plantilla</p>
                      <p className="text-muted-foreground text-sm">Incluye las columnas necesarias y un ejemplo listo para editar.</p>
                      <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                        <Download className="h-4 w-4 mr-2" /> Descargar CSV
                      </Button>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">2</div>
                    <div className="space-y-2">
                      <p className="font-medium">Llena la información</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>Solo <code>name</code> es obligatorio.</li>
                        <li>Puedes pegar la URL completa en <code>url</code> y la convertiremos en slug automáticamente.</li>
                        <li>Usa <code>catalog_slug</code> para asignar productos a un catálogo existente.</li>
                        <li>Si prefieres definirlo manualmente, agrega una columna opcional llamada <code>slug</code>.</li>
                      </ul>
                      {catalogs.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Catálogos disponibles:&nbsp;
                          {catalogs.map((catalog) => (
                            <span key={catalog.id} className="mr-2">
                              <code>{catalog.slug}</code> ({catalog.name})
                            </span>
                          ))}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Columnas soportadas: {CSV_HEADERS.map((header, index) => (
                          <span key={header} className="mr-1">
                            <code>{header}</code>
                            {index < CSV_HEADERS.length - 1 ? "," : ""}
                          </span>
                        ))}
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">3</div>
                    <div className="space-y-2">
                      <p className="font-medium">Sube el archivo</p>
                      <p className="text-muted-foreground text-sm">Revisaremos cada fila, te diremos cuántas se importaron y si hubo errores.</p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={handleImportClick} disabled={importing}>
                          <Upload className="h-4 w-4 mr-2" />
                          {importing ? "Procesando..." : "Seleccionar CSV"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowImportDialog(false)} disabled={importing}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </li>
                </ol>

                {importMessage && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {importMessage}
                  </div>
                )}

                {importResult && (
                  <div className="rounded-md border border-border/80 bg-muted/40 px-3 py-2 text-sm">
                    <p className="font-medium text-foreground">
                      {importResult.imported} producto{importResult.imported === 1 ? "" : "s"} importado{importResult.imported === 1 ? "" : "s"} correctamente.
                    </p>
                    {importResult.failed > 0 ? (
                      <div className="mt-2 space-y-1 text-red-600">
                        <p>
                          {importResult.failed} fila{importResult.failed === 1 ? "" : "s"} no se importaron:
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {importResult.errors.slice(0, 5).map((error, idx) => (
                            <li key={`${error.rowNumber}-${idx}`}>
                              Fila {error.rowNumber}: {error.message}
                            </li>
                          ))}
                        </ul>
                        {importResult.failed > 5 && (
                          <p className="text-xs text-muted-foreground">
                            y {importResult.failed - 5} fila{importResult.failed - 5 === 1 ? "" : "s"} adicional(es) con error.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-1">No se detectaron errores en la importación.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
