import type { WhatsAppService, SendWhatsAppParams } from "./types";

export interface WhatsAppConfig {
  apiUrl: string;
  apiKey: string;
}

/** Normalize an Indonesian phone to international digits (62…) for the gateway. */
function normalizePhone(phone: string): string {
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "62" + p.slice(1);
  if (p.startsWith("8")) p = "62" + p;
  return p;
}

/**
 * Internal wa-gateway (https://github.com/mataharilabs/wa-gateway):
 * POST {baseUrl}/send  —  Authorization: Bearer <key>  —  body { to, message }
 */
export class WhatsAppApiService implements WhatsAppService {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(config: WhatsAppConfig) {
    if (!config.apiKey || !config.apiUrl) {
      throw new Error("WhatsApp gateway not configured");
    }
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl.replace(/\/$/, "");
  }

  async sendMessage(params: SendWhatsAppParams): Promise<{ messageId: string }> {
    const response = await fetch(`${this.apiUrl}/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: normalizePhone(params.to),
        message: params.message,
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      throw new Error(`WhatsApp send failed: ${response.status} ${err}`);
    }

    const data = (await response.json().catch(() => ({}))) as { id?: string; messageId?: string };
    return { messageId: data.messageId ?? data.id ?? "sent" };
  }
}

/**
 * Build a WhatsApp service from admin-configured settings (fallback to env).
 * Returns null if WhatsApp is disabled or not configured.
 */
export async function getWhatsAppService(): Promise<WhatsAppService | null> {
  const { getPaymentSettings } = await import("@/lib/settings/payment");
  const s = await getPaymentSettings();

  if (!s.whatsappEnabled) return null;
  const apiUrl = s.whatsappApiUrl || process.env.WHATSAPP_API_URL || "";
  const apiKey = s.whatsappApiKey || process.env.WHATSAPP_API_KEY || "";
  if (!apiUrl || !apiKey) return null;

  return new WhatsAppApiService({ apiUrl, apiKey });
}
