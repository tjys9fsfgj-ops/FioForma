export type GatewayId = 'mercadopago' | 'simulator';
export type CheckoutMethod = 'PIX' | 'CARD';

export type GatewayOrder = {
  id: string;
  number: string;
  totalCents: number;
  email: string;
  customerName: string;
  accessToken: string;
};

export type CreatePaymentParams = {
  order: GatewayOrder;
  method: CheckoutMethod;
  siteUrl: string;
};

export type CreatePaymentResult =
  | { kind: 'redirect'; url: string; paymentId?: string; demo?: boolean }
  | {
      kind: 'pix';
      code: string;
      base64?: string;
      paymentId?: string;
      expiresAt?: Date;
      demo?: boolean;
    };

export type GatewayPaymentStatus =
  | 'approved'
  | 'pending'
  | 'in_process'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'expired'
  | 'unknown';

export type GatewayPayment = {
  id: string;
  status: GatewayPaymentStatus;
  amountCents: number;
  externalReference: string | null;
  method: CheckoutMethod | null;
  statusDetail?: string | null;
};

export type WebhookVerification = {
  ok: boolean;
  paymentId?: string;
  eventId?: string;
  reason?: string;
};

export interface PaymentGateway {
  id: GatewayId;
  label: string;
  /** true quando nenhum dinheiro real é movimentado (modo demonstração). */
  demo: boolean;
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  getPayment(paymentId: string): Promise<GatewayPayment | null>;
  verifyWebhook(headers: Headers, rawBody: string): Promise<WebhookVerification>;
}
