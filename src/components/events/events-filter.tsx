"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "", label: "Semua" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "On Going" },
  { value: "past", label: "Past" },
];

const TYPE_FILTERS = [
  { value: "", label: "Semua Tipe" },
  { value: "free", label: "Gratis" },
  { value: "paid", label: "Berbayar" },
];

const MODE_FILTERS = [
  { value: "", label: "Semua Mode" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

export function EventsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/events?${params.toString()}`);
    },
    [router, searchParams]
  );

  const currentStatus = searchParams.get("status") ?? "";
  const currentType = searchParams.get("type") ?? "";
  const currentMode = searchParams.get("mode") ?? "";
  const currentSearch = searchParams.get("q") ?? "";

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari event..."
          defaultValue={currentSearch}
          onChange={(e) => {
            const val = e.target.value;
            const params = new URLSearchParams(searchParams.toString());
            if (val) {
              params.set("q", val);
            } else {
              params.delete("q");
            }
            params.delete("page");
            router.push(`/events?${params.toString()}`);
          }}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={currentStatus === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("status", f.value)}
            className={cn(currentStatus === f.value && "pointer-events-none")}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Type & mode */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={currentType === f.value ? "secondary" : "outline"}
            size="sm"
            onClick={() => updateFilter("type", f.value)}
          >
            {f.label}
          </Button>
        ))}
        <span className="text-border self-center">|</span>
        {MODE_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={currentMode === f.value ? "secondary" : "outline"}
            size="sm"
            onClick={() => updateFilter("mode", f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
