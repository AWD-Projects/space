"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CatalogCardSkeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, FolderOpen, Eye, EyeOff } from "lucide-react";
import { getMyStore } from "@/lib/actions/store";
import { getCatalogs, createCatalog, updateCatalog, deleteCatalog } from "@/lib/actions/catalog";
import { generateSlug } from "@/lib/utils/slug";
import { useToast } from "@/components/ui/toast-provider";
import { PlanLimitBanner } from "@/components/billing/plan-limit-banner";
import { getPlanUsageSummary, type PlanUsageSummary } from "@/lib/actions/plan";

interface Catalog {
  id: string;
  name: string;
  slug: string;
  visible: boolean;
  sort_order: number;
}

export default function CatalogsPage() {
  const [store, setStore] = useState<any>(null);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();
  const [planUsage, setPlanUsage] = useState<PlanUsageSummary | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const storeResult: any = await getMyStore();
    if (storeResult.data) {
      setStore(storeResult.data);
      const catalogsResult: any = await getCatalogs(storeResult.data.id);
      if (catalogsResult.data) setCatalogs(catalogsResult.data);
    }
    const planSummary = await getPlanUsageSummary();
    if (planSummary?.data) {
      setPlanUsage(planSummary.data);
    }
    setLoading(false);
  }

  function openCreateForm() {
    if (planUsage?.maxCatalogs && planUsage.catalogsUsed >= planUsage.maxCatalogs) {
      addToast({
        title: "Límite de catálogos alcanzado",
        description: "Actualiza a Growth para crear más catálogos.",
        variant: "error",
      });
      return;
    }
    setEditingCatalog(null);
    setName("");
    setSlug("");
    setVisible(true);
    setShowForm(true);
  }

  function openEditForm(catalog: Catalog) {
    setEditingCatalog(catalog);
    setName(catalog.name);
    setSlug(catalog.slug);
    setVisible(catalog.visible);
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!store) return;

    setSaving(true);
    const data = {
      name,
      slug,
      visible,
      sort_order: catalogs.length,
    };

    const result = editingCatalog
      ? await updateCatalog(editingCatalog.id, data)
      : await createCatalog(store.id, data);

    if (result?.error) {
      addToast({
        title: editingCatalog ? "No pudimos actualizar el catálogo" : "No pudimos crear el catálogo",
        description: result.error,
        variant: "error",
      });
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este catálogo? Los productos no se eliminarán.")) return;
    const result = await deleteCatalog(id);
    if (result?.error) {
      addToast({
        title: "No pudimos eliminar el catálogo",
        description: result.error,
        variant: "error",
      });
      return;
    }
    loadData();
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
            <CatalogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              {editingCatalog ? "Editar Catálogo" : "Nuevo Catálogo"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              {editingCatalog ? "Actualiza la información del catálogo" : "Organiza tus productos en catálogos"}
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
            <Button variant="outline" size="sm" className="sm:size-default" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button size="sm" className="sm:size-default" onClick={handleSubmit} disabled={!name || !slug || saving}>
              {saving ? "Guardando..." : editingCatalog ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Información del Catálogo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del catálogo *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingCatalog) {
                    setSlug(generateSlug(e.target.value));
                  }
                }}
                placeholder="Ej: Nuevos Productos, Ofertas, Destacados"
                maxLength={50}
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-sm sm:text-base">Visibilidad</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {visible ? "El catálogo es visible en tu tienda" : "El catálogo está oculto"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                  visible ? "bg-primary" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    visible ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const catalogLimitReached = !!(planUsage?.maxCatalogs && planUsage.catalogsUsed >= planUsage.maxCatalogs);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Catálogos</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Organiza tus productos en diferentes categorías
          </p>
        </div>
        <Button onClick={openCreateForm} size="sm" className="sm:size-default md:size-lg flex-shrink-0" disabled={catalogLimitReached}>
          <Plus className="h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Nuevo</span>
        </Button>
      </div>

      {planUsage?.maxCatalogs ? (
        <PlanLimitBanner
          planCode={planUsage.planCode}
          resource="catalogs"
          used={planUsage.catalogsUsed}
          limit={planUsage.maxCatalogs}
        />
      ) : null}

      {catalogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="rounded-full bg-muted p-4 sm:p-6 mb-3 sm:mb-4">
              <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">No tienes catálogos aún</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 text-center max-w-sm">
              Crea catálogos para organizar tus productos en categorías
            </p>
            <Button onClick={openCreateForm} size="default" className="sm:size-lg">
              <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Crear primer catálogo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {catalogs.map((catalog) => (
            <Card key={catalog.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  {catalog.visible ? (
                    <Badge variant="default" className="gap-1 text-xs">
                      <Eye className="h-3 w-3" />
                      <span className="hidden sm:inline">Visible</span>
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <EyeOff className="h-3 w-3" />
                      <span className="hidden sm:inline">Oculto</span>
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold text-sm sm:text-lg mb-1 truncate">{catalog.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 truncate">/{catalog.slug}</p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditForm(catalog)}
                  >
                    <Edit className="h-4 w-4 mr-0 sm:mr-2" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(catalog.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
