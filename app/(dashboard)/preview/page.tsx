"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyStore } from "@/lib/actions/store";
import { ExternalLink, Eye, Monitor, Copy, Check } from "lucide-react";
import Link from "next/link";

export default function PreviewPage() {
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const result: any = await getMyStore();
    if (result.data) {
      setStore(result.data);
    }
    setLoading(false);
  }

  async function copyUrl() {
    if (!store) return;
    const fullUrl = `${window.location.origin}/${store.slug}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 sm:h-8 w-32 sm:w-48" />
          <Skeleton className="h-3 sm:h-4 w-48 sm:w-64" />
        </div>
        <Skeleton className="h-[calc(100vh-250px)] w-full" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <p className="text-xs sm:text-sm text-muted-foreground">No se encontró la tienda</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const publicUrl = `/${store.slug}`;
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${publicUrl}` : publicUrl;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Preview</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Vista previa de tu tienda pública
          </p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
          <Button variant="outline" size="sm" className="sm:size-default" onClick={copyUrl}>
            {copied ? (
              <>
                <Check className="h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Copiar URL</span>
              </>
            )}
          </Button>
          <Button size="sm" className="sm:size-default" asChild>
            <Link href={publicUrl} target="_blank" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Abrir en nueva pestaña</span>
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
            <CardTitle className="text-sm sm:text-lg">Vista Previa</CardTitle>
            <Badge variant="secondary" className="text-xs w-fit">{store.template || "minimal"}</Badge>
          </div>
          <CardDescription className=" text-xs mt-2 break-all">
            {fullUrl}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <iframe
            src={publicUrl}
            className="w-full h-[calc(100vh-280px)] border-0"
            title="Preview del catálogo"
          />
        </CardContent>
      </Card>
    </div>
  );
}
