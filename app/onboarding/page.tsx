"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createStore, updateStore, publishStore } from "@/lib/actions/store";
import { createCatalog } from "@/lib/actions/catalog";
import { createProduct } from "@/lib/actions/product";
import { generateSlug } from "@/lib/utils/slug";
import { formatPhoneNumber, parsePhoneNumber, formatStock, parseStock } from "@/lib/utils/formatters";
import { Check, Copy } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Step 1: Store info
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#111111");
  const [accentColor, setAccentColor] = useState("#6B7280");
  const [storeId, setStoreId] = useState<string>("");

  // Step 2: CTA
  const [defaultCta, setDefaultCta] = useState<"whatsapp" | "payment_link" | "contact">("whatsapp");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Step 3: First catalog
  const [catalogName, setCatalogName] = useState("");
  const [catalogSlug, setCatalogSlug] = useState("");
  const [catalogId, setCatalogId] = useState<string>("");

  // Step 4: First product
  const [productName, setProductName] = useState("");
  const [productSlug, setProductSlug] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productStock, setProductStock] = useState("0");

  // Step 5: Published store URL
  const [publicUrl, setPublicUrl] = useState("");

  const progress = (currentStep / 5) * 100;

  const handleStep1 = async () => {
    setLoading(true);
    const result: any = await createStore({
      name: storeName,
      slug: storeSlug,
      description: storeDescription || null,
      primary_color: primaryColor,
      accent_color: accentColor,
      status: "draft",
    });

    if (result.error || !result.data) {
      alert(result.error || "Error creating store");
      setLoading(false);
      return;
    }

    setStoreId(result.data.id);
    setCurrentStep(2);
    setLoading(false);
  };

  const handleStep2 = async () => {
    setLoading(true);
    const updateData: any = { default_cta: defaultCta };

    if (defaultCta === "whatsapp") {
      updateData.whatsapp_phone = whatsappPhone;
    } else if (defaultCta === "payment_link") {
      updateData.default_payment_url = paymentUrl;
    } else if (defaultCta === "contact") {
      updateData.contact_email = contactEmail;
    }

    await updateStore(storeId, updateData);
    setCurrentStep(3);
    setLoading(false);
  };

  const handleStep3 = async () => {
    setLoading(true);
    const result: any = await createCatalog(storeId, {
      name: catalogName,
      slug: catalogSlug,
      visible: true,
      sort_order: 0,
    });

    if (result.error || !result.data) {
      alert(result.error || "Error creating catalog");
      setLoading(false);
      return;
    }

    setCatalogId(result.data.id);
    setCurrentStep(4);
    setLoading(false);
  };

  const handleStep4 = async () => {
    setLoading(true);
    const result: any = await createProduct(storeId, {
      name: productName,
      slug: productSlug,
      description: productDescription || null,
      price_text: productPrice || null,
      stock: parseInt(productStock),
      catalog_id: catalogId,
      status: "active",
      sort_order: 0,
    });

    if (result.error || !result.data) {
      alert(result.error || "Error creating product");
      setLoading(false);
      return;
    }

    setCurrentStep(5);
    setLoading(false);
  };

  const handleStep5 = async () => {
    setLoading(true);
    const result: any = await publishStore(storeId);

    if (result.error || !result.data) {
      alert(result.error || "Error publishing store");
      setLoading(false);
      return;
    }

    const url = `${window.location.origin}/${storeSlug}`;
    setPublicUrl(url);
    setLoading(false);
  };

  const handleFinish = () => {
    router.push("/home");
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bienvenido a SPACE</h1>
          <p className="text-muted-foreground">
            Configura tu catálogo en 5 sencillos pasos
          </p>
        </div>

        <Progress value={progress} className="mb-8" />

        <Card>
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle>1. Crea tu tienda</CardTitle>
                <CardDescription>
                  Información básica de tu negocio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de tu tienda *</Label>
                  <Input
                    id="name"
                    value={storeName}
                    onChange={(e) => {
                      setStoreName(e.target.value);
                      setStoreSlug(generateSlug(e.target.value));
                    }}
                    placeholder="Mi Tienda"
                    maxLength={60}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL de tu tienda (generada automáticamente)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">space.com/</span>
                    <Input
                      id="slug"
                      value={storeSlug}
                      readOnly
                      placeholder="mi-tienda"
                      className="bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="Describe tu tienda..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color principal</Label>
                  <Input
                    id="color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Color secundario</Label>
                  <Input
                    id="accent-color"
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleStep1}
                  disabled={!storeName || !storeSlug || loading}
                  className="w-full"
                >
                  Continuar
                </Button>
              </CardContent>
            </>
          )}

          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle>2. Configura tu CTA principal</CardTitle>
                <CardDescription>
                  ¿Cómo quieres que te contacten?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de contacto</Label>
                  <Select
                    value={defaultCta}
                    onChange={(e) =>
                      setDefaultCta(e.target.value as "whatsapp" | "payment_link" | "contact")
                    }
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="payment_link">Link de pago</option>
                    <option value="contact">Contacto</option>
                  </Select>
                </div>

                {defaultCta === "whatsapp" && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número de WhatsApp</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formatPhoneNumber(whatsappPhone)}
                      onChange={(e) => setWhatsappPhone(parsePhoneNumber(e.target.value))}
                      placeholder="52 1 999 123 4567"
                    />
                    <p className="text-xs text-muted-foreground">
                      Incluye código de país (ej: 52 para México). El formato se aplicará automáticamente.
                    </p>
                  </div>
                )}

                {defaultCta === "payment_link" && (
                  <div className="space-y-2">
                    <Label htmlFor="payment">URL de pago</Label>
                    <Input
                      id="payment"
                      value={paymentUrl}
                      onChange={(e) => setPaymentUrl(e.target.value)}
                      placeholder="https://..."
                      type="url"
                    />
                  </div>
                )}

                {defaultCta === "contact" && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de contacto</Label>
                    <Input
                      id="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="hola@mitienda.com"
                      type="email"
                    />
                  </div>
                )}

                <Button onClick={handleStep2} disabled={loading} className="w-full">
                  Continuar
                </Button>
              </CardContent>
            </>
          )}

          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle>3. Crea tu primer catálogo</CardTitle>
                <CardDescription>
                  Organiza tus productos por categorías
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="catalog-name">Nombre del catálogo *</Label>
                  <Input
                    id="catalog-name"
                    value={catalogName}
                    onChange={(e) => {
                      setCatalogName(e.target.value);
                      setCatalogSlug(generateSlug(e.target.value));
                    }}
                    placeholder="Nuevos Productos"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catalog-slug">URL del catálogo (generada automáticamente)</Label>
                  <Input
                    id="catalog-slug"
                    value={catalogSlug}
                    readOnly
                    placeholder="nuevos-productos"
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <Button
                  onClick={handleStep3}
                  disabled={!catalogName || !catalogSlug || loading}
                  className="w-full"
                >
                  Continuar
                </Button>
              </CardContent>
            </>
          )}

          {currentStep === 4 && (
            <>
              <CardHeader>
                <CardTitle>4. Crea tu primer producto</CardTitle>
                <CardDescription>
                  Agrega un producto a tu catálogo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product-name">Nombre del producto *</Label>
                  <Input
                    id="product-name"
                    value={productName}
                    onChange={(e) => {
                      setProductName(e.target.value);
                      setProductSlug(generateSlug(e.target.value));
                    }}
                    placeholder="iPhone 15 Pro"
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-slug">URL del producto (generada automáticamente)</Label>
                  <Input
                    id="product-slug"
                    value={productSlug}
                    readOnly
                    placeholder="iphone-15-pro"
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-desc">Descripción (opcional)</Label>
                  <Textarea
                    id="product-desc"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Describe tu producto..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-price">Precio (texto libre, opcional)</Label>
                  <Input
                    id="product-price"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="$24,999 MXN"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-stock" className="text-sm font-medium">
                    Stock inicial <span className="text-muted-foreground font-normal">(unidades)</span>
                  </Label>
                  <Input
                    id="product-stock"
                    type="text"
                    inputMode="numeric"
                    value={formatStock(productStock)}
                    onChange={(e) => setProductStock(String(parseStock(e.target.value)))}
                    placeholder="1,000"
                    className="text-right"
                  />
                  <p className="text-xs text-muted-foreground">
                    Se muestra con formato: <span className="font-semibold">{formatStock(parseInt(productStock) || 0)}</span>
                  </p>
                </div>
                <Button
                  onClick={handleStep4}
                  disabled={!productName || !productSlug || loading}
                  className="w-full"
                >
                  Continuar
                </Button>
              </CardContent>
            </>
          )}

          {currentStep === 5 && (
            <>
              <CardHeader>
                <CardTitle>5. ¡Listo para publicar!</CardTitle>
                <CardDescription>
                  Tu catálogo está configurado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!publicUrl ? (
                  <Button onClick={handleStep5} disabled={loading} className="w-full">
                    Publicar mi tienda
                  </Button>
                ) : (
                  <>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <Check className="w-5 h-5" />
                        <span className="font-semibold">¡Tienda publicada!</span>
                      </div>
                      <p className="text-sm text-green-600 mb-3">
                        Tu catálogo ya está en línea
                      </p>
                      <div className="flex items-center gap-2">
                        <Input value={publicUrl} readOnly className="bg-white" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyUrl}
                        >
                          {copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button onClick={handleFinish} className="w-full">
                      Ir al Dashboard
                    </Button>
                  </>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
