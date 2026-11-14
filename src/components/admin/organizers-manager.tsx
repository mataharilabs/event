"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createOrganizer, updateOrganizer, deleteOrganizer } from "@/lib/admin/organizer-actions";
import { uploadBrandingImage } from "@/lib/admin/settings-actions";
import { Plus, Pencil, Trash2, Loader2, Upload, Building2, ExternalLink } from "lucide-react";

interface OrganizerRow {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  website: string | null;
  description: string | null;
  eventCount: number;
}

export function OrganizersManager({ organizers }: { organizers: OrganizerRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<string | null>(null); // null | "new" | id
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openAdd() {
    setEditing("new"); setName(""); setLogoUrl(null); setWebsite(""); setDescription(""); setError(null);
  }
  function openEdit(o: OrganizerRow) {
    setEditing(o.id); setName(o.name); setLogoUrl(o.logoUrl); setWebsite(o.website ?? ""); setDescription(o.description ?? ""); setError(null);
  }

  function uploadLogo(file: File) {
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", "organizer");
    uploadBrandingImage(fd)
      .then((res) => (res.success ? setLogoUrl(res.url) : setError(res.error)))
      .finally(() => setUploading(false));
  }

  function save() {
    setError(null);
    const payload = { name, logoUrl: logoUrl ?? "", website, description };
    startTransition(async () => {
      const res = editing === "new" ? await createOrganizer(payload) : await updateOrganizer(editing!, payload);
      if (!res.success) { setError(res.error ?? "Gagal menyimpan."); return; }
      setEditing(null);
      router.refresh();
    });
  }

  function remove(id: string, eventCount: number) {
    const msg = eventCount > 0
      ? `Hapus penyelenggara ini? ${eventCount} event akan kehilangan penyelenggaranya (tidak terhapus).`
      : "Hapus penyelenggara ini?";
    if (!confirm(msg)) return;
    startTransition(async () => {
      const res = await deleteOrganizer(id);
      if (!res.success) alert("Gagal menghapus.");
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {editing === null && (
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" /> Tambah Penyelenggara</Button>
      )}

      {editing !== null && (
        <div className="rounded-xl border p-5 space-y-3 bg-muted/20">
          <p className="font-medium text-sm">{editing === "new" ? "Tambah Penyelenggara" : "Edit Penyelenggara"}</p>
          <div className="flex items-start gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Logo</Label>
              <label className="relative flex items-center justify-center h-20 w-20 rounded-lg border border-dashed bg-muted/40 cursor-pointer overflow-hidden hover:border-primary/50">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : logoUrl ? (
                  <Image src={logoUrl} alt="Logo" fill className="object-contain p-1" sizes="80px" />
                ) : <Upload className="h-4 w-4 text-muted-foreground" />}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = ""; }} />
              </label>
            </div>
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nama <span className="text-destructive">*</span></Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama penyelenggara" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Deskripsi</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Tentang penyelenggara..." />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={isPending || !name.trim()}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setError(null); }}>Batal</Button>
          </div>
        </div>
      )}

      {organizers.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-muted-foreground text-sm">
          Belum ada penyelenggara.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {organizers.map((o) => (
            <div key={o.id} className="flex items-center gap-3 rounded-xl border p-4 bg-white">
              <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {o.logoUrl ? <Image src={o.logoUrl} alt={o.name} fill className="object-contain p-1" sizes="48px" /> : <Building2 className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{o.name}</p>
                <p className="text-xs text-muted-foreground">{o.eventCount} event</p>
                {o.website && (
                  <a href={o.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    Website <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)} disabled={isPending}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => remove(o.id, o.eventCount)} disabled={isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
