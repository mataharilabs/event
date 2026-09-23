export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailService {
  sendEmail(params: SendEmailParams): Promise<{ messageId: string }>;
}
