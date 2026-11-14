import type { EmailService, SendEmailParams } from "./types";

export interface ResendConfig {
  apiKey: string;
  from: string;
}

export class ResendEmailService implements EmailService {
  private readonly apiKey: string;
  private readonly from: string;

  constructor(config: ResendConfig) {
    if (!config.apiKey) throw new Error("Resend API key not configured");
    this.apiKey = config.apiKey;
    this.from = config.from || "AsiaCommerce Event <noreply@asiacommerce.net>";
  }

  async sendEmail(params: SendEmailParams): Promise<{ messageId: string }> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Email send failed: ${JSON.stringify(err)}`);
    }

    const data = (await response.json()) as { id: string };
    return { messageId: data.id };
  }
}

/**
 * Build a Resend service from admin-configured settings (fallback to env).
 * Returns null if email is disabled or no API key is set.
 */
export async function getEmailService(): Promise<EmailService | null> {
  const { getPaymentSettings } = await import("@/lib/settings/payment");
  const s = await getPaymentSettings();

  if (!s.emailEnabled) return null;
  const apiKey = s.resendApiKey || process.env.EMAIL_API_KEY || "";
  const from = s.resendFromEmail || process.env.EMAIL_FROM || "AsiaCommerce Event <noreply@asiacommerce.net>";
  if (!apiKey) return null;

  return new ResendEmailService({ apiKey, from });
}
