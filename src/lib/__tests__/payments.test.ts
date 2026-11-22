import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isPaymentReady } from '../payments/index';

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe('isPaymentReady', () => {
  it('produção sem gateway configurado não está pronta', () => {
    assert.equal(isPaymentReady(env({ NODE_ENV: 'production' })), false);
    assert.equal(isPaymentReady(env({ NODE_ENV: 'production', PAYMENT_GATEWAY: 'mercadopago' })), false);
  });

  it('produção com Mercado Pago e token está pronta', () => {
    assert.equal(
      isPaymentReady(env({ NODE_ENV: 'production', PAYMENT_GATEWAY: 'mercadopago', MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-x' })),
      true,
    );
  });

  it('desenvolvimento usa o simulador', () => {
    assert.equal(isPaymentReady(env({ NODE_ENV: 'development' })), true);
  });

  it('demo liberada explicitamente em produção', () => {
    assert.equal(isPaymentReady(env({ NODE_ENV: 'production', ALLOW_DEMO_GATEWAY: 'true' })), true);
  });
});
