/**
 * Validates required server-side environment variables at startup.
 * Call this in server entry points or route handlers that depend on them.
 * Throws clearly so misconfiguration is caught early, not buried in runtime errors.
 */

interface EnvConfig {
  required: string[];
  optional?: string[];
}

const SERVER_ENV: EnvConfig = {
  required: [
    "DATABASE_URL",
    "AUTH_SECRET",
    "NEXT_PUBLIC_APP_URL",
  ],
  optional: [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "SSO_CLIENT_ID",
    "SSO_CLIENT_SECRET",
    "SSO_ISSUER_URL",
    "XENDIT_SECRET_KEY",
    "XENDIT_WEBHOOK_TOKEN",
    "EMAIL_API_KEY",
    "WHATSAPP_API_KEY",
    "WHATSAPP_API_URL",
    "BLOB_READ_WRITE_TOKEN",
  ],
};

let validated = false;

export function validateEnv(): void {
  if (validated) return;

  const missing: string[] = [];

  for (const key of SERVER_ENV.required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join("\n")}\n\nCheck .env.local or Vercel environment settings.`
    );
  }

  if (process.env.NODE_ENV !== "production") {
    const missingOptional = (SERVER_ENV.optional ?? []).filter((k) => !process.env[k]);
    if (missingOptional.length > 0) {
      console.warn(
        `[env] Optional variables not set (some features may not work):\n${missingOptional.map((k) => `  - ${k}`).join("\n")}`
      );
    }
  }

  validated = true;
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable "${key}" is not set.`);
  }
  return value;
}
