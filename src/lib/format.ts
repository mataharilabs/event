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

export function formatDateRange(start: Date, end: Date, timezone = "Asia/Jakarta"): string {
  const startStr = formatDate(start, timezone);
  const endStr = formatDate(end, timezone);

  if (startStr === endStr) return startStr;
  return `${startStr} – ${endStr}`;
}
