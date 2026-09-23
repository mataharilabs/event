import type { PaymentService, CreatePaymentParams, PaymentResult } from "./types";

const XENDIT_BASE_URL = "https://api.xendit.co";

export class XenditPaymentService implements PaymentService {
  private readonly secretKey: string;
  private readonly webhookToken: string;

  constructor() {
    const key = process.env.XENDIT_SECRET_KEY;
    const token = process.env.XENDIT_WEBHOOK_TOKEN;
    if (!key || !token) throw new Error("Xendit credentials not configured");
    this.secretKey = key;
    this.webhookToken = token;
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const authHeader = `Basic ${Buffer.from(`${this.secretKey}:`).toString("base64")}`;

    const body = {
      external_id: params.registrationId,
      amount: params.amount,
      currency: params.currency,
      payer_email: params.email,
      description: params.description,
      customer: { given_names: params.name, email: params.email },
      items: [{ name: params.description, quantity: 1, price: params.amount }],
      success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/${params.registrationId}/success`,
      failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/${params.registrationId}?status=failed`,
      invoice_duration: 86400, // 24 hours
    };

    const response = await fetch(`${XENDIT_BASE_URL}/v2/invoices`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Xendit invoice creation failed: ${JSON.stringify(err)}`);
    }

    const data = (await response.json()) as {
      id: string;
      invoice_url: string;
      status: string;
    };

    return {
      externalPaymentId: data.id,
      invoiceUrl: data.invoice_url,
      status: data.status.toLowerCase(),
    };
  }

  async verifyWebhook(_payload: unknown, signature: string): Promise<boolean> {
    return signature === this.webhookToken;
  }
}

export function getXenditService(): XenditPaymentService {
  return new XenditPaymentService();
}
