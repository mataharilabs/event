import type { EmailService, SendEmailParams } from "./types";

export class ResendEmailService implements EmailService {
  private readonly apiKey: string;
  private readonly from: string;

  constructor() {
    const key = process.env.EMAIL_API_KEY;
    if (!key) throw new Error("EMAIL_API_KEY not configured");
    this.apiKey = key;
    this.from = process.env.EMAIL_FROM ?? "noreply@asiacommerce.net";
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

export function getEmailService(): EmailService {
  return new ResendEmailService();
}
