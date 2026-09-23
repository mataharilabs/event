import type { WhatsAppService, SendWhatsAppParams } from "./types";

export class WhatsAppApiService implements WhatsAppService {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor() {
    const key = process.env.WHATSAPP_API_KEY;
    const url = process.env.WHATSAPP_API_URL;
    if (!key || !url) throw new Error("WhatsApp API credentials not configured");
    this.apiKey = key;
    this.apiUrl = url.replace(/\/$/, "");
  }

  async sendMessage(params: SendWhatsAppParams): Promise<{ messageId: string }> {
    // Generic WhatsApp HTTP API format (compatible with most providers)
    const body = params.templateName
      ? {
          to: params.to,
          type: "template",
          template: {
            name: params.templateName,
            language: { code: "id" },
            components: params.templateParams
              ? [{ type: "body", parameters: Object.values(params.templateParams).map((v) => ({ type: "text", text: v })) }]
              : [],
          },
        }
      : {
          to: params.to,
          type: "text",
          text: { body: params.message },
        };

    const response = await fetch(`${this.apiUrl}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`WhatsApp send failed: ${JSON.stringify(err)}`);
    }

    const data = (await response.json()) as { messages?: Array<{ id: string }>; id?: string };
    const messageId = data.messages?.[0]?.id ?? data.id ?? "unknown";
    return { messageId };
  }
}

export function getWhatsAppService(): WhatsAppService {
  return new WhatsAppApiService();
}
