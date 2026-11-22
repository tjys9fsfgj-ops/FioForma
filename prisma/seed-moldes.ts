/**
 * Carrega os moldes gerados (prisma/moldes/<slug>/manifest.json) no banco.
 * Idempotente: rodar de novo só troca arquivos e imagens cujo conteúdo mudou.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { FileFormat, ImageKind, PrismaClient } from '@prisma/client';
import type { Manifest } from '../scripts/moldes/build';
import { shouldApplySeed } from '../src/lib/seed-guards';
import { contentHash, readStamp, writeStamp } from './seed-stamps';

const CATEGORY_BY_MOLDE: Record<string, string> = { saia: 'saia', acessorios: 'acessorios' };
const COLLECTION = 'basicos';

const PRINT_INSTRUCTIONS =
  'Imprima em escala 100% (tamanho real). Confira o quadrado de 5 cm na página de teste antes de imprimir as folhas. Una as folhas pelos nomes (A1, A2, B1…) seguindo o mapa de montagem.';

async function storeMedia(
  prisma: PrismaClient,
  dir: string,
  fileName: string,
  sha256: string,
  mimeType: string,
  visibility: 'PRIVATE' | 'PUBLIC',
) {
  const data = await readFile(path.join(dir, fileName));
  return prisma.mediaAsset.create({
    data: {
      storageKey: `moldes/${sha256.slice(0, 16)}/${fileName}`,
      fileName,
      mimeType,
      sizeBytes: data.byteLength,
      visibility,
      driver: 'db',
      data: new Uint8Array(data),
    },
  });
}

export async function seedMoldes(
  prisma: PrismaClient,
  dir = path.join(__dirname, 'moldes'),
): Promise<{ created: number; updated: number }> {
  const slugs = (await readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  const manifests: Manifest[] = [];
  for (const slug of slugs) {
    manifests.push(JSON.parse(await readFile(path.join(dir, slug, 'manifest.json'), 'utf8')) as Manifest);
  }
  manifests.sort((a, b) => a.number.localeCompare(b.number));

  const collection = await prisma.collection.findUnique({ where: { slug: COLLECTION } });
  let created = 0;
  let updated = 0;

  for (const m of manifests) {
    const folder = path.join(dir, m.slug);
    const category = await prisma.category.findUnique({ where: { slug: CATEGORY_BY_MOLDE[m.category] } });
    const existing = await prisma.product.findUnique({ where: { slug: m.slug } });
    const data = {
      name: m.name,
      tagline: m.tagline,
      description: m.description,
      priceCents: m.priceCents,
      difficulty: 'INICIANTE' as const,
      isDemo: false,
      modelNumber: m.number,
      sizesIncluded: JSON.stringify(m.sizes),
      categoryId: category?.id ?? null,
      collectionId: collection?.id ?? null,
      seoTitle: `${m.name} — molde de costura em PDF`,
      seoDescription: m.tagline,
    };
    // conteúdo (textos, preço, ficha, tabela) só é reaplicado se mudou no código
    // e ninguém editou o molde no painel depois do último seed
    const { files: _files, images: _images, ...content } = m;
    const hash = contentHash(content);
    const stamp = await readStamp(prisma, `molde.${m.slug}`);
    const applyContent = !existing || shouldApplySeed({ stored: stamp, hash, recordUpdatedAt: existing.updatedAt });
    const product = existing
      ? applyContent
        ? await prisma.product.update({ where: { id: existing.id }, data })
        : existing
      : await prisma.product.create({
          // o modelo nº 001 aparece primeiro nas novidades (data mais recente)
          data: { ...data, status: 'PUBLISHED', slug: m.slug, publishedAt: new Date(Date.now() - Number(m.number) * 60_000) },
        });
    if (existing) updated += 1;
    else created += 1;

    if (applyContent) {
      const formats = Array.from(new Set(m.files.map((f) => f.format)));
      const spec = {
        fabricRecommendation: m.fabric,
        yardage: m.yardage,
        notions: m.notions,
        seamAllowance: '1 cm incluso em todas as bordas',
        includedFormats: JSON.stringify(formats),
        layersAvailable: false,
        projectorAvailable: false,
        pageCount: null,
        printInstructions: PRINT_INSTRUCTIONS,
        faq: JSON.stringify(m.faq),
      };
      await prisma.productSpec.upsert({
        where: { productId: product.id },
        create: { productId: product.id, ...spec },
        update: spec,
      });

      // tabela: recria sempre (é pequena e vem do manifest)
      await prisma.sizeChart.deleteMany({ where: { productId: product.id } });
      await prisma.sizeChart.create({
        data: {
          productId: product.id,
          title: m.chart.title,
          unit: 'cm',
          notes: m.chart.notes,
          rows: {
            create: m.chart.rows.map((row, index) => ({
              size: row.size,
              bustCm: row.bustCm ?? null,
              waistCm: row.waistCm ?? null,
              hipCm: row.hipCm ?? null,
              extra: row.extra?.length ? JSON.stringify(row.extra) : null,
              sortOrder: index,
            })),
          },
        },
      });
      await writeStamp(prisma, `molde.${m.slug}`, hash);
    }

    // PDFs: mantém os iguais (mesmo nome e checksum), troca os que mudaram, remove os que saíram
    const currentFiles = await prisma.productFile.findMany({ where: { productId: product.id } });
    for (const file of currentFiles) {
      const wanted = m.files.find((f) => f.fileName === file.fileName && f.sha256 === file.checksum);
      if (!wanted) {
        await prisma.productFile.delete({ where: { id: file.id } });
        await prisma.mediaAsset.delete({ where: { id: file.mediaId } }).catch(() => undefined);
      }
    }
    for (const f of m.files) {
      const same = currentFiles.find((c) => c.fileName === f.fileName && c.checksum === f.sha256);
      if (same) continue;
      const media = await storeMedia(prisma, folder, f.fileName, f.sha256, 'application/pdf', 'PRIVATE');
      await prisma.productFile.create({
        data: {
          productId: product.id,
          mediaId: media.id,
          fileName: f.fileName,
          format: f.format as FileFormat,
          pages: f.pages,
          sizeBytes: f.sizeBytes,
          checksum: f.sha256,
        },
      });
    }

    // imagens: identificadas pelo nome do arquivo + checksum no storageKey
    const currentImages = await prisma.productImage.findMany({ where: { productId: product.id }, include: { media: true } });
    for (const image of currentImages) {
      const wanted = m.images.find(
        (i) => i.fileName === image.media.fileName && image.media.storageKey.includes(i.sha256.slice(0, 16)),
      );
      if (!wanted) {
        await prisma.productImage.delete({ where: { id: image.id } });
        await prisma.mediaAsset.delete({ where: { id: image.mediaId } }).catch(() => undefined);
      }
    }
    for (const [index, i] of m.images.entries()) {
      const same = currentImages.find(
        (c) => c.media.fileName === i.fileName && c.media.storageKey.includes(i.sha256.slice(0, 16)),
      );
      if (same) {
        if (same.sortOrder !== index || same.alt !== i.alt) {
          await prisma.productImage.update({ where: { id: same.id }, data: { sortOrder: index, alt: i.alt } });
        }
        continue;
      }
      const media = await storeMedia(prisma, folder, i.fileName, i.sha256, 'image/png', 'PUBLIC');
      await prisma.productImage.create({
        data: { productId: product.id, mediaId: media.id, alt: i.alt, kind: i.kind as ImageKind, sortOrder: index },
      });
    }
  }

  return { created, updated };
}
