import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isDemoPaymentMode } from '../payments/index';
import { adminSeedPlan, shouldApplySeed } from '../seed-guards';
import { emailFooterContact } from '../email-footer';

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe('modo demonstração', () => {
  it('fica desligado em produção sem Mercado Pago', () => {
    assert.equal(isDemoPaymentMode(env({ NODE_ENV: 'production' })), false);
  });
  it('liga fora de produção ou com ALLOW_DEMO_GATEWAY', () => {
    assert.equal(isDemoPaymentMode(env({ NODE_ENV: 'development' })), true);
    assert.equal(isDemoPaymentMode(env({ NODE_ENV: 'production', ALLOW_DEMO_GATEWAY: 'true' })), true);
  });
  it('desliga com Mercado Pago configurado', () => {
    assert.equal(
      isDemoPaymentMode(env({ NODE_ENV: 'development', PAYMENT_GATEWAY: 'mercadopago', MERCADOPAGO_ACCESS_TOKEN: 'x' })),
      false,
    );
  });
});

describe('seed respeita edições do painel', () => {
  const at = new Date('2026-11-22T10:00:00Z');
  it('aplica na primeira vez', () => {
    assert.equal(shouldApplySeed({ stored: null, hash: 'a', recordUpdatedAt: null }), true);
  });
  it('não reaplica o mesmo conteúdo', () => {
    assert.equal(shouldApplySeed({ stored: { hash: 'a', at }, hash: 'a', recordUpdatedAt: at }), false);
  });
  it('aplica conteúdo novo quando ninguém editou no painel', () => {
    assert.equal(shouldApplySeed({ stored: { hash: 'a', at }, hash: 'b', recordUpdatedAt: at }), true);
  });
  it('preserva o que foi editado no painel depois do último seed', () => {
    assert.equal(
      shouldApplySeed({ stored: { hash: 'a', at }, hash: 'b', recordUpdatedAt: new Date('2026-11-23T10:00:00Z') }),
      false,
    );
  });
});

describe('administrador do seed', () => {
  it('não cria admin se já existe algum', () => {
    assert.equal(adminSeedPlan({ adminCount: 1, env: env({ NODE_ENV: 'production' }) }), 'skip');
  });
  it('em produção sem senha definida recusa criar com a senha padrão', () => {
    assert.throws(() => adminSeedPlan({ adminCount: 0, env: env({ NODE_ENV: 'production' }) }), /SEED_ADMIN_PASSWORD/);
  });
  it('cria quando não há admin e a senha foi definida', () => {
    assert.equal(adminSeedPlan({ adminCount: 0, env: env({ NODE_ENV: 'production', SEED_ADMIN_PASSWORD: 'forte-123456' }) }), 'create');
  });
});

describe('rodapé dos e-mails', () => {
  it('não mostra placeholders', () => {
    assert.equal(emailFooterContact({ email: '[EMAIL]', whatsapp: '[WHATSAPP]' }), '');
  });
  it('mostra o que existe', () => {
    assert.equal(emailFooterContact({ email: 'oi@fioforma.com.br', whatsapp: '' }), 'Dúvidas: oi@fioforma.com.br');
  });
});
