"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RegistrationForm, type RegistrationTicket, type CustomField } from "./registration-form";
import { formatDate, formatTime, formatCurrency } from "@/lib/format";
import { getEventDisplayStatus, getCountdownLabel } from "@/lib/events/display-status";
import { X, MapPin, Calendar, Clock, Share2, ChevronLeft, ExternalLink, Loader2 } from "lucide-react";
import type { EventLifecycleStatus } from "@/types";

interface ModalEvent {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  primaryImageUrl: string | null;
  startDatetime: string;
  endDatetime: string;
  timezone: string;
  attendanceMode: string;
  venueName: string | null;
  venueAddress: string | null;
  googleMapsUrl: string | null;
  lifecycleStatus: EventLifecycleStatus;
}

interface ModalData {
  event: ModalEvent;
  tickets: (RegistrationTicket & { currency: string })[];
  fields: CustomField[];
  viewer: { isAuthenticated: boolean; name: string; email: string };
}

const countdownTone: Record<string, string> = {
  ongoing: "bg-green-600/90 text-white",
  upcoming: "bg-black/70 text-white",
  past: "bg-gray-500/80 text-white",
  cancelled: "bg-red-600/90 text-white",
};

export function EventDetailModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slug = searchParams.get("event");

  const [data, setData] = useState<ModalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<"detail" | "register">("detail");

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("event");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  // Fetch detail whenever the slug changes.
  useEffect(() => {
    if (!slug) {
      setData(null);
      setStep("detail");
      setNotFound(false);
      return;
    }
    let active = true;
    setLoading(true);
    setNotFound(false);
    setStep("detail");
    fetch(`/api/events/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("not_found");
        return res.json();
      })
      .then((json: ModalData) => {
        if (active) setData(json);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!slug) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [slug, close]);

  if (!slug) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4"
      onClick={close}
    >
      <div
        className="bg-white w-full sm:max-w-md max-h-[92vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {notFound && !loading && (
          <div className="p-8 text-center space-y-3">
            <p className="font-semibold">Event tidak ditemukan</p>
            <Button variant="outline" onClick={close}>Tutup</Button>
          </div>
        )}

        {data && !loading && (
          <ModalBody
            data={data}
            step={step}
            onStep={setStep}
            onClose={close}
          />
        )}
      </div>
    </div>
  );
}

function ModalBody({
  data,
  step,
  onStep,
  onClose,
}: {
  data: ModalData;
  step: "detail" | "register";
  onStep: (s: "detail" | "register") => void;
  onClose: () => void;
}) {
  const { event, tickets, fields, viewer } = data;
  const start = new Date(event.startDatetime);
  const end = new Date(event.endDatetime);
  const displayStatus = getEventDisplayStatus(
    { lifecycleStatus: event.lifecycleStatus, startDatetime: start, endDatetime: end },
    new Date()
  );
  const countdown = getCountdownLabel(displayStatus, start);
  const prices = tickets.map((t) => t.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const isFree = prices.length > 0 && prices.every((p) => p === 0);
  const canRegister = displayStatus === "upcoming" || displayStatus === "ongoing";

  function share() {
    const url = `${window.location.origin}/${event.slug}`;
    if (navigator.share) {
      navigator.share({ title: event.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
    }
  }

  return (
    <>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {step === "detail" ? (
          <>
            {/* Poster */}
            <div className="relative aspect-[4/3] bg-gray-900 overflow-hidden">
              {event.primaryImageUrl ? (
                <>
                  <Image src={event.primaryImageUrl} alt="" aria-hidden fill className="object-cover scale-110 blur-xl opacity-60" sizes="480px" />
                  <Image src={event.primaryImageUrl} alt={event.title} fill priority className="object-contain" sizes="480px" />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
              )}
              <div className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${countdownTone[displayStatus] ?? countdownTone.upcoming}`}>
                {countdown}
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isFree ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {isFree ? "Gratis" : tickets.length ? `Mulai ${formatCurrency(minPrice)}` : "—"}
                </span>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                  {event.attendanceMode === "online" ? "Online" : "Offline"}
                </span>
              </div>

              <h1 className="text-xl font-bold leading-snug">{event.title}</h1>

              {/* Date / time / venue */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0 text-primary" />
                  <span>{formatDate(start, event.timezone)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0 text-primary" />
                  <span>{formatTime(start, event.timezone)} – {formatTime(end, event.timezone)}</span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p>{event.attendanceMode === "online" ? "Online" : event.venueName ?? "TBA"}</p>
                    {event.attendanceMode !== "online" && event.venueAddress && (
                      <p className="text-xs">{event.venueAddress}</p>
                    )}
                    {event.googleMapsUrl && (
                      <a href={event.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5">
                        Buka Maps <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {event.description && (
                <div>
                  <h2 className="font-semibold text-sm mb-1">Tentang Event</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              <a href={`/${event.slug}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                Buka halaman lengkap <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </>
        ) : (
          <div className="p-4">
            <button onClick={() => onStep("detail")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ChevronLeft className="h-4 w-4" /> Kembali ke detail
            </button>
            <RegistrationForm
              eventId={event.id}
              eventTitle={event.title}
              tickets={tickets}
              isAuthenticated={viewer.isAuthenticated}
              defaultName={viewer.name}
              defaultEmail={viewer.email}
              defaultPhone=""
              fields={fields}
            />
          </div>
        )}
      </div>

      {/* Sticky footer (detail step only) */}
      {step === "detail" && (
        <div className="border-t p-3 flex items-center gap-2 bg-white">
          <Button variant="outline" size="lg" onClick={share} className="shrink-0">
            <Share2 className="h-4 w-4 mr-1.5" /> Bagikan
          </Button>
          {canRegister ? (
            <Button size="lg" className="flex-1" onClick={() => onStep("register")} disabled={tickets.length === 0}>
              {tickets.length === 0 ? "Tiket belum tersedia" : "Daftar Sekarang"}
            </Button>
          ) : (
            <Button size="lg" className="flex-1" disabled>
              {displayStatus === "past" ? "Event Telah Selesai" : "Pendaftaran Ditutup"}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
