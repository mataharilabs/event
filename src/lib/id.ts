import { randomBytes } from "crypto";

export function createId(): string {
  return randomBytes(12).toString("base64url");
}

export function createShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(8);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

export function createRegistrationCode(year: number): string {
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `AC-${year}-${suffix}`;
}
