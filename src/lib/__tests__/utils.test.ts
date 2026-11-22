import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { maskEmail, parseJson, safeInternalPath, slugify, truncate } from '../utils';
import { brl, centsToInput, formatBytes, inputToCents } from '../format';

describe('slugify', () => {
  it('remove acentos e espaços', () => {
    assert.equal(slugify('Vestido Linho Solta'), 'vestido-linho-solta');
    assert.equal(slugify('Calça Pantalona'), 'calca-pantalona');
  });

  it('remove caracteres especiais e hífens nas pontas', () => {
    assert.equal(slugify('  --Camisa Oversized!! -- '), 'camisa-oversized');
  });
});

describe('safeInternalPath', () => {
  it('aceita caminhos internos', () => {
    assert.equal(safeInternalPath('/minha-conta'), '/minha-conta');
    assert.equal(safeInternalPath('/checkout?cupom=10'), '/checkout?cupom=10');
  });

  it('bloqueia redirecionamento externo', () => {
    assert.equal(safeInternalPath('https://evil.com'), '/');
    assert.equal(safeInternalPath('//evil.com'), '/');
    assert.equal(safeInternalPath(null, '/carrinho'), '/carrinho');
  });
});

describe('parseJson', () => {
  it('devolve o fallback quando o valor é inválido', () => {
    assert.deepEqual(parseJson('{nao-e-json}', ['PP']), ['PP']);
    assert.deepEqual(parseJson(null, []), []);
  });

  it('lê JSON válido', () => {
    assert.deepEqual(parseJson('["A4","A0"]', []), ['A4', 'A0']);
  });
});

describe('maskEmail', () => {
  it('esconde a maior parte do endereço', () => {
    assert.equal(maskEmail('marina@example.com'), 'ma****@example.com');
  });
});

describe('truncate', () => {
  it('corta e adiciona reticências', () => {
    assert.equal(truncate('abcdefghij', 5), 'abcd…');
    assert.equal(truncate('abc', 5), 'abc');
  });
});

describe('formatação de dinheiro', () => {
  it('formata centavos em reais', () => {
    assert.match(brl(1900), /19,00/);
    assert.match(brl(0), /0,00/);
  });

  it('converte entre centavos e campo de formulário', () => {
    assert.equal(centsToInput(1900), '19,00');
    assert.equal(inputToCents('19,00'), 1900);
    assert.equal(inputToCents('19.90'), 1990);
    assert.equal(inputToCents(''), null);
  });
});

describe('formatBytes', () => {
  it('mostra tamanho legível', () => {
    assert.match(formatBytes(1024), /1 KB/);
    assert.match(formatBytes(1024 * 1024 * 2), /2,0 MB/);
    assert.equal(inputToCents('1.234,56'), 123456);
  });
});
