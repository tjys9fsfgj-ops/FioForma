/**
 * Gera os arquivos dos moldes em prisma/moldes/<slug>/ (PDFs, imagens e
 * manifest.json) e a imagem de compartilhamento em public/og.png.
 *
 *   pnpm moldes:build
 */
import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { metros, yardageMm, type Molde } from './geometria';
import { FABRIC_WIDTH_MM } from './medidas';
import { moldes } from './moldes/index';
import { A0_FORMAT_VARIANTS, renderA0, renderA4 } from './pdf';
import { renderImage, renderOgImage, type ImageKind } from './svg';

export type ManifestFile = { fileName: string; format: 'A4' | 'A0'; pages: number; sizeBytes: number; sha256: string };
export type ManifestImage = { fileName: string; alt: string; kind: 'PECA' | 'DETALHE' | 'MOLDE'; sha256: string };

export type Manifest = {
  number: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  priceCents: number;
  category: Molde['category'];
  sizes: string[];
  fabric: string;
  notions: string;
  yardage: string;
  chart: Molde['chart'];
  faq: Molde['faq'];
  files: ManifestFile[];
  images: ManifestImage[];
};

const sha256 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

function yardageText(m: Molde): string {
  const perVariant = m.variants.map((v) => {
    const values = m.sizes.map((size) => `${size} ${metros(yardageMm(v.pieces, v.directCuts, size, FABRIC_WIDTH_MM))}`);
    return m.variants.length > 1 ? `${v.label}: ${values.join(' · ')}` : values.join(' · ');
  });
  return `${perVariant.join('\n')}\n(tecido de 1,50 m de largura, ${m.yardageNote})`;
}

const IMAGES: { kind: ImageKind; manifestKind: ManifestImage['kind']; alt: (m: Molde) => string }[] = [
  { kind: 'envelope', manifestKind: 'PECA', alt: (m) => `Envelope do molde ${m.name}, modelo nº ${m.number}` },
  { kind: 'tecnico', manifestKind: 'DETALHE', alt: (m) => `Desenho técnico da ${m.shortName}` },
  { kind: 'corte', manifestKind: 'MOLDE', alt: (m) => `Plano de corte do molde ${m.name}` },
];

export async function buildMolde(m: Molde, outDir: string): Promise<Manifest> {
  const dir = path.join(outDir, m.slug);
  await mkdir(dir, { recursive: true });

  const files: ManifestFile[] = [];
  const a0Variants = A0_FORMAT_VARIANTS(m);
  for (const variant of m.variants) {
    const base = m.variants.length > 1 ? `${m.slug}-${variant.id}` : m.slug;
    const a4 = await renderA4(m, variant.id);
    files.push({ fileName: `${base}-a4.pdf`, format: 'A4', pages: a4.pages, sizeBytes: a4.bytes.byteLength, sha256: sha256(a4.bytes) });
    await writeFile(path.join(dir, `${base}-a4.pdf`), a4.bytes);
    if (a0Variants.includes(variant.id)) {
      const a0 = await renderA0(m, variant.id);
      files.push({ fileName: `${base}-a0.pdf`, format: 'A0', pages: a0.pages, sizeBytes: a0.bytes.byteLength, sha256: sha256(a0.bytes) });
      await writeFile(path.join(dir, `${base}-a0.pdf`), a0.bytes);
    }
  }

  const images: ManifestImage[] = [];
  for (const image of IMAGES) {
    const png = renderImage(image.kind, m);
    const fileName = `${m.slug}-${image.kind}.png`;
    await writeFile(path.join(dir, fileName), png);
    images.push({ fileName, alt: image.alt(m), kind: image.manifestKind, sha256: sha256(png) });
  }

  const manifest: Manifest = {
    number: m.number,
    slug: m.slug,
    name: m.name,
    tagline: m.tagline,
    description: m.description,
    priceCents: m.priceCents,
    category: m.category,
    sizes: m.sizes,
    fabric: m.fabric,
    notions: m.notions,
    yardage: yardageText(m),
    chart: m.chart,
    faq: m.faq,
    files,
    images,
  };
  await writeFile(path.join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

export async function buildAll(outDir: string): Promise<Manifest[]> {
  const result: Manifest[] = [];
  for (const m of moldes) result.push(await buildMolde(m, outDir));
  return result;
}

async function main() {
  const root = path.resolve(__dirname, '..', '..');
  const outDir = path.join(root, 'prisma', 'moldes');
  await rm(outDir, { recursive: true, force: true });
  const manifests = await buildAll(outDir);
  await writeFile(path.join(root, 'public', 'og.png'), renderOgImage());
  for (const m of manifests) {
    console.log(`${m.number} ${m.slug}: ${m.files.map((f) => `${f.fileName} (${f.pages} p.)`).join(', ')}`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
