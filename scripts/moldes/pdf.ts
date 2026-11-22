/**
 * Renderização dos moldes em PDF (A4 em mosaico e A0 em folha única).
 * Geometria em milímetros com y para baixo; o pdf-lib desenha em pontos com
 * y para cima — `drawSvgPath` com `scale: MM` faz a conversão (linhas e
 * tracejados também ficam em mm).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import fontkit from '@pdf-lib/fontkit';
import {
  clip,
  degrees,
  endPath,
  PDFDocument,
  type PDFFont,
  type PDFPage,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
} from 'pdf-lib';
import {
  arcPoint,
  bbox,
  foldBox,
  metros,
  type PlacedBox,
  shelfPlace,
  yardageMm,
  type Cmd,
  type DirectCut,
  type Molde,
  type Outline,
  type Piece,
  type Variant,
} from './geometria';
import { FABRIC_WIDTH_MM, SEAM_MM, SIZE_DASH } from './medidas';

export const MM = 72 / 25.4;
export const A4 = { w: 210, h: 297, margin: 10, overlap: 10 };
export const A0 = { w: 841, h: 1189, margin: 10 };
export const TEST_SQUARE_PT = 50 * MM;

/** Data fixa: o mesmo molde gera sempre o mesmo arquivo (checksum estável). */
const FIXED_DATE = new Date('2026-11-22T00:00:00Z');

const C = {
  ink: rgb(0.227, 0.18, 0.165),
  wine: rgb(0.478, 0.231, 0.231),
  muted: rgb(0.416, 0.357, 0.329),
  rule: rgb(0.804, 0.749, 0.686),
  grey: rgb(0.6, 0.6, 0.6),
  sand: rgb(0.902, 0.863, 0.808),
};

const DIFFICULTY = 'Iniciante';

type Fonts = { serif: PDFFont; serifBold: PDFFont; italic: PDFFont; sans: PDFFont; sansMedium: PDFFont };

const FONT_DIR = path.join(__dirname, 'fonts');

async function embedFonts(doc: PDFDocument): Promise<Fonts> {
  doc.registerFontkit(fontkit);
  const load = (file: string) => doc.embedFont(readFileSync(path.join(FONT_DIR, file)), { subset: false, features: { liga: false, clig: false, dlig: false, calt: false } });
  return {
    serif: await load('CormorantGaramond-Medium.ttf'),
    serifBold: await load('CormorantGaramond-SemiBold.ttf'),
    italic: await load('CormorantGaramond-MediumItalic.ttf'),
    sans: await load('DMSans-Regular.ttf'),
    sansMedium: await load('DMSans-Medium.ttf'),
  };
}

const n = (v: number) => (Math.round(v * 100) / 100).toString();

export function toSvgPath(cmds: Cmd[]): string {
  const out: string[] = [];
  for (const c of cmds) {
    if (c.op === 'M') out.push(`M ${n(c.x)} ${n(c.y)}`);
    else if (c.op === 'L') out.push(`L ${n(c.x)} ${n(c.y)}`);
    else if (c.op === 'A') {
      const s = arcPoint(c.cx, c.cy, c.r, c.a0);
      const e = arcPoint(c.cx, c.cy, c.r, c.a1);
      const large = Math.abs(c.a1 - c.a0) > 180 ? 1 : 0;
      const sweep = c.a1 > c.a0 ? 1 : 0;
      out.push(`L ${n(s.x)} ${n(s.y)} A ${n(c.r)} ${n(c.r)} 0 ${large} ${sweep} ${n(e.x)} ${n(e.y)}`);
    } else out.push('Z');
  }
  return out.join(' ');
}

// ---------------------------------------------------------------- desenho

type Page = { page: PDFPage; hMm: number };

function drawPath(
  p: Page,
  cmds: Cmd[] | string,
  originMm: { x: number; y: number },
  style: { width: number; dash?: number[]; color?: ReturnType<typeof rgb>; scale?: number },
) {
  const scale = style.scale ?? 1;
  p.page.drawSvgPath(typeof cmds === 'string' ? cmds : toSvgPath(cmds), {
    x: originMm.x * MM,
    y: (p.hMm - originMm.y) * MM,
    scale: MM * scale,
    borderColor: style.color ?? C.ink,
    borderWidth: style.width / scale,
    borderDashArray: style.dash?.map((d) => d / scale),
  });
}

function line(p: Page, x1: number, y1: number, x2: number, y2: number, width = 0.2, color = C.rule, dash?: number[]) {
  drawPath(p, `M ${n(x1)} ${n(y1)} L ${n(x2)} ${n(y2)}`, { x: 0, y: 0 }, { width, color, dash });
}

function rect(p: Page, x: number, y: number, w: number, h: number, width = 0.2, color = C.rule, dash?: number[]) {
  drawPath(p, `M ${n(x)} ${n(y)} H ${n(x + w)} V ${n(y + h)} H ${n(x)} Z`, { x: 0, y: 0 }, { width, color, dash });
}

type TextOpts = {
  font: PDFFont;
  size: number;
  color?: ReturnType<typeof rgb>;
  align?: 'left' | 'center' | 'right';
  rotate?: number;
  opacity?: number;
};

/** Texto com a linha de base em (x, y) mm, y medido do topo. */
function text(p: Page, value: string, x: number, y: number, o: TextOpts) {
  const width = o.font.widthOfTextAtSize(value, o.size) / MM;
  const dx = o.align === 'center' ? -width / 2 : o.align === 'right' ? -width : 0;
  p.page.drawText(value, {
    x: (x + dx) * MM,
    y: (p.hMm - y) * MM,
    size: o.size,
    font: o.font,
    color: o.color ?? C.ink,
    rotate: o.rotate ? degrees(o.rotate) : undefined,
    opacity: o.opacity,
  });
}

function wrap(value: string, font: PDFFont, size: number, maxMm: number): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) / MM > maxMm && current) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

/** Parágrafo; devolve o y da próxima linha. */
function paragraph(p: Page, value: string, x: number, y: number, maxMm: number, o: TextOpts, leading = 1.45): number {
  const step = (o.size * leading) / MM;
  for (const l of wrap(value, o.font, o.size, maxMm)) {
    text(p, l, x, y, o);
    y += step;
  }
  return y;
}

const spaced = (value: string) => value.split('').join(' ');

// ---------------------------------------------------------------- peças posicionadas

type Placed = {
  piece: Piece;
  outlines: Outline[];
  x: number;
  y: number;
  w: number;
  h: number;
  label: { x: number; y: number };
  fold?: { x1: number; y1: number; x2: number; y2: number };
  grainAngle: number;
};

function rotateCmds(cmds: Cmd[]): Cmd[] {
  // gira 90° no sentido horário (no papel): (x, y) → (−y, x)
  return cmds.map((c) => {
    if (c.op === 'Z') return c;
    if (c.op === 'A') return { ...c, cx: -c.cy, cy: c.cx, a0: c.a0 + 90, a1: c.a1 + 90 };
    return { ...c, x: -c.y, y: c.x };
  });
}

function rotateCCW(cmds: Cmd[]): Cmd[] {
  // gira 90° no sentido anti-horário (no papel): (x, y) → (y, −x)
  return cmds.map((c) => {
    if (c.op === 'Z') return c;
    if (c.op === 'A') return { ...c, cx: c.cy, cy: -c.cx, a0: c.a0 - 90, a1: c.a1 - 90 };
    return { ...c, x: c.y, y: -c.x };
  });
}

function shift(cmds: Cmd[], dx: number, dy: number): Cmd[] {
  return cmds.map((c) => {
    if (c.op === 'Z') return c;
    if (c.op === 'A') return { ...c, cx: c.cx + dx, cy: c.cy + dy };
    return { ...c, x: c.x + dx, y: c.y + dy };
  });
}

const SMALL_LABEL_MM = 26;

function isSmall(w: number, h: number) {
  return w < 90 || h < 70;
}

/** Posiciona as peças da variante numa área de largura `maxW` (mm), com rótulos. */
function layoutPieces(variant: Variant, maxW: number): { placed: Placed[]; width: number; height: number } {
  const GAP = 20;
  const prepared = variant.pieces.map((piece) => {
    const all = piece.outlines.flatMap((o) => o.cut);
    const b = bbox(all);
    const w = b.maxX - b.minX;
    const h = b.maxY - b.minY;
    return { piece, b, w, h, extra: isSmall(w, h) ? SMALL_LABEL_MM : 0 };
  });

  const { placed } = shelfPlace(
    prepared.map((p) => ({ item: p, box: { w: p.w, h: p.h + p.extra } })),
    maxW,
    GAP,
  );

  const result: Placed[] = placed.map(({ item, x, y, rotated }) => {
    const { piece, b } = item;
    const transform = (cmds: Cmd[]) => {
      let out = shift(cmds, -b.minX, -b.minY);
      if (rotated) {
        out = rotateCmds(out);
        out = shift(out, item.h, 0);
      }
      return shift(out, x, y);
    };
    const tp = (px: number, py: number) => {
      const c = transform([{ op: 'M', x: px, y: py }])[0] as { x: number; y: number };
      return { x: c.x, y: c.y };
    };

    const outlines = piece.outlines.map((o) => ({ ...o, seam: transform(o.seam), cut: transform(o.cut) }));
    const w = rotated ? item.h : item.w;
    const h = rotated ? item.w : item.h;

    let fold: Placed['fold'];
    if (piece.onFold) {
      // a dobra é a borda y = 0 da cunha, entre o menor raio interno e o maior externo
      const starts = piece.outlines.map((o) => o.cut[0] as { x: number });
      const ends = piece.outlines.map((o) => o.cut[1] as { x: number });
      const a = tp(Math.min(...starts.map((s) => s.x)), 0);
      const e = tp(Math.max(...ends.map((s) => s.x)), 0);
      fold = { x1: a.x, y1: a.y, x2: e.x, y2: e.y };
    }

    const label = item.extra
      ? { x: x + w / 2, y: y + h + 7 }
      : (() => {
          const c = tp((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2);
          return { x: c.x, y: c.y };
        })();

    const baseGrain = piece.grain === 'horizontal' ? 0 : 90;
    return { piece, outlines, x, y, w, h, label, fold, grainAngle: rotated ? baseGrain + 90 : baseGrain };
  });

  const width = Math.max(...result.map((r) => r.x + r.w));
  const height = Math.max(...result.map((r) => r.y + r.h + (isSmall(r.w, r.h) ? SMALL_LABEL_MM : 0)));
  return { placed: result, width, height };
}

/** Desenha as peças posicionadas com origem (ox, oy) em mm na página. */
function drawPlaced(p: Page, placed: Placed[], ox: number, oy: number, m: Molde, f: Fonts, scale = 1) {
  for (const pl of placed) {
    const multi = pl.outlines.length > 1;
    for (const o of pl.outlines) {
      if (!multi) drawPath(p, o.seam, { x: ox, y: oy }, { width: 0.2, color: C.grey, dash: [1, 1], scale });
      drawPath(p, o.cut, { x: ox, y: oy }, { width: 0.35, dash: o.dash.length ? o.dash : undefined, scale });
    }
    if (scale !== 1) continue;

    const lx = ox + pl.label.x;
    const ly = oy + pl.label.y;
    text(p, pl.piece.name, lx, ly, { font: f.serifBold, size: 14, align: 'center' });
    text(p, pl.piece.cut, lx, ly + 5, { font: f.sans, size: 8, align: 'center', color: C.muted });
    text(p, `FioForma · Modelo nº ${m.number}`, lx, ly + 9, { font: f.sans, size: 7, align: 'center', color: C.muted });

    // fio do tecido: seta de 60 mm (20 mm em peças pequenas)
    const len = isSmall(pl.w, pl.h) ? 0 : 60;
    if (len) {
      const rad = (pl.grainAngle * Math.PI) / 180;
      const cx = lx;
      const cy = ly + 18;
      const dx = (Math.cos(rad) * len) / 2;
      const dy = (Math.sin(rad) * len) / 2;
      line(p, cx - dx, cy - dy, cx + dx, cy + dy, 0.3, C.ink);
      for (const sign of [1, -1]) {
        const tipX = cx + sign * dx;
        const tipY = cy + sign * dy;
        for (const side of [1, -1]) {
          const a = rad + (sign === 1 ? Math.PI : 0) + side * 0.4;
          line(p, tipX, tipY, tipX + Math.cos(a) * 4, tipY + Math.sin(a) * 4, 0.3, C.ink);
        }
      }
      text(p, 'FIO', cx, cy - 2, { font: f.sans, size: 6, align: 'center', color: C.muted });
    }

    if (pl.fold) {
      const fx1 = ox + pl.fold.x1;
      const fy1 = oy + pl.fold.y1;
      const fx2 = ox + pl.fold.x2;
      const fy2 = oy + pl.fold.y2;
      line(p, fx1, fy1, fx2, fy2, 0.8, C.wine);
      const angle = Math.atan2(fy2 - fy1, fx2 - fx1);
      // texto do lado de dentro da peça (para o lado do rótulo)
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);
      const towardLabel = (lx - fx1) * nx + (ly - fy1) * ny > 0 ? 1 : -1;
      const steps = Math.max(1, Math.floor(Math.hypot(fx2 - fx1, fy2 - fy1) / 150));
      for (let i = 0; i < steps; i += 1) {
        const t = (i + 0.5) / steps;
        const tx = fx1 + (fx2 - fx1) * t + nx * towardLabel * 5;
        const ty = fy1 + (fy2 - fy1) * t + ny * towardLabel * 5;
        text(p, 'DOBRA DO TECIDO', tx, ty, {
          font: f.sansMedium,
          size: 8,
          align: 'center',
          color: C.wine,
          rotate: -(angle * 180) / Math.PI,
        });
      }
    }
  }
}

/** Legenda de traços por tamanho. Devolve o y final. */
function legend(p: Page, m: Molde, x: number, y: number, f: Fonts): number {
  if (m.sizes.length < 2) return y;
  text(p, 'TAMANHOS', x, y, { font: f.sansMedium, size: 7, color: C.wine });
  let cx = x;
  const ly = y + 6;
  for (const size of m.sizes) {
    const dash = SIZE_DASH[size] ?? [];
    drawPath(p, `M ${n(cx)} ${n(ly - 1)} L ${n(cx + 14)} ${n(ly - 1)}`, { x: 0, y: 0 }, { width: 0.4, dash: dash.length ? dash : undefined });
    text(p, size, cx + 16, ly, { font: f.sans, size: 8 });
    cx += 30;
  }
  return ly + 6;
}

// ---------------------------------------------------------------- páginas fixas

function title(m: Molde, variant: Variant) {
  return `FioForma — Modelo nº ${m.number} · ${m.name}${m.variants.length > 1 ? ` (${variant.label})` : ''}`;
}

function pageHeader(p: Page, m: Molde, variant: Variant, heading: string, f: Fonts): number {
  text(p, spaced('FIOFORMA'), 20, 20, { font: f.sansMedium, size: 8, color: C.wine });
  text(p, `Modelo nº ${m.number} · ${m.name}${m.variants.length > 1 ? ` · ${variant.label}` : ''}`, 190, 20, {
    font: f.sans,
    size: 8,
    color: C.muted,
    align: 'right',
  });
  line(p, 20, 23, 190, 23, 0.3, C.rule);
  text(p, heading, 20, 40, { font: f.serifBold, size: 26 });
  return 52;
}

function cover(p: Page, m: Molde, variant: Variant, f: Fonts) {
  rect(p, 12, 12, 186, 273, 0.8, C.wine);
  rect(p, 15, 15, 180, 267, 0.3, C.wine);
  text(p, spaced('FIOFORMA'), 105, 34, { font: f.sansMedium, size: 11, color: C.ink, align: 'center' });
  line(p, 60, 40, 150, 40, 0.3, C.rule);
  text(p, `MODELO Nº ${m.number}`, 105, 50, { font: f.sansMedium, size: 10, color: C.wine, align: 'center' });
  text(p, m.name, 105, 72, { font: f.serifBold, size: 40, align: 'center' });
  if (m.variants.length > 1) text(p, variant.label, 105, 84, { font: f.italic, size: 20, color: C.wine, align: 'center' });

  // desenho técnico (coordenadas 0–100 × 0–125) em 90 × 112,5 mm
  const s = 0.9;
  drawPath(p, m.flat, { x: 105 - 45, y: 96 }, { width: 0.5, scale: s, color: C.ink });

  const sizes = m.sizes.length > 1 ? `Tamanhos ${m.sizes.join(' · ')}` : `Tamanho ${m.sizes[0].toLowerCase()}`;
  text(p, sizes, 105, 226, { font: f.sansMedium, size: 10, align: 'center' });
  text(p, `Nível ${DIFFICULTY.toLowerCase()} · margem de costura de 1 cm inclusa`, 105, 233, {
    font: f.sans,
    size: 9,
    color: C.muted,
    align: 'center',
  });
  line(p, 40, 245, 170, 245, 0.3, C.rule);
  text(p, 'Molde de costura em PDF · imprima sempre em tamanho real (100%)', 105, 254, {
    font: f.italic,
    size: 13,
    align: 'center',
  });
  paragraph(
    p,
    'Uso pessoal e venda das peças que você costurar. É proibido compartilhar, revender ou redistribuir este arquivo.',
    40,
    266,
    130,
    { font: f.sans, size: 7.5, color: C.muted },
  );
}

function sheet(p: Page, m: Molde, variant: Variant, f: Fonts, fileSummary: string) {
  let y = pageHeader(p, m, variant, 'Ficha técnica', f);
  const row = (label: string, value: string | string[]) => {
    text(p, label.toUpperCase(), 20, y, { font: f.sansMedium, size: 7.5, color: C.wine });
    let yy = y;
    for (const v of Array.isArray(value) ? value : [value]) {
      yy = paragraph(p, v, 70, yy, 120, { font: f.sans, size: 9.5 });
    }
    y = Math.max(y + 6, yy) + 3;
    line(p, 20, y - 3, 190, y - 3, 0.2, C.rule);
    y += 3;
  };

  row('Tamanhos', m.sizes.join(' · '));
  row('Nível', DIFFICULTY);
  row('Tecido', m.fabric);
  row(
    'Metragem',
    [
      ...m.sizes.map((size) => `${size}: ${metros(yardageMm(variant.pieces, variant.directCuts, size, FABRIC_WIDTH_MM))}`),
      `Tecido de 1,50 m de largura, ${m.yardageNote}. Valores com folga para encaixe.`,
    ],
  );
  row('Aviamentos', m.notions);
  row('Margem de costura', '1 cm inclusa em todas as bordas, inclusive na barra. Na dobra do tecido não há margem.');
  row('Neste arquivo', fileSummary);
}

function chartPage(p: Page, m: Molde, variant: Variant, f: Fonts) {
  let y = pageHeader(p, m, variant, m.chart.title, f);
  const rows = m.chart.rows;
  const cols: { label: string; get: (r: (typeof rows)[number]) => string }[] = [{ label: 'Tamanho', get: (r) => r.size }];
  if (rows.some((r) => r.bustCm)) cols.push({ label: 'Busto', get: (r) => (r.bustCm ? `${r.bustCm} cm` : '—') });
  if (rows.some((r) => r.waistCm)) cols.push({ label: 'Cintura', get: (r) => (r.waistCm ? `${r.waistCm} cm` : '—') });
  if (rows.some((r) => r.hipCm)) cols.push({ label: 'Quadril', get: (r) => (r.hipCm ? `${r.hipCm} cm` : '—') });
  const extras = Array.from(new Set(rows.flatMap((r) => (r.extra ?? []).map((e) => e.label))));
  for (const label of extras) cols.push({ label, get: (r) => r.extra?.find((e) => e.label === label)?.value ?? '—' });

  const colW = 170 / cols.length;
  cols.forEach((c, i) => text(p, c.label.toUpperCase(), 20 + i * colW, y, { font: f.sansMedium, size: 7.5, color: C.wine }));
  y += 3;
  line(p, 20, y, 190, y, 0.4, C.ink);
  y += 7;
  for (const r of rows) {
    cols.forEach((c, i) =>
      text(p, c.get(r), 20 + i * colW, y, { font: i === 0 ? f.serifBold : f.sans, size: i === 0 ? 13 : 10 }),
    );
    y += 3;
    line(p, 20, y, 190, y, 0.2, C.rule);
    y += 7;
  }
  y += 4;
  y = paragraph(p, m.chart.notes, 20, y, 170, { font: f.italic, size: 12 });
  if (rows.some((r) => r.waistCm || r.hipCm || r.bustCm)) {
    y += 6;
    text(p, 'COMO MEDIR', 20, y, { font: f.sansMedium, size: 7.5, color: C.wine });
    y += 6;
    paragraph(
      p,
      'Meça o corpo, sem roupa por cima, com a fita justa mas sem apertar. Cintura: na parte mais fina do tronco. Quadril: na parte mais larga, uns 20 cm abaixo da cintura. Na dúvida entre dois tamanhos, escolha o maior.',
      20,
      y,
      170,
      { font: f.sans, size: 9.5 },
    );
  }
}

function cutLabel(d: DirectCut, size: string) {
  const dims = d.bySize?.[size] ?? d;
  return `${(dims.widthMm / 10).toLocaleString('pt-BR')} × ${(dims.heightMm / 10).toLocaleString('pt-BR')} cm`;
}

function cuttingPage(p: Page, m: Molde, variant: Variant, f: Fonts) {
  let y = pageHeader(p, m, variant, 'Plano de corte', f);
  const size = m.sizes[m.sizes.length - 1];

  type Item = { name: string; w: number; h: number; cmds?: Cmd[] };
  const open: { item: Item; box: { w: number; h: number } }[] = [];
  // peças na dobra: giradas com a borda reta na vertical, uma embaixo da outra
  const foldedPlaced: PlacedBox<Item>[] = [];
  let foldedH = 0;
  for (const piece of variant.pieces) {
    const outlines = piece.outlines.filter((o) => o.size === size);
    const src = (outlines.length ? outlines : piece.outlines).slice(-1);
    if (piece.onFold) {
      const turned = rotateCCW(src[0].cut);
      const b = bbox(turned);
      const cmds = shift(turned, -b.minX, -b.minY);
      const box = foldBox(src[0].cut);
      for (let i = 0; i < piece.count; i += 1) {
        foldedPlaced.push({ item: { name: piece.name, w: box.w, h: box.h, cmds }, x: 0, y: foldedH, w: box.w, h: box.h, rotated: false });
        foldedH += box.h;
      }
      continue;
    }
    const b = bbox(src.flatMap((o) => o.cut));
    const cmds = shift(src[0].cut, -b.minX, -b.minY);
    for (let i = 0; i < piece.count; i += 1) {
      open.push({ item: { name: piece.name, w: b.maxX - b.minX, h: b.maxY - b.minY, cmds }, box: { w: b.maxX - b.minX, h: b.maxY - b.minY } });
    }
  }
  for (const d of variant.directCuts) {
    const dims = d.bySize?.[size] ?? d;
    for (let i = 0; i < d.count; i += 1) open.push({ item: { name: d.name, w: dims.widthMm, h: dims.heightMm }, box: { w: dims.widthMm, h: dims.heightMm } });
  }

  const openResult = open.length ? shelfPlace(open, FABRIC_WIDTH_MM) : null;
  const results = [
    ...(foldedPlaced.length
      ? [{ lane: FABRIC_WIDTH_MM / 2, label: 'Tecido dobrado ao meio no comprimento (dobra à esquerda)', placed: foldedPlaced, height: foldedH }]
      : []),
    ...(openResult ? [{ lane: FABRIC_WIDTH_MM, label: 'Tecido aberto, 1,50 m de largura', ...openResult }] : []),
  ];
  const totalH = results.reduce((s, r) => s + r.height, 0);
  // escala para caber em 170 × 150 mm
  const k = Math.min(170 / FABRIC_WIDTH_MM, 150 / Math.max(totalH, 1), 0.12);

  for (const r of results) {
    text(p, r.label, 20, y, { font: f.sans, size: 8.5, color: C.muted });
    y += 3;
    const w = r.lane * k;
    const h = r.height * k;
    rect(p, 20, y, w, h, 0.3, C.ink);
    if (r.lane === FABRIC_WIDTH_MM / 2) line(p, 20, y, 20, y + h, 1, C.wine);
    for (const pl of r.placed) {
      const x0 = 20 + pl.x * k;
      const y0 = y + pl.y * k;
      if (pl.item.cmds && !pl.rotated) {
        drawPath(p, pl.item.cmds, { x: x0, y: y0 }, { width: 0.3, scale: k });
      } else if (pl.item.cmds && pl.rotated) {
        const rot = shift(rotateCmds(pl.item.cmds), pl.item.h, 0);
        drawPath(p, rot, { x: x0, y: y0 }, { width: 0.3, scale: k });
      } else {
        rect(p, x0, y0, pl.w * k, pl.h * k, 0.3, C.ink);
      }
      text(p, pl.item.name, x0 + (pl.w * k) / 2, y0 + (pl.h * k) / 2 + 1, { font: f.sans, size: 6, align: 'center' });
    }
    y += h + 9;
  }
  text(p, `Plano desenhado para o tamanho ${size}. Nos outros tamanhos as peças ficam menores.`, 20, y, {
    font: f.italic,
    size: 11,
  });
  y += 10;

  text(p, 'PEÇAS', 20, y, { font: f.sansMedium, size: 7.5, color: C.wine });
  y += 6;
  for (const piece of variant.pieces) {
    text(p, piece.name, 20, y, { font: f.serifBold, size: 12 });
    text(p, `${piece.cut} · molde em tamanho real nas folhas`, 70, y, { font: f.sans, size: 9 });
    y += 7;
  }
  for (const d of variant.directCuts) {
    text(p, d.name, 20, y, { font: f.serifBold, size: 12 });
    const dims = d.bySize ? m.sizes.map((s) => `${s} ${cutLabel(d, s)}`).join(' · ') : cutLabel(d, size);
    y = paragraph(p, `${d.cut} · ${dims}`, 70, y, 120, { font: f.sans, size: 9 });
    if (d.note) y = paragraph(p, d.note, 70, y, 120, { font: f.sans, size: 8, color: C.muted });
    y += 3;
  }
  if (variant.directCuts.length) {
    paragraph(
      p,
      'Peças retangulares são cortadas direto pelas medidas, que já incluem 1 cm de margem: marque no avesso do tecido com régua e giz.',
      20,
      y + 2,
      170,
      { font: f.italic, size: 11 },
    );
  }
}

function stepsPages(doc: PDFDocument, m: Molde, variant: Variant, f: Fonts) {
  let p = addPage(doc, A4);
  let y = pageHeader(p, m, variant, 'Passo a passo', f);
  m.steps.forEach((step, i) => {
    const needed = 8 + wrap(step.text, f.sans, 10, 150).length * 5.2;
    if (y + needed > 280) {
      p = addPage(doc, A4);
      y = pageHeader(p, m, variant, 'Passo a passo (continuação)', f);
    }
    text(p, String(i + 1).padStart(2, '0'), 20, y + 1, { font: f.serifBold, size: 22, color: C.wine });
    text(p, step.title, 38, y, { font: f.serifBold, size: 14 });
    y = paragraph(p, step.text, 38, y + 6, 150, { font: f.sans, size: 10 });
    line(p, 38, y - 1, 190, y - 1, 0.2, C.rule);
    y += 9;
  });
}

function letters(i: number) {
  return String.fromCharCode(65 + i);
}

function testPage(
  p: Page,
  m: Molde,
  variant: Variant,
  f: Fonts,
  tiles: { col: number; row: number }[],
  grid: { cols: number; rows: number },
  layout: { placed: Placed[] } | null,
) {
  let y = pageHeader(p, m, variant, 'Teste de impressão', f);
  // quadrado de 5 cm
  rect(p, 20, y, 50, 50, 0.4, C.ink);
  text(p, '5 cm', 45, y + 27, { font: f.serifBold, size: 16, align: 'center' });
  // régua de 10 cm
  const ry = y + 62;
  line(p, 20, ry, 120, ry, 0.4, C.ink);
  for (let i = 0; i <= 100; i += 5) {
    line(p, 20 + i, ry, 20 + i, ry - (i % 10 === 0 ? 4 : 2), 0.3, C.ink);
    if (i % 10 === 0) text(p, String(i / 10), 20 + i, ry + 4, { font: f.sans, size: 6.5, align: 'center' });
  }
  text(p, 'cm', 124, ry + 1, { font: f.sans, size: 7 });

  paragraph(
    p,
    'Imprima em "Tamanho real" ou escala 100% — nunca em "Ajustar à página". Meça o quadrado: ele precisa ter exatamente 5 cm de cada lado. Se não tiver, ajuste a impressora antes de imprimir as folhas do molde.',
    80,
    y + 4,
    110,
    { font: f.sans, size: 9.5 },
  );

  y = ry + 16;
  if (!tiles.length || !layout) {
    paragraph(p, 'Este molde não tem folhas para montar: as peças são cortadas direto pelas medidas da ficha.', 20, y, 170, {
      font: f.italic,
      size: 12,
    });
    return;
  }

  text(p, 'MONTAGEM DAS FOLHAS', 20, y, { font: f.sansMedium, size: 7.5, color: C.wine });
  y = paragraph(
    p,
    `São ${tiles.length} folhas. Cada folha tem um nome (A1, A2, B1…): a letra é a coluna e o número é a linha. Corte a margem branca da esquerda e de cima de cada folha e apoie a folha sobre a vizinha, encostando a borda na linha tracejada a 1 cm da beirada. Confira se os traços continuam e cole com fita.`,
    20,
    y + 6,
    170,
    { font: f.sans, size: 9.5 },
  );

  // mapa
  const stepW = A4.w - 2 * A4.margin - A4.overlap;
  const stepH = A4.h - 2 * A4.margin - A4.overlap;
  const totalW = grid.cols * stepW + A4.overlap;
  const totalH = grid.rows * stepH + A4.overlap;
  const k = Math.min(170 / totalW, (270 - y - 20) / totalH);
  const mx = 20 + (170 - totalW * k) / 2;
  const my = y + 6;
  drawPlaced(p, layout.placed, mx, my, m, f, k);
  for (let c = 0; c < grid.cols; c += 1) {
    for (let r = 0; r < grid.rows; r += 1) {
      const present = tiles.some((t) => t.col === c && t.row === r);
      const x = mx + c * stepW * k;
      const yy = my + r * stepH * k;
      rect(p, x, yy, (stepW + A4.overlap) * k, (stepH + A4.overlap) * k, present ? 0.4 : 0.2, present ? C.wine : C.rule, present ? undefined : [1, 1]);
      if (present) text(p, `${letters(c)}${r + 1}`, x + 2, yy + 5, { font: f.sansMedium, size: 7, color: C.wine });
    }
  }
  legend(p, m, 20, my + totalH * k + 8, f);
}

// ---------------------------------------------------------------- mosaico

function densify(cmds: Cmd[], step = 3): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  let last: { x: number; y: number } | null = null;
  for (const c of cmds) {
    if (c.op === 'M') last = { x: c.x, y: c.y };
    else if (c.op === 'L' && last) {
      const len = Math.hypot(c.x - last.x, c.y - last.y);
      const k = Math.max(1, Math.ceil(len / step));
      for (let i = 0; i <= k; i += 1) pts.push({ x: last.x + ((c.x - last.x) * i) / k, y: last.y + ((c.y - last.y) * i) / k });
      last = { x: c.x, y: c.y };
    } else if (c.op === 'A') {
      const len = (c.r * Math.abs(c.a1 - c.a0) * Math.PI) / 180;
      const k = Math.max(2, Math.ceil(len / step));
      for (let i = 0; i <= k; i += 1) pts.push(arcPoint(c.cx, c.cy, c.r, c.a0 + ((c.a1 - c.a0) * i) / k));
      last = arcPoint(c.cx, c.cy, c.r, c.a1);
    }
  }
  return pts;
}

function addPage(doc: PDFDocument, size: { w: number; h: number }): Page {
  const page = doc.addPage([size.w * MM, size.h * MM]);
  return { page, hMm: size.h };
}

function clipTo(p: Page, x: number, y: number, w: number, h: number) {
  p.page.pushOperators(pushGraphicsState(), rectangle(x * MM, (p.hMm - y - h) * MM, w * MM, h * MM), clip(), endPath());
}

function unclip(p: Page) {
  p.page.pushOperators(popGraphicsState());
}

function computeTiles(layout: { placed: Placed[]; width: number; height: number }) {
  const pw = A4.w - 2 * A4.margin;
  const ph = A4.h - 2 * A4.margin;
  const stepW = pw - A4.overlap;
  const stepH = ph - A4.overlap;
  const cols = Math.max(1, Math.ceil((layout.width - A4.overlap) / stepW));
  const rows = Math.max(1, Math.ceil((layout.height - A4.overlap) / stepH));
  const pts = [
    ...layout.placed.flatMap((pl) => pl.outlines.flatMap((o) => densify(o.cut))),
    ...layout.placed.map((pl) => pl.label),
  ];
  const tiles: { col: number; row: number }[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x0 = c * stepW;
      const y0 = r * stepH;
      if (pts.some((pt) => pt.x >= x0 && pt.x <= x0 + pw && pt.y >= y0 && pt.y <= y0 + ph)) tiles.push({ col: c, row: r });
    }
  }
  return { tiles, cols, rows, stepW, stepH, pw, ph };
}

// ---------------------------------------------------------------- API

function variantOf(m: Molde, variantId: string): Variant {
  const v = m.variants.find((x) => x.id === variantId);
  if (!v) throw new Error(`Variante ${variantId} não existe em ${m.slug}`);
  return v;
}

async function newDoc(m: Molde, variant: Variant) {
  const doc = await PDFDocument.create();
  doc.setTitle(title(m, variant), { showInWindowTitleBar: true });
  doc.setAuthor('FioForma');
  doc.setSubject('Molde de costura em PDF');
  doc.setCreator('FioForma');
  doc.setProducer('FioForma');
  doc.setLanguage('pt-BR');
  doc.setCreationDate(FIXED_DATE);
  doc.setModificationDate(FIXED_DATE);
  return { doc, fonts: await embedFonts(doc) };
}

/** Variantes que ganham PDF A0: têm peça que não cabe numa folha A4. */
export function A0_FORMAT_VARIANTS(m: Molde): string[] {
  const pw = A4.w - 2 * A4.margin;
  const ph = A4.h - 2 * A4.margin;
  return m.variants
    .filter((v) =>
      v.pieces.some((piece) => {
        const b = bbox(piece.outlines.flatMap((o) => o.cut));
        const w = b.maxX - b.minX;
        const h = b.maxY - b.minY;
        return !((w <= pw && h <= ph) || (h <= pw && w <= ph));
      }),
    )
    .map((v) => v.id);
}

const LAYOUT_WIDTH = A0.w - 2 * A0.margin;

export async function renderA4(
  m: Molde,
  variantId: string,
): Promise<{ bytes: Uint8Array; pages: number; tiles: { col: number; row: number }[] }> {
  const variant = variantOf(m, variantId);
  const { doc, fonts: f } = await newDoc(m, variant);

  const layout = variant.pieces.length ? layoutPieces(variant, LAYOUT_WIDTH) : null;
  const t = layout ? computeTiles(layout) : null;
  const tiles = t?.tiles ?? [];
  const fixedPages = 5 + Math.ceil(m.steps.length / 7);
  const summary = tiles.length
    ? `${fixedPages + tiles.length} páginas A4: capa, ficha, medidas, plano de corte, passo a passo, teste de impressão e ${tiles.length} folhas do molde.`
    : `${fixedPages} páginas A4: capa, ficha, medidas, plano de corte com as medidas de cada peça, passo a passo e teste de impressão.`;

  cover(addPage(doc, A4), m, variant, f);
  sheet(addPage(doc, A4), m, variant, f, summary);
  chartPage(addPage(doc, A4), m, variant, f);
  cuttingPage(addPage(doc, A4), m, variant, f);
  stepsPages(doc, m, variant, f);
  testPage(addPage(doc, A4), m, variant, f, tiles, { cols: t?.cols ?? 0, rows: t?.rows ?? 0 }, layout);

  if (layout && t) {
    for (const tile of tiles) {
      const p = addPage(doc, A4);
      const name = `${letters(tile.col)}${tile.row + 1}`;
      const ox = A4.margin - tile.col * t.stepW;
      const oy = A4.margin - tile.row * t.stepH;
      // nome grande e claro ao fundo, para montar
      text(p, name, A4.w / 2, A4.h / 2 + 15, { font: f.serifBold, size: 120, align: 'center', color: C.sand, opacity: 0.6 });
      clipTo(p, A4.margin, A4.margin, t.pw, t.ph);
      drawPlaced(p, layout.placed, ox, oy, m, f);
      unclip(p);
      rect(p, A4.margin, A4.margin, t.pw, t.ph, 0.2, C.rule);
      // faixa de sobreposição (1 cm à direita e embaixo)
      line(p, A4.margin + t.pw - A4.overlap, A4.margin, A4.margin + t.pw - A4.overlap, A4.margin + t.ph, 0.3, C.wine, [2, 1.5]);
      line(p, A4.margin, A4.margin + t.ph - A4.overlap, A4.margin + t.pw, A4.margin + t.ph - A4.overlap, 0.3, C.wine, [2, 1.5]);
      const right = tiles.some((x) => x.col === tile.col + 1 && x.row === tile.row) ? `${letters(tile.col + 1)}${tile.row + 1} à direita` : '';
      const below = tiles.some((x) => x.col === tile.col && x.row === tile.row + 1) ? `${name[0]}${tile.row + 2} embaixo` : '';
      const joins = [right, below].filter(Boolean).join(' · ');
      text(p, `${name}  ·  Modelo nº ${m.number} · ${m.shortName}${m.variants.length > 1 ? ` (${variant.label})` : ''}`, A4.margin, 7, {
        font: f.sansMedium,
        size: 7,
        color: C.wine,
      });
      if (joins) text(p, `Une com ${joins}`, A4.w - A4.margin, 7, { font: f.sans, size: 7, color: C.muted, align: 'right' });
      text(p, 'Imprima em tamanho real (100%) · FioForma', A4.w / 2, A4.h - 4, { font: f.sans, size: 6.5, color: C.muted, align: 'center' });
    }
  }

  const bytes = await doc.save({ useObjectStreams: true });
  return { bytes, pages: doc.getPageCount(), tiles };
}

export async function renderA0(m: Molde, variantId: string): Promise<{ bytes: Uint8Array; pages: number }> {
  const variant = variantOf(m, variantId);
  if (!variant.pieces.length) throw new Error(`${m.slug}/${variantId} não tem peças para A0.`);
  const { doc, fonts: f } = await newDoc(m, variant);
  const p = addPage(doc, A0);
  const layout = layoutPieces(variant, LAYOUT_WIDTH);
  const top = 80;
  if (layout.height + top > A0.h - A0.margin) throw new Error(`${m.slug}/${variantId}: peças não cabem no A0.`);

  text(p, spaced('FIOFORMA'), A0.margin + 10, 22, { font: f.sansMedium, size: 14, color: C.wine });
  text(p, `Modelo nº ${m.number} · ${m.name}${m.variants.length > 1 ? ` — ${variant.label}` : ''}`, A0.margin + 10, 38, {
    font: f.serifBold,
    size: 40,
  });
  text(p, 'Imprima em tamanho real (100%). Margem de costura de 1 cm inclusa.', A0.margin + 10, 48, {
    font: f.sans,
    size: 14,
    color: C.muted,
  });
  legend(p, m, A0.margin + 10, 58, f);
  rect(p, A0.w - A0.margin - 60, 15, 50, 50, 0.5, C.ink);
  text(p, '5 cm', A0.w - A0.margin - 35, 43, { font: f.serifBold, size: 18, align: 'center' });

  drawPlaced(p, layout.placed, A0.margin, top, m, f);
  const bytes = await doc.save({ useObjectStreams: true });
  return { bytes, pages: doc.getPageCount() };
}

export const _internal = { layoutPieces, SEAM_MM };
