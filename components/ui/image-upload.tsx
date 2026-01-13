"use client";

import { useState } from "react";
import { Button } from "./button";
import { X, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/toast-provider";
import { createSignedUploadUrl } from "@/lib/actions/storage";

interface ImageUploadProps {
  images: Array<{ id?: string; path: string; url: string; sort_order: number }>;
  onImagesChange: (images: Array<{ id?: string; path: string; url: string; sort_order: number }>) => void;
  maxImages?: number;
  storeId?: string;
  productId?: string;
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  storeId,
  productId,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToast();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const remainingSlots = maxImages - images.length;

    if (files.length > remainingSlots) {
      addToast({ title: "Límite de imágenes", description: `Solo puedes subir ${remainingSlots} imagen(es) más`, variant: "error" });
      return;
    }

    setUploading(true);
    const newImages = [];

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          addToast({ title: "Archivo inválido", description: `${file.name} no es una imagen`, variant: "error" });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          addToast({ title: "Archivo muy pesado", description: `${file.name} supera los 5MB`, variant: "error" });
          continue;
        }

        if (!storeId) {
          addToast({ title: "Error al subir", description: "No se encontró la tienda.", variant: "error" });
          continue;
        }

        const signed = await createSignedUploadUrl({
          storeId,
          productId,
          fileName: file.name,
          contentType: file.type,
        });

        if (signed?.error || !signed?.data?.signedUrl) {
          addToast({ title: "Error al subir", description: signed?.error ?? "No se pudo firmar el upload", variant: "error" });
          continue;
        }

        const uploadResponse = await fetch(signed.data.signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          addToast({ title: "Error al subir", description: `No se pudo subir ${file.name}`, variant: "error" });
          continue;
        }

        newImages.push({
          path: signed.data.path,
          url: signed.data.publicUrl,
          sort_order: images.length + newImages.length,
        });
      }

      onImagesChange([...images, ...newImages]);
    } catch (error) {
      console.error("Error uploading images:", error);
      addToast({ title: "Error al subir imágenes", description: "Intenta nuevamente", variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveImage(index: number) {
    const newImages = images.filter((_, i) => i !== index);
    // Reorder remaining images
    const reordered = newImages.map((img, i) => ({ ...img, sort_order: i }));
    onImagesChange(reordered);
  }

  function moveImage(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const newImages = [...images];
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];

    // Update sort_order
    const reordered = newImages.map((img, i) => ({ ...img, sort_order: i }));
    onImagesChange(reordered);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Imágenes ({images.length}/{maxImages})
        </label>
        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Subir imagen
              </>
            )}
          </Button>
        )}
      </div>

      <input
        id="image-upload"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group rounded-lg border overflow-hidden bg-gray-50">
              <div className="aspect-square relative">
                <Image
                  src={image.url}
                  alt={`Imagen ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index > 0 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={() => moveImage(index, "up")}
                    className="h-8 w-8"
                  >
                    ←
                  </Button>
                )}
                {index < images.length - 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={() => moveImage(index, "down")}
                    className="h-8 w-8"
                  >
                    →
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={() => handleRemoveImage(index)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
