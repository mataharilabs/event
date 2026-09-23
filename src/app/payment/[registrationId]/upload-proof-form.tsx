"use client";

import { useState, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { uploadPaymentProof } from "@/lib/payment/actions";
import { Upload, CheckCircle, Loader2, ImageIcon } from "lucide-react";

interface UploadProofFormProps {
  registrationId: string;
  onSuccess: () => void;
}

export function UploadProofForm({ registrationId, onSuccess }: UploadProofFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
      setError("File harus berupa gambar (JPG, PNG, WEBP) atau PDF.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB.");
      return;
    }
    setError(null);
    setFile(f);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      try {
        // Upload to Vercel Blob
        const formData = new FormData();
        formData.append("file", file);
        formData.append("registrationId", registrationId);

        const uploadRes = await fetch("/api/upload/payment-proof", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = (await uploadRes.json()) as { error?: string };
          setError(data.error ?? "Gagal mengunggah file.");
          return;
        }

        const { url } = (await uploadRes.json()) as { url: string };
        const result = await uploadPaymentProof(registrationId, url);

        if (!result.success) {
          setError(result.error ?? "Gagal menyimpan bukti bayar.");
          return;
        }

        setDone(true);
        setTimeout(() => onSuccess(), 1500);
      } catch {
        setError("Terjadi kesalahan. Coba lagi.");
      }
    });
  };

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-2">
        <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
        <p className="font-semibold">Bukti bayar dikirim!</p>
        <p className="text-sm text-muted-foreground">Admin akan memverifikasi dalam 1×24 jam.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Upload className="h-4 w-4" /> Upload Bukti Pembayaran
      </h3>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
      >
        {preview ? (
          // blob: URL preview — Next/Image doesn't support blob: URLs
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Bukti bayar preview" className="max-h-40 mx-auto rounded-lg object-contain" />
        ) : (
          <div className="space-y-2">
            <ImageIcon className="h-8 w-8 text-gray-300 mx-auto" />
            <p className="text-sm text-muted-foreground">Klik atau drag & drop gambar bukti bayar</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, PDF — maks 5MB</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {file && !error && (
        <p className="text-xs text-muted-foreground truncate">File: {file.name}</p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        className="w-full"
        disabled={!file || isPending || !!error}
        onClick={handleUpload}
      >
        {isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Mengunggah...</>
        ) : (
          <><Upload className="h-4 w-4 mr-2" /> Kirim Bukti Bayar</>
        )}
      </Button>
    </div>
  );
}
