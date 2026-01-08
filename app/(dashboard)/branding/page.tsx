"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormSkeleton } from "@/components/ui/skeleton";
import { getMyStore, updateStore } from "@/lib/actions/store";
import { Palette, Save, Sparkles, Store, MessageSquare, CreditCard, Mail, Loader2 } from "lucide-react";
import { formatPhoneNumber, parsePhoneNumber } from "@/lib/utils/formatters";
import { useToast } from "@/components/ui/toast-provider";

export default function BrandingPage() {
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#111111");
  const [accentColor, setAccentColor] = useState("#6B7280");
  const [defaultCta, setDefaultCta] = useState<"whatsapp" | "payment_link" | "contact">("whatsapp");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const result: any = await getMyStore();
    if (result.data) {
      const s = result.data;
      setStore(s);
      setName(s.name || "");
      setDescription(s.description || "");
      setPrimaryColor(s.primary_color || "#111111");
      setAccentColor(s.accent_color || "#6B7280");
      setDefaultCta(s.default_cta || "whatsapp");
      setWhatsappPhone(s.whatsapp_phone || "");
      setPaymentUrl(s.default_payment_url || "");
      setContactEmail(s.contact_email || "");
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!store) return;

    setSaving(true);
    const result = await updateStore(store.id, {
      name,
      description,
      primary_color: primaryColor,
      accent_color: accentColor,
      default_cta: defaultCta,
      whatsapp_phone: whatsappPhone || null,
      default_payment_url: paymentUrl || null,
      contact_email: contactEmail || null,
    });

    if (result.error) {
      console.error("Error saving:", result.error);
      addToast({ title: "No pudimos guardar", description: result.error, variant: "error" });
      setSaveSuccess(false);
    } else {
      console.log("Saved successfully:", result.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      addToast({ title: "Preferencias actualizadas", variant: "success" });
      // Reload data to reflect changes
      loadData();
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="h-6 sm:h-8 w-32 sm:w-48 bg-gray-200 rounded animate-pulse" />
          <FormSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Branding</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Personaliza la apariencia de tu tienda
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {saveSuccess && (
            <Badge variant="default" className="bg-green-500 text-xs sm:text-sm">
              ✓ <span className="hidden sm:inline">Cambios guardados</span>
            </Badge>
          )}
          <Button onClick={handleSave} disabled={saving} size="sm" className="sm:size-default md:size-lg">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 sm:mr-2 sm:h-5 sm:w-5 animate-spin" />
                <span className="hidden sm:inline">Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Guardar cambios</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Tienda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la tienda</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi Tienda"
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción breve de tu tienda..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colores de Marca</CardTitle>
          <CardDescription>
            Personaliza los colores de tu tienda online
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="primaryColor" className="text-sm">Color Principal</Label>
              <div className="flex gap-2 sm:gap-3 items-center flex-wrap sm:flex-nowrap">
                <input
                  type="color"
                  id="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-16 sm:h-12 sm:w-20 rounded-lg border cursor-pointer flex-shrink-0"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#111111"
                  className="flex-1 text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Se usa para botones y elementos principales
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="accentColor" className="text-sm">Color Secundario</Label>
              <div className="flex gap-2 sm:gap-3 items-center flex-wrap sm:flex-nowrap">
                <input
                  type="color"
                  id="accentColor"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-16 sm:h-12 sm:w-20 rounded-lg border cursor-pointer flex-shrink-0"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#6B7280"
                  className="flex-1 text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Se usa para textos y elementos secundarios
              </p>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-lg border" style={{ backgroundColor: primaryColor }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-white text-sm sm:text-base font-medium truncate">Preview del color principal</span>
              <button className="px-3 sm:px-4 py-2 rounded-lg bg-white font-medium text-xs sm:text-sm flex-shrink-0" style={{ color: primaryColor }}>
                Botón
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Botón de Acción (CTA)</CardTitle>
          <CardDescription>
            Configura el botón predeterminado de tus productos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm">Tipo de botón predeterminado</Label>
            <div className="grid gap-2 sm:gap-3 md:grid-cols-3">
              <button
                onClick={() => setDefaultCta("whatsapp")}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                  defaultCta === "whatsapp"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 mb-2 text-green-600" />
                <div className="font-medium text-sm">WhatsApp</div>
                <div className="text-xs text-muted-foreground">Chat directo</div>
              </button>

              <button
                onClick={() => setDefaultCta("payment_link")}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                  defaultCta === "payment_link"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 mb-2 text-blue-600" />
                <div className="font-medium text-sm">Link de Pago</div>
                <div className="text-xs text-muted-foreground">Pago online</div>
              </button>

              <button
                onClick={() => setDefaultCta("contact")}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                  defaultCta === "contact"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 mb-2 text-purple-600" />
                <div className="font-medium text-sm">Contacto</div>
                <div className="text-xs text-muted-foreground">Email/Formulario</div>
              </button>
            </div>
          </div>

          {defaultCta === "whatsapp" && (
            <div className="space-y-2">
              <Label htmlFor="whatsappPhone">Número de WhatsApp</Label>
              <Input
                id="whatsappPhone"
                value={formatPhoneNumber(whatsappPhone)}
                onChange={(e) => setWhatsappPhone(parsePhoneNumber(e.target.value))}
                placeholder="52 1 999 123 4567"
                type="tel"
              />
              <p className="text-xs text-muted-foreground">
                Incluye código de país (ej: 52 para México). El formato se aplicará automáticamente.
              </p>
            </div>
          )}

          {defaultCta === "payment_link" && (
            <div className="space-y-2">
              <Label htmlFor="paymentUrl">URL de Pago</Label>
              <Input
                id="paymentUrl"
                type="url"
                value={paymentUrl}
                onChange={(e) => setPaymentUrl(e.target.value)}
                placeholder="https://tu-link-de-pago.com"
              />
            </div>
          )}

          {defaultCta === "contact" && (
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email de Contacto</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contacto@tutienda.com"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
