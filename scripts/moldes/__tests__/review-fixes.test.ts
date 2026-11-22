import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bbox, boxedCornerMm, boxedDepthMm } from '../geometria';
import { BODY, SEAM_MM } from '../medidas';
import { moldes } from '../moldes/index';
import { A0_FORMAT_VARIANTS } from '../pdf';

const find = (slug: string) => moldes.find((m) => m.slug === slug)!;
const cornerSide = (slug: string, size: string) => {
  const piece = find(slug).variants[0].pieces.find((p) => p.id === 'canto')!;
  const o = piece.outlines.find((x) => x.size === size)!;
  const b = bbox(o.cut);
  return b.maxX - b.minX;
};

describe('fundo boxe', () => {
  it('quadrado do canto = metade do fundo + 1 margem, e o fundo pronto volta ao valor anunciado', () => {
    assert.equal(boxedCornerMm(100, SEAM_MM), 60);
    assert.equal(boxedDepthMm(60, SEAM_MM), 100);
  });

  it('bolsa tote recorta 6 cm para ter 10 cm de fundo', () => {
    assert.equal(cornerSide('bolsa-tote', 'Único'), 60);
  });

  it('nécessaire P recorta 5 cm (fundo 8) e M recorta 6 cm (fundo 10)', () => {
    assert.equal(cornerSide('necessaire-box', 'P'), 50);
    assert.equal(cornerSide('necessaire-box', 'M'), 60);
  });
});

describe('descrição bate com os arquivos', () => {
  it('só promete A0 quando o molde tem A0', () => {
    for (const m of moldes) {
      const hasA0 = A0_FORMAT_VARIANTS(m).length > 0;
      assert.equal(/\bA0\b/.test(m.description), hasA0, m.slug);
    }
  });
});

describe('saia godê: cós', () => {
  it('cós = cintura + 1 cm de folga (igual à saia) + 3 cm de transpasse + margens', () => {
    const cos = find('saia-gode').variants[0].directCuts.find((d) => d.name === 'Cós')!;
    assert.equal(cos.bySize?.M?.widthMm, BODY.M.waist * 10 + 10 + 30 + 2 * SEAM_MM);
  });
});

describe('saia franzida: elástico cabe no canal', () => {
  it('canal pronto é pelo menos 5 mm mais largo que o elástico', () => {
    const m = find('saia-franzida');
    const elastic = Number(/Elástico de ([\d,]+) cm/.exec(m.notions)![1].replace(',', '.'));
    const channel = Number(/depois ([\d,]+) cm para o avesso/.exec(m.steps.map((s) => s.text).join(' '))![1].replace(',', '.'));
    assert.ok(channel - elastic >= 0.5, `canal ${channel} cm, elástico ${elastic} cm`);
  });
});
