import { createHmac, timingSafeEqual } from 'node:crypto';
import { brand } from '@/config/brand';
import type {
  CheckoutMethod,
  CreatePaymentParams,
  CreatePaymentResult,
  GatewayPayment,
  GatewayPaymentStatus,
  PaymentGateway,
  WebhookVerification,
} from './types';

const API = 'https://api.mercadopago.com';

function accessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');
  return token;
}

function mapStatus(status: string): GatewayPaymentStatus {
  switch (status) {
    case 'approved':
      return 'approved';
    case 'pending':
    case 'authorized':
      return 'pending';
    case 'in_process':
      return 'in_process';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    case 'expired':
      return 'expired';
    default:
      return 'unknown';
  }
}

function mapMethod(paymentTypeId: string | undefined, paymentMethodId: string | undefined): CheckoutMethod | null {
  const value = `${paymentTypeId ?? ''} ${paymentMethodId ?? ''}`.toLowerCase();
  if (value.includes('pix') || value.includes('bank_transfer')) return 'PIX';
  if (value.includes('card') || value.includes('credit')) return 'CARD';
  return null;
}

export const mercadoPagoGateway: PaymentGateway = {
  id: 'mercadopago',
  label: 'Mercado Pago',
  demo: false,

  async createPayment({ order, method, siteUrl }: CreatePaymentParams): Promise<CreatePaymentResult> {
    const token = accessToken();
    const excluded =
      method === 'PIX'
        ? [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'ticket' }, { id: 'atm' }]
        : [{ id: 'ticket' }, { id: 'atm' }, { id: 'bank_transfer' }, { id: 'pix' }];

    const backUrl = `${siteUrl}/pedido/${order.number}?t=${order.accessToken}`;

    const response = await fetch(`${API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `order-${order.id}-${method.toLowerCase()}`,
      },
      body: JSON.stringify({
        items: [
          {
            id: order.number,
            title: `Pedido ${order.number} — ${brand.name}`,
            description: 'Moldes digitais em PDF',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: Number((order.totalCents / 100).toFixed(2)),
          },
        ],
        payer: { email: order.email, name: order.customerName },
        external_reference: order.id,
        statement_descriptor: brand.name.toUpperCase().slice(0, 22),
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        back_urls: { success: backUrl, pending: backUrl, failure: backUrl },
        auto_return: 'approved',
        payment_methods: { excluded_payment_types: excluded, installments: 12 },
        metadata: { order_id: order.id, order_number: order.number },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('[mercadopago] falha ao criar preferência', response.status, detail.slice(0, 400));
      throw new Error('Não foi possível iniciar o pagamento. Tente novamente em instantes.');
    }

    const data = (await response.json()) as {
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
    };

    const isTest = token.startsWith('TEST-') || token.startsWith('APP_USR-TEST');
    const url = isTest ? data.sandbox_init_point ?? data.init_point : data.init_point ?? data.sandbox_init_point;
    if (!url) throw new Error('Mercado Pago não retornou a URL de pagamento.');

    return { kind: 'redirect', url, paymentId: data.id };
  },

  async getPayment(paymentId: string): Promise<GatewayPayment | null> {
    const response = await fetch(`${API}/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${accessToken()}` },
      cache: 'no-store',
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Consulta de pagamento falhou (${response.status}).`);
    }
    const data = (await response.json()) as {
      id: number;
      status: string;
      status_detail?: string;
      transaction_amount: number;
      external_reference?: string;
      payment_type_id?: string;
      payment_method_id?: string;
    };

    return {
      id: String(data.id),
      status: mapStatus(data.status),
      amountCents: Math.round(data.transaction_amount * 100),
      externalReference: data.external_reference ?? null,
      method: mapMethod(data.payment_type_id, data.payment_method_id),
      statusDetail: data.status_detail ?? null,
    };
  },

  /**
   * Verifica a assinatura x-signature do Mercado Pago:
   * manifest = "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
   */
  async verifyWebhook(headers: Headers, rawBody: string): Promise<WebhookVerification> {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret) return { ok: false, reason: 'MERCADOPAGO_WEBHOOK_SECRET ausente.' };

    let body: { type?: string; action?: string; data?: { id?: string | number } };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return { ok: false, reason: 'Corpo inválido.' };
    }

    const dataId = body.data?.id ? String(body.data.id) : '';
    if (!dataId) return { ok: false, reason: 'Notificação sem data.id.' };

    const signature = headers.get('x-signature') ?? '';
    const requestId = headers.get('x-request-id') ?? '';
    const parts = new Map(
      signature
        .split(',')
        .map((part) => part.split('='))
        .filter((pair): pair is [string, string] => pair.length === 2)
        .map(([key, value]) => [key.trim(), value.trim()]),
    );
    const ts = parts.get('ts');
    const v1 = parts.get('v1');
    if (!ts || !v1) return { ok: false, reason: 'Assinatura ausente.' };

    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
    const expected = createHmac('sha256', secret).update(manifest).digest('hex');

    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(v1, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: 'Assinatura inválida.' };
    }

    const eventId = `mp:${dataId}:${body.action ?? body.type ?? 'payment'}:${ts}`;
    return { ok: true, paymentId: dataId, eventId };
  },
};
