/**
 * Geometria dos moldes. Tudo em milímetros, eixo y para baixo
 * (como no papel e no SVG). Ângulos em graus.
 */

export type Cmd =
  | { op: 'M' | 'L'; x: number; y: number }
  | { op: 'A'; cx: number; cy: number; r: number; a0: number; a1: number }
  | { op: 'Z' };

/** Um contorno por tamanho (e comprimento): linha de costura e linha de corte. */
export type Outline = { label: string; size: string; seam: Cmd[]; cut: Cmd[]; dash: number[] };

export type Piece = {
  id: string;
  name: string;
  /** Texto da instrução de corte, ex.: "Corte 4× na dobra". */
  cut: string;
  count: number;
  onFold: boolean;
  grain: 'vertical' | 'horizontal';
  outlines: Outline[];
};

export type Dims = { widthMm: number; heightMm: number };

/** Peça retangular cortada direto pelas medidas (já com margens). */
export type DirectCut = Dims & {
  name: string;
  cut: string;
  count: number;
  note?: string;
  bySize?: Partial<Record<string, Dims>>;
};

export type Step = { title: string; text: string };

export type ChartRow = {
  size: string;
  waistCm?: number;
  hipCm?: number;
  bustCm?: number;
  extra?: { label: string; value: string }[];
};

export type Variant = { id: string; label: string; pieces: Piece[]; directCuts: DirectCut[] };

export type Molde = {
  number: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  priceCents: number;
  category: 'saia' | 'acessorios';
  sizes: string[];
  /** Tamanho usado para a metragem de cada linha da ficha (ex.: comprimento maior). */
  yardageNote: string;
  variants: Variant[];
  chart: { title: string; notes: string; rows: ChartRow[] };
  fabric: string;
  notions: string;
  steps: Step[];
  faq: { question: string; answer: string }[];
  /** Desenho técnico (frente) em coordenadas 0–100 × 0–125, usado nas capas. */
  flat: string;
};

const RAD = Math.PI / 180;

export function arcPoint(cx: number, cy: number, r: number, deg: number) {
  return { x: cx + r * Math.cos(deg * RAD), y: cy + r * Math.sin(deg * RAD) };
}

/** Pontos ao longo do caminho (arcos amostrados a cada grau). */
export function samplePoints(cmds: Cmd[]): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (const c of cmds) {
    if (c.op === 'M' || c.op === 'L') points.push({ x: c.x, y: c.y });
    else if (c.op === 'A') {
      const steps = Math.max(2, Math.ceil(Math.abs(c.a1 - c.a0)));
      for (let i = 0; i <= steps; i += 1) {
        points.push(arcPoint(c.cx, c.cy, c.r, c.a0 + ((c.a1 - c.a0) * i) / steps));
      }
    }
  }
  return points;
}

export function bbox(cmds: Cmd[]) {
  const pts = samplePoints(cmds);
  return {
    minX: Math.min(...pts.map((p) => p.x)),
    minY: Math.min(...pts.map((p) => p.y)),
    maxX: Math.max(...pts.map((p) => p.x)),
    maxY: Math.max(...pts.map((p) => p.y)),
  };
}

export function translate(cmds: Cmd[], dx: number, dy: number): Cmd[] {
  return cmds.map((c) => {
    if (c.op === 'Z') return c;
    if (c.op === 'A') return { ...c, cx: c.cx + dx, cy: c.cy + dy };
    return { ...c, x: c.x + dx, y: c.y + dy };
  });
}

/**
 * Cunha de círculo com a borda de ângulo 0 na dobra.
 * Linha de costura: raio interno r, externo R, abertura `angle`.
 * Linha de corte: +seam na cintura, na barra e na lateral; nada na dobra.
 */
export function foldWedge(r: number, R: number, angle: number, seam: number): { seam: Cmd[]; cut: Cmd[] } {
  const seamPath: Cmd[] = [
    { op: 'M', x: r, y: 0 },
    { op: 'L', x: R, y: 0 },
    { op: 'A', cx: 0, cy: 0, r: R, a0: 0, a1: angle },
    { op: 'L', ...arcPoint(0, 0, r, angle) },
    { op: 'A', cx: 0, cy: 0, r, a0: angle, a1: 0 },
    { op: 'Z' },
  ];
  const ri = r - seam;
  const ro = R + seam;
  // a lateral é deslocada `seam` para fora: encontra os arcos um pouco além do ângulo
  const outerAngle = angle + Math.asin(seam / ro) / RAD;
  const innerAngle = angle + Math.asin(seam / ri) / RAD;
  const cutPath: Cmd[] = [
    { op: 'M', x: ri, y: 0 },
    { op: 'L', x: ro, y: 0 },
    { op: 'A', cx: 0, cy: 0, r: ro, a0: 0, a1: outerAngle },
    { op: 'L', ...arcPoint(0, 0, ri, innerAngle) },
    { op: 'A', cx: 0, cy: 0, r: ri, a0: innerAngle, a1: 0 },
    { op: 'Z' },
  ];
  return { seam: seamPath, cut: cutPath };
}

/** Retângulo de cantos arredondados (raios por canto), com origem em (x, y). */
export function roundedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  radii: { tl?: number; tr?: number; br?: number; bl?: number },
): Cmd[] {
  const tl = radii.tl ?? 0;
  const tr = radii.tr ?? 0;
  const br = radii.br ?? 0;
  const bl = radii.bl ?? 0;
  const cmds: Cmd[] = [{ op: 'M', x: x + tl, y }];
  cmds.push({ op: 'L', x: x + w - tr, y });
  if (tr) cmds.push({ op: 'A', cx: x + w - tr, cy: y + tr, r: tr, a0: 270, a1: 360 });
  cmds.push({ op: 'L', x: x + w, y: y + h - br });
  if (br) cmds.push({ op: 'A', cx: x + w - br, cy: y + h - br, r: br, a0: 0, a1: 90 });
  cmds.push({ op: 'L', x: x + bl, y: y + h });
  if (bl) cmds.push({ op: 'A', cx: x + bl, cy: y + h - bl, r: bl, a0: 90, a1: 180 });
  cmds.push({ op: 'L', x, y: y + tl });
  if (tl) cmds.push({ op: 'A', cx: x + tl, cy: y + tl, r: tl, a0: 180, a1: 270 });
  cmds.push({ op: 'Z' });
  return cmds;
}

/** Linha de costura e linha de corte (deslocada `seam` para fora) de um retângulo arredondado. */
export function roundedPiece(
  w: number,
  h: number,
  radii: { tl?: number; tr?: number; br?: number; bl?: number },
  seam: number,
): { seam: Cmd[]; cut: Cmd[] } {
  const grow = (v?: number) => (v ? v + seam : 0);
  return {
    seam: roundedRect(seam, seam, w, h, radii),
    cut: roundedRect(0, 0, w + 2 * seam, h + 2 * seam, {
      tl: grow(radii.tl),
      tr: grow(radii.tr),
      br: grow(radii.br),
      bl: grow(radii.bl),
    }),
  };
}

export type Box = { w: number; h: number };
export type PlacedBox<T> = { item: T; x: number; y: number; w: number; h: number; rotated: boolean };

/**
 * Empacotamento em prateleiras numa faixa de largura `lane` (gira a peça 90° se
 * ficar mais baixa ou se só assim couber). Devolve posições e altura total.
 */
export function shelfPlace<T>(items: { item: T; box: Box }[], lane: number, gap = 0): { placed: PlacedBox<T>[]; height: number } {
  const oriented = items
    .map(({ item, box }) => {
      const options = [
        { w: box.w, h: box.h, rotated: false },
        { w: box.h, h: box.w, rotated: true },
      ].filter((o) => o.w <= lane);
      if (!options.length) throw new Error(`Peça de ${box.w.toFixed(0)}×${box.h.toFixed(0)} mm não cabe em ${lane} mm.`);
      return { item, ...options.reduce((a, c) => (c.h < a.h ? c : a)) };
    })
    .sort((a, b) => b.h - a.h);

  const placed: PlacedBox<T>[] = [];
  let y = 0;
  let x = 0;
  let rowHeight = 0;
  for (const o of oriented) {
    if (x > 0 && x + o.w > lane) {
      y += rowHeight + gap;
      x = 0;
      rowHeight = 0;
    }
    placed.push({ item: o.item, x, y, w: o.w, h: o.h, rotated: o.rotated });
    x += o.w + gap;
    rowHeight = Math.max(rowHeight, o.h);
  }
  return { placed, height: placed.length ? y + rowHeight : 0 };
}

function shelfHeight(boxes: Box[], lane: number): number {
  return shelfPlace(
    boxes.map((box) => ({ item: null, box })),
    lane,
  ).height;
}

/**
 * Dimensões de uma peça na dobra já girada para o plano de corte: a borda reta
 * (y = 0 no desenho) fica vertical, encostada na dobra do tecido.
 */
export function foldBox(cmds: Cmd[]): Box {
  const b = bbox(cmds);
  return { w: b.maxY - b.minY, h: b.maxX - b.minX };
}

/**
 * Metragem aproximada (com folga) para um tamanho, em mm, arredondada para cima a cada 5 cm.
 * Peças na dobra usam o tecido dobrado ao meio no comprimento e ficam uma embaixo
 * da outra, cada uma encostada na dobra.
 */
export function yardageMm(
  pieces: Piece[],
  directCuts: DirectCut[],
  size: string,
  fabricWidthMm = 1500,
): number {
  const open: Box[] = [];
  let foldedHeight = 0;

  for (const piece of pieces) {
    const outlines = piece.outlines.filter((o) => o.size === size);
    const cut = (outlines.length ? outlines : piece.outlines).flatMap((o) => o.cut);
    if (piece.onFold) {
      const box = foldBox(cut);
      if (box.w > fabricWidthMm / 2) throw new Error(`${piece.name} não cabe no tecido dobrado.`);
      foldedHeight += box.h * piece.count;
    } else {
      const b = bbox(cut);
      for (let i = 0; i < piece.count; i += 1) open.push({ w: b.maxX - b.minX, h: b.maxY - b.minY });
    }
  }

  for (const cut of directCuts) {
    const dims = cut.bySize?.[size] ?? cut;
    for (let i = 0; i < cut.count; i += 1) open.push({ w: dims.widthMm, h: dims.heightMm });
  }

  const height = (open.length ? shelfHeight(open, fabricWidthMm) : 0) + foldedHeight;
  return Math.ceil(height / 50) * 50;
}

/** Gira 90° no sentido horário (no papel): (x, y) → (−y, x). */
export function rotateCW(cmds: Cmd[]): Cmd[] {
  return cmds.map((c) => {
    if (c.op === 'Z') return c;
    if (c.op === 'A') return { ...c, cx: -c.cy, cy: c.cx, a0: c.a0 + 90, a1: c.a1 + 90 };
    return { ...c, x: -c.y, y: c.x };
  });
}

/** Gira 90° no sentido anti-horário (no papel): (x, y) → (y, −x). */
export function rotateCCW(cmds: Cmd[]): Cmd[] {
  return cmds.map((c) => {
    if (c.op === 'Z') return c;
    if (c.op === 'A') return { ...c, cx: c.cy, cy: -c.cx, a0: c.a0 - 90, a1: c.a1 - 90 };
    return { ...c, x: c.y, y: -c.x };
  });
}

export function shift(cmds: Cmd[], dx: number, dy: number): Cmd[] {
  return cmds.map((c) => {
    if (c.op === 'Z') return c;
    if (c.op === 'A') return { ...c, cx: c.cx + dx, cy: c.cy + dy };
    return { ...c, x: c.x + dx, y: c.y + dy };
  });
}

export type CutItem = { name: string; w: number; h: number; cmds?: Cmd[] };
export type CutLane = { lane: number; folded: boolean; label: string; placed: PlacedBox<CutItem>[]; height: number };

/**
 * Plano de corte de um tamanho: peças na dobra empilhadas encostadas na dobra
 * (tecido dobrado ao meio) e o resto empacotado no tecido aberto.
 */
export function cuttingLayout(variant: Variant, size: string, fabricWidthMm = 1500): CutLane[] {
  const open: { item: CutItem; box: Box }[] = [];
  const folded: PlacedBox<CutItem>[] = [];
  let foldedH = 0;
  for (const piece of variant.pieces) {
    const outlines = piece.outlines.filter((o) => o.size === size);
    const src = (outlines.length ? outlines : piece.outlines).slice(-1)[0];
    if (piece.onFold) {
      const turned = rotateCCW(src.cut);
      const b = bbox(turned);
      const cmds = shift(turned, -b.minX, -b.minY);
      const box = foldBox(src.cut);
      for (let i = 0; i < piece.count; i += 1) {
        folded.push({ item: { name: piece.name, w: box.w, h: box.h, cmds }, x: 0, y: foldedH, w: box.w, h: box.h, rotated: false });
        foldedH += box.h;
      }
      continue;
    }
    const b = bbox(src.cut);
    const cmds = shift(src.cut, -b.minX, -b.minY);
    for (let i = 0; i < piece.count; i += 1) {
      open.push({ item: { name: piece.name, w: b.maxX - b.minX, h: b.maxY - b.minY, cmds }, box: { w: b.maxX - b.minX, h: b.maxY - b.minY } });
    }
  }
  for (const d of variant.directCuts) {
    const dims = d.bySize?.[size] ?? d;
    for (let i = 0; i < d.count; i += 1) {
      open.push({ item: { name: d.name, w: dims.widthMm, h: dims.heightMm }, box: { w: dims.widthMm, h: dims.heightMm } });
    }
  }
  const lanes: CutLane[] = [];
  if (folded.length) {
    lanes.push({ lane: fabricWidthMm / 2, folded: true, label: 'Tecido dobrado ao meio no comprimento (dobra à esquerda)', placed: folded, height: foldedH });
  }
  if (open.length) {
    lanes.push({ lane: fabricWidthMm, folded: false, label: 'Tecido aberto, 1,50 m de largura', ...shelfPlace(open, fabricWidthMm) });
  }
  return lanes;
}

/** Peça (ou retângulo) do plano de corte já posicionado, com o desenho girado quando preciso. */
export function placedCmds(pl: PlacedBox<CutItem>): Cmd[] | null {
  if (!pl.item.cmds) return null;
  return pl.rotated ? shift(rotateCW(pl.item.cmds), pl.item.h, 0) : pl.item.cmds;
}

/** "1,35 m" a partir de milímetros. */
export function metros(mm: number): string {
  return `${(mm / 1000).toFixed(2).replace('.', ',')} m`;
}
