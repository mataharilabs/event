"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { setPrimaryImage, removeEventImage } from "@/lib/admin/event-actions";
import { ImagePlus, Trash2, Star, Loader2 } from "lucide-react";
import type { EventImage } from "@/db/schema";

interface ImageManagerProps {
  eventId: string;
  primaryImageUrl: string | null;
  images: EventImage[];
}

export function ImageManager({ eventId, primaryImageUrl, images }: ImageManagerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploadError(null);
    setUploading(true);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("eventId", eventId);

        const res = await fetch("/api/admin/event-images", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(data.error ?? "Upload gagal.");
        }
      }
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload gagal.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSetPrimary(url: string) {
    startTransition(async () => {
      await setPrimaryImage(eventId, url);
      router.refresh();
    });
  }

  function handleDelete(imageId: string) {
    if (!confirm("Hapus gambar ini?")) return;
    startTransition(async () => {
      await removeEventImage(imageId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || isPending}
        >
          {uploading ? (
            <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Mengupload...</>
          ) : (
            <><ImagePlus className="h-4 w-4 mr-1.5" /> Upload Gambar</>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP — maks. 5 MB per file</p>
      </div>

      {uploadError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-2">{uploadError}</p>
      )}

      {/* Image grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => {
            const isPrimary = img.imageUrl === primaryImageUrl;
            return (
              <div key={img.id} className="group relative aspect-video rounded-lg overflow-hidden border bg-muted">
                <Image
                  src={img.imageUrl}
                  alt={img.altText ?? "Event image"}
                  fill
                  className="object-cover"
                  sizes="200px"
                />

                {/* Primary badge */}
                {isPrimary && (
                  <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" /> Primary
                  </div>
                )}

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!isPrimary && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      title="Set sebagai primary"
                      disabled={isPending}
                      onClick={() => handleSetPrimary(img.imageUrl)}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7"
                    title="Hapus gambar"
                    disabled={isPending}
                    onClick={() => handleDelete(img.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Klik untuk upload gambar event</p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — maks. 5 MB</p>
        </div>
      )}

      {images.length > 0 && !primaryImageUrl && (
        <p className="text-xs text-amber-600">
          Belum ada gambar primary. Hover pada gambar lalu klik <Star className="inline h-3 w-3" /> untuk menjadikannya primary.
        </p>
      )}
    </div>
  );
}
