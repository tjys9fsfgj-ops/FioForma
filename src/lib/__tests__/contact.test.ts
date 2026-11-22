import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { contactChannels } from '../contact';

describe('contactChannels', () => {
  it('esconde canais com placeholder', () => {
    assert.deepEqual(contactChannels({ email: '[EMAIL]', whatsapp: '[WHATSAPP]' }), { email: null, whatsapp: null });
  });

  it('esconde canais vazios', () => {
    assert.deepEqual(contactChannels({ email: '', whatsapp: '' }), { email: null, whatsapp: null });
  });

  it('monta o link de e-mail', () => {
    assert.equal(contactChannels({ email: 'oi@fioforma.com.br', whatsapp: '' }).email?.href, 'mailto:oi@fioforma.com.br');
  });

  it('monta o link de WhatsApp só com dígitos', () => {
    assert.equal(contactChannels({ email: '', whatsapp: '+55 27 99999-0000' }).whatsapp?.href, 'https://wa.me/5527999990000');
  });

  it('ignora número curto demais', () => {
    assert.equal(contactChannels({ email: '', whatsapp: '1234' }).whatsapp, null);
  });
});
