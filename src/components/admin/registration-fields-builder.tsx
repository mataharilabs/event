"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createRegistrationField,
  updateRegistrationField,
  deleteRegistrationField,
  moveRegistrationField,
} from "@/lib/admin/event-actions";
import type { RegistrationField } from "@/db/schema";
import { Trash2, Plus, Loader2, Pencil, ChevronUp, ChevronDown } from "lucide-react";

type FieldType = "text" | "textarea" | "number" | "dropdown";

const TYPE_LABEL: Record<string, string> = {
  text: "Teks",
  textarea: "Teks Panjang",
  number: "Angka",
  dropdown: "Pilihan (Dropdown)",
};

export function RegistrationFieldsBuilder({
  eventId,
  fields,
}: {
  eventId: string;
  fields: RegistrationField[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // null = closed; "new" = adding; otherwise = editing that field id
  const [editing, setEditing] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FieldType>("text");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState("");
  const [error, setError] = useState<string | null>(null);

  function openAdd() {
    setEditing("new");
    setLabel("");
    setType("text");
    setRequired(false);
    setOptions("");
    setError(null);
  }

  function openEdit(f: RegistrationField) {
    setEditing(f.id);
    setLabel(f.label);
    setType((["text", "textarea", "number", "dropdown"].includes(f.type) ? f.type : "text") as FieldType);
    setRequired(f.required);
    setOptions(Array.isArray(f.optionsJson) ? (f.optionsJson as string[]).join(", ") : "");
    setError(null);
  }

  function save() {
    setError(null);
    const payload = {
      label,
      type,
      required,
      options: type === "dropdown" ? options.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
    };
    startTransition(async () => {
      const res =
        editing === "new"
          ? await createRegistrationField({ eventId, ...payload })
          : await updateRegistrationField(editing!, payload);
      if (!res.success) {
        setError(res.error ?? "Gagal menyimpan field.");
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  function remove(fieldId: string) {
    if (!confirm("Hapus field ini? Jawaban peserta untuk field ini juga akan dihapus.")) return;
    startTransition(async () => {
      const res = await deleteRegistrationField(fieldId);
      if (!res.success) alert(res.error ?? "Gagal menghapus.");
      else router.refresh();
    });
  }

  function move(fieldId: string, direction: "up" | "down") {
    startTransition(async () => {
      await moveRegistrationField(fieldId, direction);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Field standar: <strong>Nama</strong>, <strong>Email</strong>, <strong>WhatsApp</strong> (selalu ada). Tambahkan field lain di bawah.
      </p>

      {fields.length > 0 && (
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted/30">
              <div className="flex flex-col">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  disabled={isPending || i === 0}
                  onClick={() => move(f.id, "up")}
                  aria-label="Naik"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  disabled={isPending || i === fields.length - 1}
                  onClick={() => move(f.id, "down")}
                  aria-label="Turun"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </p>
                <p className="text-xs text-muted-foreground">{TYPE_LABEL[f.type] ?? f.type}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending} onClick={() => openEdit(f)} title="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                disabled={isPending}
                onClick={() => remove(f.id)}
                title="Hapus"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {editing !== null ? (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
          <p className="text-sm font-medium">{editing === "new" ? "Tambah Field" : "Edit Field"}</p>
          <div className="space-y-1.5">
            <Label className="text-xs">Label Field <span className="text-destructive">*</span></Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Contoh: Pekerjaan, Asal Instansi..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipe</Label>
              <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Teks</SelectItem>
                  <SelectItem value="textarea">Teks Panjang</SelectItem>
                  <SelectItem value="number">Angka</SelectItem>
                  <SelectItem value="dropdown">Pilihan (Dropdown)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="h-4 w-4 rounded border-input" />
              Wajib diisi
            </label>
          </div>
          {type === "dropdown" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Pilihan (pisahkan dengan koma)</Label>
              <Input value={options} onChange={(e) => setOptions(e.target.value)} placeholder="Pelajar, Karyawan, Wiraswasta" />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={isPending || !label.trim()}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Field"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setError(null); }}>Batal</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1.5" /> Tambah Field
        </Button>
      )}
    </div>
  );
}
