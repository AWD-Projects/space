"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { createStore, updateStore, publishStore } from "@/lib/actions/store";
import { createCatalog } from "@/lib/actions/catalog";
import { createProduct } from "@/lib/actions/product";
import { generateSlug } from "@/lib/utils/slug";
import { formatPhoneNumber, parsePhoneNumber, formatStock, parseStock } from "@/lib/utils/formatters";
import { Check, Copy, Palette, Sparkles, LayoutDashboard, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

type Step = 1 | 2 | 3 | 4 | 5;

const stepHighlights = [
  { title: "Crea tu tienda", desc: "Nombre, slug y colores base", icon: Sparkles },
  { title: "Configura tu CTA", desc: "Define cómo te contactan", icon: Palette },
  { title: "Publica", desc: "Catálogo listo para compartir", icon: LayoutDashboard },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#111111");
  const [accentColor, setAccentColor] = useState("#6B7280");
  const [storeId, setStoreId] = useState<string>("");

  const [defaultCta, setDefaultCta] = useState<"whatsapp" | "payment_link" | "contact">("whatsapp");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [catalogName, setCatalogName] = useState("");
  const [catalogSlug, setCatalogSlug] = useState("");
  const [catalogId, setCatalogId] = useState<string>("");

  const [productName, setProductName] = useState("");
  const [productSlug, setProductSlug] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productStock, setProductStock] = useState("0");

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
      addToast({ title: "No pudimos crear tu tienda", description: result.error || "Intenta de nuevo", variant: "error" });
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
      addToast({ title: "No pudimos crear el catálogo", description: result.error || "Intenta de nuevo", variant: "error" });
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
      addToast({ title: "No pudimos crear el producto", description: result.error || "Intenta de nuevo", variant: "error" });
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
      addToast({ title: "No pudimos publicar", description: result.error || "Reintenta en unos segundos", variant: "error" });
      setLoading(false);
      return;
    }

    const url = `${window.location.origin}/${storeSlug}`;
    setPublicUrl(url);
    addToast({ title: "Tienda publicada", description: "Tu catálogo ya está listo" });
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
    <div className="admin-theme min-h-screen bg-cloud text-ink">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden lg:flex flex-col justify-between bg-spaceBlue text-white px-12 py-12 overflow-hidden">
          <div className="absolute inset-6 rounded-3xl border border-white/15" />
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.4em] text-white/70">Onboarding SPACE</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight max-w-lg">
              Construye tu HQ de catálogo con un flujo guiado y seguro.
            </h1>
            <p className="mt-4 text-white/80 text-lg max-w-md">
              En menos de 10 minutos tendrás una tienda pública lista para compartir y un dashboard con insights accionables.
            </p>
          </div>
          <div className="relative z-10 space-y-4">
            {stepHighlights.map((item, index) => (
              <div key={item.title} className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wide text-white/70">Paso {index + 1}</p>
                  <p className="text-lg font-semibold">{item.title}</p>
                  <p className="text-sm text-white/80">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 bg-white">
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-8 space-y-3 text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-spaceMist px-4 py-1 text-xs font-semibold text-spaceBlue">
                Paso {currentStep} de 5
              </div>
              <h2 className="text-3xl font-semibold">Completa tu espacio de marca</h2>
              <p className="text-slate">Sigue los pasos y verás tu catálogo publicado al final del proceso.</p>
            </div>

            <div className="mb-8 h-2 w-full rounded-full bg-slate/10">
              <div
                className="h-2 rounded-full bg-spaceBlue transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="rounded-3xl border border-spaceMist bg-cloud/60 p-6 sm:p-8 shadow-sm">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-semibold">1. Crea tu tienda</h3>
                    <p className="text-slate">Nombre, slug y colores para establecer la base visual.</p>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre de la tienda *</Label>
                      <Input
                        id="name"
                        value={storeName}
                        onChange={(e) => {
                          setStoreName(e.target.value);
                          setStoreSlug(generateSlug(e.target.value));
                        }}
                        placeholder="Mi Tienda"
                        maxLength={60}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL (generada automáticamente)</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">space.com/</span>
                        <Input id="slug" value={storeSlug} readOnly className="bg-cloud" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={storeDescription}
                        onChange={(e) => setStoreDescription(e.target.value)}
                        placeholder="Describe tu oferta y propuesta de valor"
                        rows={3}
                        disabled={loading}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Color principal</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="h-12 w-20 rounded-xl border border-spaceMist"
                            disabled={loading}
                          />
                          <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} disabled={loading} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Color secundario</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="h-12 w-20 rounded-xl border border-spaceMist"
                            disabled={loading}
                          />
                          <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} disabled={loading} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleStep1} disabled={!storeName || !storeSlug || loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Continuar"
                    )}
                  </Button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-semibold">2. Configura tu CTA</h3>
                    <p className="text-slate">Define cómo los clientes interactúan contigo.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de contacto</Label>
                      <Select
                        value={defaultCta}
                        onChange={(e) => setDefaultCta(e.target.value as "whatsapp" | "payment_link" | "contact")}
                        disabled={loading}
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="payment_link">Link de pago</option>
                        <option value="contact">Email</option>
                      </Select>
                    </div>

                    {defaultCta === "whatsapp" && (
                      <div className="space-y-2">
                        <Label>Número de WhatsApp</Label>
                        <Input
                          type="tel"
                          value={formatPhoneNumber(whatsappPhone)}
                          onChange={(e) => setWhatsappPhone(parsePhoneNumber(e.target.value))}
                          placeholder="52 1 999 123 4567"
                          disabled={loading}
                        />
                      </div>
                    )}

                    {defaultCta === "payment_link" && (
                      <div className="space-y-2">
                        <Label>URL de pago</Label>
                        <Input value={paymentUrl} onChange={(e) => setPaymentUrl(e.target.value)} placeholder="https://" disabled={loading} />
                      </div>
                    )}

                    {defaultCta === "contact" && (
                      <div className="space-y-2">
                        <Label>Email de contacto</Label>
                        <Input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="hola@mitienda.com"
                          disabled={loading}
                        />
                      </div>
                    )}
                  </div>
                  <Button onClick={handleStep2} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Continuar"
                    )}
                  </Button>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-semibold">3. Crea tu primer catálogo</h3>
                    <p className="text-slate">Organiza tus productos en colecciones claras.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre del catálogo *</Label>
                      <Input
                        value={catalogName}
                        onChange={(e) => {
                          setCatalogName(e.target.value);
                          setCatalogSlug(generateSlug(e.target.value));
                        }}
                        placeholder="Nuevos Productos"
                        maxLength={50}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input value={catalogSlug} readOnly className="bg-cloud" />
                    </div>
                  </div>
                  <Button onClick={handleStep3} disabled={!catalogName || !catalogSlug || loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Continuar"
                    )}
                  </Button>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-semibold">4. Agrega tu primer producto</h3>
                    <p className="text-slate">Define un producto hero para tu catálogo.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre del producto *</Label>
                      <Input
                        value={productName}
                        onChange={(e) => {
                          setProductName(e.target.value);
                          setProductSlug(generateSlug(e.target.value));
                        }}
                        placeholder="iPhone 15 Pro"
                        maxLength={80}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input value={productSlug} readOnly className="bg-cloud" />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        placeholder="Describe tu producto"
                        rows={3}
                        disabled={loading}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Precio (texto libre)</Label>
                        <Input value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="$24,999 MXN" disabled={loading} />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock inicial</Label>
                        <Input
                          value={formatStock(productStock)}
                          onChange={(e) => setProductStock(String(parseStock(e.target.value)))}
                          inputMode="numeric"
                          className="text-right"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleStep4} disabled={!productName || !productSlug || loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Continuar"
                    )}
                  </Button>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-semibold">5. Publica tu tienda</h3>
                    <p className="text-slate">Hazla visible y comparte el enlace.</p>
                  </div>
                  {!publicUrl ? (
                    <Button onClick={handleStep5} disabled={loading} className="w-full">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publicando...
                        </>
                      ) : (
                        "Publicar mi tienda"
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-spaceMist bg-white p-5">
                        <div className="mb-3 flex items-center gap-2 text-spaceBlue">
                          <Check className="h-5 w-5" />
                          <span className="font-semibold">¡Tienda publicada!</span>
                        </div>
                        <p className="text-sm text-slate">Tu catálogo ya está en línea. Comparte el enlace:</p>
                        <div className="mt-3 flex items-center gap-2">
                          <Input value={publicUrl} readOnly className="bg-cloud" />
                          <Button variant="outline" size="icon" onClick={copyUrl}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <Button onClick={handleFinish} className="w-full">
                        Ir al dashboard
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
