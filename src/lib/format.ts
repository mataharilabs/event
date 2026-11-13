export function formatCurrency(amount: number, currency = "IDR"): string {
  if (amount === 0) return "GRATIS";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date, timezone = "Asia/Jakarta"): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
}

export function formatTime(date: Date, timezone = "Asia/Jakarta"): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(date);
}

/** Short month (e.g. "NOV") + day number for the calendar-style card badge. */
export function formatDateBadge(date: Date, timezone = "Asia/Jakarta"): { month: string; day: string } {
  const month = new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: timezone })
    .format(date)
    .replace(".", "")
    .toUpperCase();
  const day = new Intl.DateTimeFormat("id-ID", { day: "numeric", timeZone: timezone }).format(date);
  return { month, day };
}

/** Weekday name (e.g. "Minggu"). */
export function formatDayName(date: Date, timezone = "Asia/Jakarta"): string {
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", timeZone: timezone }).format(date);
}

/** Whole calendar days from `now` until `date` (negative if past). */
export function daysUntil(date: Date, now: Date = new Date()): number {
  const d1 = new Date(date);
  const d2 = new Date(now);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return Math.round((d1.getTime() - d2.getTime()) / 86_400_000);
}

export function formatDateRange(start: Date, end: Date, timezone = "Asia/Jakarta"): string {
  const startStr = formatDate(start, timezone);
  const endStr = formatDate(end, timezone);

  if (startStr === endStr) return startStr;
  return `${startStr} – ${endStr}`;
}
