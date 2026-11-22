/**
 * Imagens dos produtos (SVG → PNG 900 × 1200, proporção 3:4 das molduras da loja)
 * e a imagem de compartilhamento da marca (1200 × 630).
 */
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { cuttingLayout, placedCmds, type Molde } from './geometria';
import { FABRIC_WIDTH_MM } from './medidas';
import { toSvgPath } from './pdf';

export type ImageKind = 'envelope' | 'tecnico' | 'corte';

const PAPER = '#FBF8F3';
const LINEN = '#F3EEE6';
const SAND = '#E6DCCE';
const INK = '#3A2E2A';
const WINE = '#7A3B3B';
const MUTED = '#6A5B54';
const RULE = '#CDBFAF';

const SERIF = "font-family=\"Cormorant Garamond\"";
const SANS = "font-family=\"DM Sans, DM Sans 14pt\"";

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function sizesLabel(m: Molde) {
  return m.sizes.length > 1 ? `Tamanhos ${m.sizes[0]}–${m.sizes[m.sizes.length - 1]}` : 'Tamanho único';
}

/** Quebra o nome em até duas linhas equilibradas. */
function nameLines(name: string): string[] {
  if (name.length <= 16) return [name];
  const words = name.split(' ');
  let best = [name];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff) {
      best = [a, b];
      bestDiff = diff;
    }
  }
  return best;
}

function envelope(m: Molde): string {
  const lines = nameLines(m.name);
  const nameY = lines.length === 1 ? 300 : 270;
  return `
  <rect width="900" height="1200" fill="${PAPER}"/>
  <rect x="40" y="40" width="820" height="1120" fill="none" stroke="${WINE}" stroke-width="4"/>
  <rect x="56" y="56" width="788" height="1088" fill="none" stroke="${WINE}" stroke-width="1.5"/>
  <text x="450" y="132" ${SANS} font-weight="500" font-size="26" fill="${INK}" text-anchor="middle" letter-spacing="10">FIOFORMA</text>
  <line x1="300" y1="160" x2="600" y2="160" stroke="${RULE}" stroke-width="2"/>
  <text x="450" y="205" ${SANS} font-weight="500" font-size="24" fill="${WINE}" text-anchor="middle" letter-spacing="4">MODELO Nº ${m.number}</text>
  ${lines
    .map(
      (l, i) =>
        `<text x="450" y="${nameY + i * 78}" ${SERIF} font-weight="600" font-size="80" fill="${INK}" text-anchor="middle">${esc(l)}</text>`,
    )
    .join('')}
  <g transform="translate(240 ${lines.length === 1 ? 370 : 410}) scale(4.2)">
    <path d="${m.flat}" fill="none" stroke="${INK}" stroke-width="0.6" stroke-linejoin="round"/>
  </g>
  <line x1="120" y1="1010" x2="780" y2="1010" stroke="${RULE}" stroke-width="2"/>
  <text x="450" y="1060" ${SANS} font-weight="500" font-size="26" fill="${INK}" text-anchor="middle" letter-spacing="3">${esc(sizesLabel(m).toUpperCase())}</text>
  <text x="450" y="1105" ${SERIF} font-style="italic" font-weight="500" font-size="34" fill="${MUTED}" text-anchor="middle">molde de costura em PDF</text>`;
}

function tecnico(m: Molde): string {
  return `
  <rect width="900" height="1200" fill="${SAND}"/>
  <g transform="translate(150 150) scale(6)">
    <path d="${m.flat}" fill="none" stroke="${INK}" stroke-width="0.45" stroke-linejoin="round"/>
  </g>
  <text x="450" y="1060" ${SERIF} font-style="italic" font-weight="500" font-size="40" fill="${INK}" text-anchor="middle">Desenho técnico</text>
  <text x="450" y="1105" ${SANS} font-size="24" fill="${MUTED}" text-anchor="middle" letter-spacing="3">${esc(m.shortName.toUpperCase())} · MODELO Nº ${m.number}</text>`;
}

function corte(m: Molde): string {
  const variant = m.variants[0];
  const size = m.sizes[m.sizes.length - 1];
  const lanes = cuttingLayout(variant, size, FABRIC_WIDTH_MM);
  const totalH = lanes.reduce((s, l) => s + l.height, 0) + (lanes.length - 1) * 120;
  const k = Math.min(700 / FABRIC_WIDTH_MM, 780 / totalH);
  let y = 0;
  const parts: string[] = [];
  for (const lane of lanes) {
    const w = lane.lane * k;
    const h = lane.height * k;
    parts.push(`<rect x="0" y="${y}" width="${w}" height="${h}" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>`);
    if (lane.folded) parts.push(`<line x1="0" y1="${y}" x2="0" y2="${y + h}" stroke="${WINE}" stroke-width="6"/>`);
    for (const pl of lane.placed) {
      const cmds = placedCmds(pl);
      const x0 = pl.x * k;
      const y0 = y + pl.y * k;
      if (cmds) {
        parts.push(
          `<path transform="translate(${x0} ${y0}) scale(${k})" d="${toSvgPath(cmds)}" fill="${SAND}" stroke="${INK}" stroke-width="${2 / k}"/>`,
        );
      } else {
        parts.push(`<rect x="${x0}" y="${y0}" width="${pl.w * k}" height="${pl.h * k}" fill="${SAND}" stroke="${INK}" stroke-width="2"/>`);
      }
    }
    y += h + 120 * k;
  }
  const blockW = FABRIC_WIDTH_MM * k;
  return `
  <rect width="900" height="1200" fill="${LINEN}"/>
  <text x="450" y="110" ${SERIF} font-weight="600" font-size="56" fill="${INK}" text-anchor="middle">Plano de corte</text>
  <text x="450" y="155" ${SANS} font-size="22" fill="${MUTED}" text-anchor="middle" letter-spacing="2">${esc(
    `${m.sizes.length > 1 ? `TAMANHO ${size}` : 'TAMANHO ÚNICO'} · TECIDO DE 1,50 M`,
  )}</text>
  <g transform="translate(${(900 - blockW) / 2} ${200 + (820 - y) / 2})">${parts.join('')}</g>
  <text x="450" y="1120" ${SERIF} font-style="italic" font-weight="500" font-size="34" fill="${MUTED}" text-anchor="middle">${esc(m.shortName)} · Modelo nº ${m.number}</text>`;
}

const FONT_FILES = [
  'CormorantGaramond-Medium.ttf',
  'CormorantGaramond-SemiBold.ttf',
  'CormorantGaramond-MediumItalic.ttf',
  'DMSans-Regular.ttf',
  'DMSans-Medium.ttf',
].map((f) => path.join(__dirname, 'fonts', f));

function render(body: string, width: number, height: number): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
  const resvg = new Resvg(svg, {
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'DM Sans' },
    fitTo: { mode: 'original' },
  });
  return resvg.render().asPng();
}

export function renderImage(kind: ImageKind, m: Molde): Buffer {
  const body = kind === 'envelope' ? envelope(m) : kind === 'tecnico' ? tecnico(m) : corte(m);
  return render(body, 900, 1200);
}

/** Imagem padrão de compartilhamento (Open Graph) da loja. */
export function renderOgImage(): Buffer {
  return render(
    `
  <rect width="1200" height="630" fill="${LINEN}"/>
  <rect x="30" y="30" width="1140" height="570" fill="none" stroke="${WINE}" stroke-width="3"/>
  <rect x="42" y="42" width="1116" height="546" fill="none" stroke="${WINE}" stroke-width="1"/>
  <text x="600" y="250" ${SERIF} font-weight="600" font-size="110" fill="${INK}" text-anchor="middle" letter-spacing="14">FIOFORMA</text>
  <line x1="420" y1="300" x2="780" y2="300" stroke="${RULE}" stroke-width="2"/>
  <text x="600" y="380" ${SERIF} font-style="italic" font-weight="500" font-size="54" fill="${INK}" text-anchor="middle">O molde certo, na <tspan fill="${WINE}">escala certa</tspan></text>
  <text x="600" y="470" ${SANS} font-weight="500" font-size="24" fill="${MUTED}" text-anchor="middle" letter-spacing="4">MOLDES DE COSTURA EM PDF</text>`,
    1200,
    630,
  );
}
