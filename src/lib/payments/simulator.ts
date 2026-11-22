import type {
  CreatePaymentParams,
  CreatePaymentResult,
  GatewayPayment,
  PaymentGateway,
  WebhookVerification,
} from './types';

/**
 * Gateway de demonstração: NÃO movimenta dinheiro e NÃO deve ser usado em produção.
 * Existe para testar o fluxo completo (pedido -> confirmação -> entrega -> biblioteca)
 * enquanto as credenciais do Mercado Pago não estão disponíveis.
 */
export const simulatorGateway: PaymentGateway = {
  id: 'simulator',
  label: 'Demonstração (sem cobrança)',
  demo: true,

  async createPayment({ order, siteUrl }: CreatePaymentParams): Promise<CreatePaymentResult> {
    return {
      kind: 'redirect',
      url: `${siteUrl}/pagamento/demo/${order.number}?t=${order.accessToken}`,
      demo: true,
    };
  },

  async getPayment(paymentId: string): Promise<GatewayPayment | null> {
    return {
      id: paymentId,
      status: 'pending',
      amountCents: 0,
      externalReference: null,
      method: null,
    };
  },

  async verifyWebhook(): Promise<WebhookVerification> {
    return { ok: false, reason: 'O gateway de demonstração não recebe webhooks.' };
  },
};
