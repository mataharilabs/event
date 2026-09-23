/**
 * SSO integration helpers.
 *
 * Authentication uses shared-cookie JWT: the SSO app at sso.asiacommerce.net
 * sets an Auth.js session cookie at domain=.asiacommerce.net with a shared
 * AUTH_SECRET. This app reads that cookie via auth() — no OAuth exchange needed.
 */

export function getSSOLoginUrl(callbackUrl?: string): string {
  const ssoUrl = process.env.SSO_URL ?? "https://sso.asiacommerce.net";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const target = callbackUrl ?? `${appUrl}/admin`;
  return `${ssoUrl}/login?callbackUrl=${encodeURIComponent(target)}`;
}

export function getSSOLogoutUrl(): string {
  const ssoUrl = process.env.SSO_URL ?? "https://sso.asiacommerce.net";
  return `${ssoUrl}/logout`;
}
