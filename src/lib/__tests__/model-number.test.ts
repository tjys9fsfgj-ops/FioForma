import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatModelNumber } from '../format';

describe('formatModelNumber', () => {
  it('completa com zeros à esquerda', () => {
    assert.equal(formatModelNumber('1'), 'Modelo nº 001');
    assert.equal(formatModelNumber('004'), 'Modelo nº 004');
  });

  it('retorna null quando não há número', () => {
    assert.equal(formatModelNumber(null), null);
    assert.equal(formatModelNumber('  '), null);
  });
});
