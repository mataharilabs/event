export interface CreatePaymentParams {
  registrationId: string;
  amount: number;
  currency: string;
  email: string;
  name: string;
  description: string;
}

export interface PaymentResult {
  externalPaymentId: string;
  invoiceUrl?: string;
  status: string;
}

export interface PaymentService {
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;
  verifyWebhook(payload: unknown, signature: string): Promise<boolean>;
}
