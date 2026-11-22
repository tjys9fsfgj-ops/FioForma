import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bbox, yardageMm, type Cmd, type Piece } from '../geometria';
import { BODY, SEAM_MM } from '../medidas';
import { moldes } from '../moldes/index';

const saiaGode = moldes.find((m) => m.slug === 'saia-gode')!;
const saiaFranzida = moldes.find((m) => m.slug === 'saia-franzida')!;
const bolsaTote = moldes.find((m) => m.slug === 'bolsa-tote')!;

/** Comprimento do menor arco (cintura) de uma linha de costura. */
function innerArcLength(cmds: Cmd[]): number {
  const arcs = cmds.filter((c): c is Extract<Cmd, { op: 'A' }> => c.op === 'A');
  const inner = arcs.reduce((a, b) => (a.r < b.r ? a : b));
  return inner.r * Math.abs(inner.a1 - inner.a0) * (Math.PI / 180);
}

function outline(piece: Piece, label: string) {
  const found = piece.outlines.find((o) => o.label === label);
  assert.ok(found, `contorno ${label} não encontrado`);
  return found;
}

describe('saia godê', () => {
  it('godê inteiro: 4 cunhas na dobra fecham a cintura + 1 cm de folga', () => {
    const piece = saiaGode.variants.find((v) => v.id === 'inteira')!.pieces[0];
    assert.equal(piece.onFold, true);
    assert.equal(piece.count, 4);
    // cada cunha desenhada é metade da peça aberta: 4 peças × 2 metades
    const arc = innerArcLength(outline(piece, 'PP · 50 cm').seam);
    assert.ok(Math.abs(arc * 2 * 4 - (BODY.PP.waist * 10 + 10)) < 1, `arco ${arc}`);
  });

  it('meio-godê: 2 cunhas na dobra fecham a cintura + 1 cm de folga', () => {
    const piece = saiaGode.variants.find((v) => v.id === 'meia')!.pieces[0];
    assert.equal(piece.onFold, true);
    assert.equal(piece.count, 2);
    const arc = innerArcLength(outline(piece, 'GG · 70 cm').seam);
    assert.ok(Math.abs(arc * 2 * 2 - (BODY.GG.waist * 10 + 10)) < 1, `arco ${arc}`);
  });

  it('todas as peças cabem numa folha A0 com 1 cm de margem', () => {
    for (const variant of saiaGode.variants) {
      for (const piece of variant.pieces) {
        const b = bbox(piece.outlines.flatMap((o) => o.cut));
        const w = b.maxX - b.minX;
        const h = b.maxY - b.minY;
        const fits = (w <= 821 && h <= 1169) || (h <= 821 && w <= 1169);
        assert.ok(fits, `${variant.id}/${piece.id}: ${w.toFixed(0)}×${h.toFixed(0)} mm`);
      }
    }
  });

  it('a linha de corte fica 1 cm fora da costura na barra', () => {
    const piece = saiaGode.variants.find((v) => v.id === 'inteira')!.pieces[0];
    const o = outline(piece, 'M · 60 cm');
    const maxR = (cmds: Cmd[]) => Math.max(...cmds.filter((c) => c.op === 'A').map((c) => (c as { r: number }).r));
    assert.ok(Math.abs(maxR(o.cut) - maxR(o.seam) - SEAM_MM) < 0.01);
  });
});

describe('peças retangulares', () => {
  it('bolsa tote: corpo com 40 cm + margens', () => {
    const corpo = bolsaTote.variants[0].directCuts.find((d) => d.name === 'Corpo')!;
    assert.equal(corpo.widthMm, 400 + 2 * SEAM_MM);
  });

  it('saia franzida: cada retângulo tem metade de 1,5× o quadril + 2 cm', () => {
    const painel = saiaFranzida.variants[0].directCuts[0];
    assert.equal(painel.bySize?.M?.widthMm, Math.round((BODY.M.hip * 10 * 1.5) / 2) + 2 * SEAM_MM);
  });
});

describe('metragem', () => {
  it('dois retângulos lado a lado ocupam uma fileira', () => {
    const cuts = [
      { name: 'a', cut: '1×', count: 1, widthMm: 700, heightMm: 500 },
      { name: 'b', cut: '1×', count: 1, widthMm: 700, heightMm: 500 },
    ];
    assert.equal(yardageMm([], cuts, 'U', 1500), 500);
  });

  it('a quantidade de corte gera novas fileiras e arredonda para 5 cm', () => {
    const cuts = [
      { name: 'a', cut: '2×', count: 2, widthMm: 700, heightMm: 480 },
      { name: 'b', cut: '1×', count: 1, widthMm: 700, heightMm: 480 },
    ];
    assert.equal(yardageMm([], cuts, 'U', 1500), 1000);
  });
});

describe('peças na dobra', () => {
  it('ficam uma embaixo da outra, com a borda reta encostada na dobra', () => {
    // borda da dobra = borda de cima (y = 0), com 300 mm; a peça avança 200 mm para dentro
    const rect: Cmd[] = [
      { op: 'M', x: 0, y: 0 },
      { op: 'L', x: 300, y: 0 },
      { op: 'L', x: 300, y: 200 },
      { op: 'L', x: 0, y: 200 },
      { op: 'Z' },
    ];
    const piece: Piece = {
      id: 'p',
      name: 'p',
      cut: '2× na dobra',
      count: 2,
      onFold: true,
      grain: 'horizontal',
      outlines: [{ label: 'U', size: 'U', seam: rect, cut: rect, dash: [] }],
    };
    assert.equal(yardageMm([piece], [], 'U', 1500), 600);
  });
});

describe('catálogo de moldes', () => {
  it('tem os 5 moldes na ordem dos números', () => {
    assert.deepEqual(
      moldes.map((m) => [m.number, m.slug, m.priceCents]),
      [
        ['001', 'saia-gode', 0],
        ['002', 'saia-franzida', 900],
        ['003', 'avental-retro', 900],
        ['004', 'bolsa-tote', 700],
        ['005', 'necessaire-box', 700],
      ],
    );
  });

  it('todo molde tem passos e tabela', () => {
    for (const m of moldes) {
      assert.ok(m.steps.length >= 5, `${m.slug} passos`);
      assert.ok(m.chart.rows.length >= 1, `${m.slug} tabela`);
    }
  });
});
