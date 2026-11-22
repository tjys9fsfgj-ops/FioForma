import { mercadoPagoGateway } from './mercadopago';
import { simulatorGateway } from './simulator';
import type { PaymentGateway } from './types';

export function getGateway(): PaymentGateway {
  const configured = process.env.PAYMENT_GATEWAY;

  if (configured === 'mercadopago') {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error(
        'PAYMENT_GATEWAY=mercadopago sem MERCADOPAGO_ACCESS_TOKEN. Configure a chave ou use PAYMENT_GATEWAY=simulator em desenvolvimento.',
      );
    }
    return mercadoPagoGateway;
  }

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_GATEWAY !== 'true') {
    throw new Error(
      'Gateway de demonstração bloqueado em produção. Configure PAYMENT_GATEWAY=mercadopago.',
    );
  }

  return simulatorGateway;
}

/**
 * Dá para cobrar agora? Em produção só com Mercado Pago e token; fora de
 * produção (ou com ALLOW_DEMO_GATEWAY=true) o simulador atende.
 */
export function isPaymentReady(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.PAYMENT_GATEWAY === 'mercadopago' && env.MERCADOPAGO_ACCESS_TOKEN) return true;
  if (env.NODE_ENV !== 'production') return true;
  return env.ALLOW_DEMO_GATEWAY === 'true';
}

export const PAYMENT_NOT_READY_MESSAGE =
  'O pagamento online está sendo configurado. Os moldes gratuitos já podem ser baixados; os pagos voltam em breve.';

/**
 * Simulador de pagamento ativo? Só sem Mercado Pago configurado E fora de
 * produção (ou com ALLOW_DEMO_GATEWAY=true). Em produção sem chave, pedidos
 * pagos não podem ser "aprovados" pela tela de demonstração.
 */
export function isDemoPaymentMode(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.PAYMENT_GATEWAY === 'mercadopago' && env.MERCADOPAGO_ACCESS_TOKEN) return false;
  return env.NODE_ENV !== 'production' || env.ALLOW_DEMO_GATEWAY === 'true';
}

export type { PaymentGateway, CheckoutMethod, CreatePaymentResult } from './types';
