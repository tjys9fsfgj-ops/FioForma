import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PDFDocument } from 'pdf-lib';
import { moldes } from '../moldes/index';
import { A0_FORMAT_VARIANTS, renderA0, renderA4, TEST_SQUARE_PT } from '../pdf';

const saiaGode = moldes.find((m) => m.slug === 'saia-gode')!;
const bolsaTote = moldes.find((m) => m.slug === 'bolsa-tote')!;

describe('PDF A4', () => {
  it('todas as páginas são A4 e a contagem bate', async () => {
    const a4 = await renderA4(saiaGode, 'inteira');
    const doc = await PDFDocument.load(a4.bytes);
    assert.equal(doc.getPageCount(), a4.pages);
    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();
      assert.ok(Math.abs(width - 595.28) < 0.5 && Math.abs(height - 841.89) < 0.5);
    }
  });

  it('título identifica o modelo e a versão', async () => {
    const a4 = await renderA4(saiaGode, 'inteira');
    const doc = await PDFDocument.load(a4.bytes);
    assert.equal(doc.getTitle(), 'FioForma — Modelo nº 001 · Saia Godê (godê inteiro)');
  });

  it('o quadrado de teste mede 5 cm', () => {
    assert.ok(Math.abs(TEST_SQUARE_PT - 141.73) < 0.01);
  });

  it('o mosaico só tem folhas com traço e nomes únicos', async () => {
    const a4 = await renderA4(saiaGode, 'meia');
    const cols = Math.max(...a4.tiles.map((t) => t.col)) + 1;
    const rows = Math.max(...a4.tiles.map((t) => t.row)) + 1;
    assert.ok(a4.tiles.length > 1);
    assert.ok(a4.tiles.length <= cols * rows);
    assert.equal(new Set(a4.tiles.map((t) => `${t.col}-${t.row}`)).size, a4.tiles.length);
    // 6 páginas fixas (capa, ficha, medidas, corte, passos, teste) + folhas
    assert.ok(a4.pages >= 6 + a4.tiles.length);
  });

  it('molde sem peças desenhadas não tem mosaico', async () => {
    const a4 = await renderA4(moldes.find((m) => m.slug === 'saia-franzida')!, 'unica');
    assert.equal(a4.tiles.length, 0);
    assert.ok(a4.pages >= 6);
  });

  it('gabarito pequeno cabe numa folha só', async () => {
    const a4 = await renderA4(bolsaTote, 'unica');
    assert.equal(a4.tiles.length, 1);
  });
});

describe('PDF A0', () => {
  it('meio-godê em uma folha A0', async () => {
    const a0 = await renderA0(saiaGode, 'meia');
    const doc = await PDFDocument.load(a0.bytes);
    assert.equal(doc.getPageCount(), 1);
    const { width, height } = doc.getPage(0).getSize();
    assert.ok(Math.abs(width - 2383.94) < 1 && Math.abs(height - 3370.39) < 1);
  });

  it('só gera A0 para moldes com peças grandes desenhadas', () => {
    assert.deepEqual(A0_FORMAT_VARIANTS(saiaGode), ['inteira', 'meia']);
    assert.deepEqual(A0_FORMAT_VARIANTS(bolsaTote), []);
  });
});
