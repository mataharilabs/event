import { createHash } from "crypto";
import type { PaymentService, CreatePaymentParams, PaymentResult } from "./types";

export interface MidtransConfig {
  serverKey: string;
  isProduction: boolean;
}

/**
 * Midtrans Snap integration. createPayment opens a Snap transaction and returns
 * its hosted redirect_url; confirmation arrives via the webhook, whose
 * signature is verified with SHA512(order_id + status_code + gross_amount +
 * serverKey).
 */
export class MidtransPaymentService implements PaymentService {
  private readonly serverKey: string;
  private readonly baseUrl: string;

  constructor(config: MidtransConfig) {
    if (!config.serverKey) throw new Error("Midtrans credentials not configured");
    this.serverKey = config.serverKey;
    this.baseUrl = config.isProduction
      ? "https://app.midtrans.com"
      : "https://app.sandbox.midtrans.com";
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const authHeader = `Basic ${Buffer.from(`${this.serverKey}:`).toString("base64")}`;

    const body = {
      transaction_details: {
        order_id: params.registrationId,
        gross_amount: params.amount,
      },
      customer_details: {
        first_name: params.name,
        email: params.email,
      },
      item_details: [
        {
          id: params.registrationId,
          price: params.amount,
          quantity: 1,
          name: params.description.slice(0, 50),
        },
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/payment/${params.registrationId}/success`,
      },
    };

    const response = await fetch(`${this.baseUrl}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Midtrans Snap creation failed: ${JSON.stringify(err)}`);
    }

    const data = (await response.json()) as { token: string; redirect_url: string };

    return {
      externalPaymentId: params.registrationId,
      invoiceUrl: data.redirect_url,
      status: "pending",
    };
  }

  /**
   * `signature` is Midtrans' signature_key from the notification body.
   * The payload must carry order_id, status_code and gross_amount.
   */
  async verifyWebhook(payload: unknown, signature: string): Promise<boolean> {
    if (typeof payload !== "object" || payload === null) return false;
    const p = payload as Record<string, unknown>;
    const orderId = String(p.order_id ?? "");
    const statusCode = String(p.status_code ?? "");
    const grossAmount = String(p.gross_amount ?? "");
    if (!orderId || !statusCode || !grossAmount) return false;

    const expected = createHash("sha512")
      .update(`${orderId}${statusCode}${grossAmount}${this.serverKey}`)
      .digest("hex");

    return expected === signature;
  }
}

/**
 * Build a Midtrans service from admin-configured settings. Returns null if not
 * configured.
 */
export async function getMidtransService(): Promise<MidtransPaymentService | null> {
  const { getPaymentSettings } = await import("@/lib/settings/payment");
  const s = await getPaymentSettings();
  if (!s.midtransServerKey) return null;
  return new MidtransPaymentService({
    serverKey: s.midtransServerKey,
    isProduction: s.midtransIsProduction,
  });
}
