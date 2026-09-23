export interface SendWhatsAppParams {
  to: string;
  message: string;
  templateName?: string;
  templateParams?: Record<string, string>;
}

export interface WhatsAppService {
  sendMessage(params: SendWhatsAppParams): Promise<{ messageId: string }>;
}
