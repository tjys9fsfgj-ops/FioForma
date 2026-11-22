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

export function isDemoPaymentMode(): boolean {
  return process.env.PAYMENT_GATEWAY !== 'mercadopago' || !process.env.MERCADOPAGO_ACCESS_TOKEN;
}

export type { PaymentGateway, CheckoutMethod, CreatePaymentResult } from './types';
