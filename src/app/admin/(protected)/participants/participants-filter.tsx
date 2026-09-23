"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface ParticipantsFilterProps {
  events: { id: string; title: string }[];
}

export function ParticipantsFilter({ events }: ParticipantsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const eventId = searchParams.get("eventId") ?? "";
  const status = searchParams.get("status") ?? "";

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const hasFilter = search || eventId || status;

  return (
    <div className="flex gap-3 flex-wrap items-center">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Nama, email, kode registrasi..."
          className="pl-9"
          defaultValue={search}
          onChange={(e) => {
            const val = e.target.value;
            const timeout = setTimeout(() => update("search", val), 400);
            return () => clearTimeout(timeout);
          }}
        />
      </div>

      <Select value={eventId || "all"} onValueChange={(v) => update("eventId", v === "all" ? "" : v)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Semua Event" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Event</SelectItem>
          {events.map((e) => (
            <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status || "all"} onValueChange={(v) => update("status", v === "all" ? "" : v)}>
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Semua Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="pending_payment">Menunggu Bayar</SelectItem>
          <SelectItem value="payment_verification">Verifikasi</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="waitlisted">Waitlist</SelectItem>
        </SelectContent>
      </Select>

      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)} className="text-muted-foreground">
          <X className="h-4 w-4 mr-1" /> Reset
        </Button>
      )}
    </div>
  );
}
