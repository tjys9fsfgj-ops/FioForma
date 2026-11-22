'use server';

import { createHash } from 'node:crypto';
import type { Difficulty, FileFormat, ImageKind, ProductStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAudit } from '@/lib/audit';
import { inputToCents } from '@/lib/format';
import { deleteMedia, saveMedia } from '@/lib/media';
import { prisma } from '@/lib/prisma';
import { getClientIp, getCurrentUser } from '@/lib/session';
import { slugify } from '@/lib/utils';

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') throw new Error('Acesso negado.');
  return user;
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function optional(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value ? value : null;
}

function numberOrNull(formData: FormData, key: string): number | null {
  const raw = text(formData, key).replace(',', '.');
  if (!raw) return null;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || `molde-${Date.now()}`;
  let candidate = root;
  let counter = 2;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${counter++}`;
  }
}

function parseFaq(raw: string): { question: string; answer: string }[] {
  return raw
    .split('\n')
    .map((line) => line.split('|'))
    .filter((parts) => parts.length >= 2 && parts[0].trim() && parts[1].trim())
    .map((parts) => ({ question: parts[0].trim(), answer: parts.slice(1).join('|').trim() }));
}

async function persistSpecAndSizes(productId: string, formData: FormData) {
  const includedFormats = formData.getAll('includedFormats').map(String).filter(Boolean);

  const specData = {
    fabricRecommendation: optional(formData, 'fabricRecommendation'),
    yardage: optional(formData, 'yardage'),
    notions: optional(formData, 'notions'),
    seamAllowance: optional(formData, 'seamAllowance'),
    pageCount: numberOrNull(formData, 'pageCount'),
    printInstructions: optional(formData, 'printInstructions'),
    includedFormats: JSON.stringify(includedFormats),
    layersAvailable: formData.get('layersAvailable') === 'on',
    projectorAvailable: formData.get('projectorAvailable') === 'on',
    faq: JSON.stringify(parseFaq(text(formData, 'faq'))),
  };

  await prisma.productSpec.upsert({
    where: { productId },
    create: { productId, ...specData },
    update: specData,
  });

  const chartTitle = text(formData, 'chartTitle') || 'Tabela de medidas';
  const existingChart = await prisma.sizeChart.findFirst({ where: { productId } });
  const chart = existingChart
    ? await prisma.sizeChart.update({
        where: { id: existingChart.id },
        data: { title: chartTitle, notes: optional(formData, 'chartNotes') },
      })
    : await prisma.sizeChart.create({
        data: { productId, title: chartTitle, unit: 'cm', notes: optional(formData, 'chartNotes') },
      });

  const sizes = ['PP', 'P', 'M', 'G'];
  const existingRows = await prisma.sizeRow.findMany({ where: { chartId: chart.id } });

  for (const [index, size] of sizes.entries()) {
    const bust = numberOrNull(formData, `bust_${size}`);
    const waist = numberOrNull(formData, `waist_${size}`);
    const hip = numberOrNull(formData, `hip_${size}`);
    const row = existingRows.find((item) => item.size === size);

    if (row) {
      await prisma.sizeRow.update({
        where: { id: row.id },
        data: { bustCm: bust, waistCm: waist, hipCm: hip, sortOrder: index },
      });
    } else if (bust !== null || waist !== null || hip !== null) {
      await prisma.sizeRow.create({
        data: { chartId: chart.id, size, bustCm: bust, waistCm: waist, hipCm: hip, sortOrder: index },
      });
    }
  }
}

export async function createProductAction(formData: FormData): Promise<void> {
  const user = await guard();
  const name = text(formData, 'name');
  if (!name) redirect('/admin/produtos/novo?erro=nome');

  const priceCents = inputToCents(text(formData, 'price')) ?? 0;
  const slug = await uniqueSlug(text(formData, 'slug') || name);
  const sizes = formData.getAll('sizes').map(String).filter(Boolean);

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      tagline: optional(formData, 'tagline'),
      description: text(formData, 'description') || 'Descrição em preparação.',
      priceCents,
      compareAtCents: inputToCents(text(formData, 'compareAt')),
      difficulty: (text(formData, 'difficulty') || 'INICIANTE') as Difficulty,
      status: (text(formData, 'status') || 'DRAFT') as ProductStatus,
      sizesIncluded: JSON.stringify(sizes.length ? sizes : ['PP', 'P', 'M', 'G']),
      categoryId: optional(formData, 'categoryId'),
      collectionId: optional(formData, 'collectionId'),
      seoTitle: optional(formData, 'seoTitle'),
      seoDescription: optional(formData, 'seoDescription'),
      publishedAt: text(formData, 'status') === 'PUBLISHED' ? new Date() : null,
    },
  });

  await persistSpecAndSizes(product.id, formData);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'product.create',
    entity: 'product',
    entityId: product.id,
    meta: { name, priceCents },
    ipHash: null,
  });

  revalidatePath('/admin/produtos');
  revalidatePath('/catalogo');
  redirect(`/admin/produtos/${product.id}?salvo=1`);
}

export async function updateProductAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  if (!id) redirect('/admin/produtos');

  const name = text(formData, 'name');
  const slug = await uniqueSlug(text(formData, 'slug') || name, id);
  const priceCents = inputToCents(text(formData, 'price')) ?? 0;
  const status = (text(formData, 'status') || 'DRAFT') as ProductStatus;
  const sizes = formData.getAll('sizes').map(String).filter(Boolean);
  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) redirect('/admin/produtos');

  await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      tagline: optional(formData, 'tagline'),
      description: text(formData, 'description'),
      priceCents,
      compareAtCents: inputToCents(text(formData, 'compareAt')),
      difficulty: (text(formData, 'difficulty') || 'INICIANTE') as Difficulty,
      status,
      sizesIncluded: JSON.stringify(sizes),
      categoryId: optional(formData, 'categoryId'),
      collectionId: optional(formData, 'collectionId'),
      seoTitle: optional(formData, 'seoTitle'),
      seoDescription: optional(formData, 'seoDescription'),
      publishedAt: status === 'PUBLISHED' ? current.publishedAt ?? new Date() : current.publishedAt,
    },
  });

  await persistSpecAndSizes(id, formData);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'product.update',
    entity: 'product',
    entityId: id,
    meta: { name, priceCents, status },
  });

  revalidatePath('/admin/produtos');
  revalidatePath(`/admin/produtos/${id}`);
  revalidatePath(`/produto/${slug}`);
  revalidatePath('/catalogo');
  revalidatePath('/');
  redirect(`/admin/produtos/${id}?salvo=1`);
}

export async function toggleProductStatusAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) redirect('/admin/produtos');

  const nextStatus: ProductStatus = product.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
  await prisma.product.update({
    where: { id },
    data: {
      status: nextStatus,
      publishedAt: nextStatus === 'PUBLISHED' ? product.publishedAt ?? new Date() : product.publishedAt,
    },
  });

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'product.status',
    entity: 'product',
    entityId: id,
    meta: { from: product.status, to: nextStatus },
  });

  revalidatePath('/admin/produtos');
  revalidatePath('/catalogo');
  revalidatePath('/');
  redirect('/admin/produtos');
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!product) redirect('/admin/produtos');

  if (product._count.orderItems > 0) {
    await prisma.product.update({ where: { id }, data: { status: 'ARCHIVED' } });
    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'product.archive',
      entity: 'product',
      entityId: id,
      meta: { reason: 'tem pedidos vinculados' },
    });
  } else {
    const media = await prisma.mediaAsset.findMany({
      where: {
        OR: [{ productImages: { some: { productId: id } } }, { productFiles: { some: { productId: id } } }],
      },
      select: { id: true },
    });
    await prisma.product.delete({ where: { id } });
    for (const item of media) {
      const stillUsed = await prisma.mediaAsset.findUnique({
        where: { id: item.id },
        include: { _count: { select: { productImages: true, productFiles: true, pages: true } } },
      });
      if (
        stillUsed &&
        stillUsed._count.productImages === 0 &&
        stillUsed._count.productFiles === 0 &&
        stillUsed._count.pages === 0
      ) {
        await deleteMedia(item.id);
      }
    }
    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'product.delete',
      entity: 'product',
      entityId: id,
      meta: { name: product.name },
    });
  }

  revalidatePath('/admin/produtos');
  revalidatePath('/catalogo');
  redirect('/admin/produtos');
}

export async function uploadProductImageAction(formData: FormData): Promise<void> {
  const user = await guard();
  const productId = text(formData, 'productId');
  const file = formData.get('file');

  if (!productId || !(file instanceof File) || file.size === 0) {
    redirect(`/admin/produtos/${productId}?erro=imagem`);
  }

  try {
    const media = await saveMedia({ file, visibility: 'PUBLIC', allowed: 'image' });
    const last = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { sortOrder: 'desc' },
    });

    await prisma.productImage.create({
      data: {
        productId,
        mediaId: media.id,
        alt: text(formData, 'alt') || 'Foto do molde',
        kind: (text(formData, 'kind') || 'PECA') as ImageKind,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });

    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'product.image.upload',
      entity: 'product',
      entityId: productId,
      meta: { fileName: file.name, size: file.size },
    });
  } catch (error) {
    console.error('[admin] upload de imagem falhou', error);
    redirect(`/admin/produtos/${productId}?erro=upload`);
  }

  revalidatePath(`/admin/produtos/${productId}`);
  revalidatePath('/catalogo');
  redirect(`/admin/produtos/${productId}?salvo=imagem`);
}

export async function deleteProductImageAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  const productId = text(formData, 'productId');
  const image = await prisma.productImage.findUnique({ where: { id } });
  if (image) {
    await prisma.productImage.delete({ where: { id } });
    const stillUsed = await prisma.mediaAsset.findUnique({
      where: { id: image.mediaId },
      include: { _count: { select: { productImages: true, productFiles: true, pages: true } } },
    });
    if (
      stillUsed &&
      stillUsed._count.productImages === 0 &&
      stillUsed._count.productFiles === 0 &&
      stillUsed._count.pages === 0
    ) {
      await deleteMedia(image.mediaId);
    }
    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'product.image.delete',
      entity: 'product',
      entityId: productId,
      meta: { imageId: id },
    });
  }
  revalidatePath(`/admin/produtos/${productId}`);
  redirect(`/admin/produtos/${productId}?salvo=imagem`);
}

export async function moveProductImageAction(formData: FormData): Promise<void> {
  await guard();
  const id = text(formData, 'id');
  const productId = text(formData, 'productId');
  const direction = text(formData, 'direction');
  const image = await prisma.productImage.findUnique({ where: { id } });
  if (!image) redirect(`/admin/produtos/${productId}`);

  const neighbour = await prisma.productImage.findFirst({
    where: {
      productId,
      sortOrder: direction === 'up' ? { lt: image.sortOrder } : { gt: image.sortOrder },
    },
    orderBy: { sortOrder: direction === 'up' ? 'desc' : 'asc' },
  });

  if (neighbour) {
    await prisma.$transaction([
      prisma.productImage.update({ where: { id: image.id }, data: { sortOrder: neighbour.sortOrder } }),
      prisma.productImage.update({ where: { id: neighbour.id }, data: { sortOrder: image.sortOrder } }),
    ]);
  }

  revalidatePath(`/admin/produtos/${productId}`);
  redirect(`/admin/produtos/${productId}?salvo=imagem`);
}

export async function uploadProductFileAction(formData: FormData): Promise<void> {
  const user = await guard();
  const productId = text(formData, 'productId');
  const file = formData.get('file');

  if (!productId || !(file instanceof File) || file.size === 0) {
    redirect(`/admin/produtos/${productId}?erro=arquivo`);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const checksum = createHash('sha256').update(buffer).digest('hex');
    const media = await saveMedia({ file, visibility: 'PRIVATE', allowed: 'pdf' });

    await prisma.productFile.create({
      data: {
        productId,
        mediaId: media.id,
        fileName: file.name.slice(0, 200),
        format: (text(formData, 'format') || 'A4') as FileFormat,
        pages: numberOrNull(formData, 'pages') ? Math.trunc(numberOrNull(formData, 'pages') as number) : null,
        sizeBytes: media.sizeBytes,
        checksum,
      },
    });

    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'product.file.upload',
      entity: 'product',
      entityId: productId,
      meta: { fileName: file.name, size: file.size, checksum },
    });
  } catch (error) {
    console.error('[admin] upload de PDF falhou', error);
    redirect(`/admin/produtos/${productId}?erro=upload`);
  }

  revalidatePath(`/admin/produtos/${productId}`);
  redirect(`/admin/produtos/${productId}?salvo=arquivo`);
}

export async function deleteProductFileAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  const productId = text(formData, 'productId');
  const file = await prisma.productFile.findUnique({ where: { id } });
  if (file) {
    await prisma.productFile.delete({ where: { id } });
    const stillUsed = await prisma.mediaAsset.findUnique({
      where: { id: file.mediaId },
      include: { _count: { select: { productImages: true, productFiles: true, pages: true } } },
    });
    if (
      stillUsed &&
      stillUsed._count.productImages === 0 &&
      stillUsed._count.productFiles === 0 &&
      stillUsed._count.pages === 0
    ) {
      await deleteMedia(file.mediaId);
    }
    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'product.file.delete',
      entity: 'product',
      entityId: productId,
      meta: { fileId: id, fileName: file.fileName },
      ipHash: null,
    });
  }
  revalidatePath(`/admin/produtos/${productId}`);
  redirect(`/admin/produtos/${productId}?salvo=arquivo`);
}

export async function uploadPageCoverAction(formData: FormData): Promise<void> {
  const user = await guard();
  const pageId = text(formData, 'pageId');
  const file = formData.get('file');
  if (!pageId || !(file instanceof File) || file.size === 0) redirect(`/admin/paginas/${pageId}?erro=imagem`);

  try {
    const media = await saveMedia({ file, visibility: 'PUBLIC', allowed: 'image' });
    await prisma.page.update({ where: { id: pageId }, data: { coverMediaId: media.id } });
    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'page.cover.upload',
      entity: 'page',
      entityId: pageId,
      meta: { fileName: file.name },
    });
  } catch (error) {
    console.error('[admin] capa falhou', error);
    redirect(`/admin/paginas/${pageId}?erro=upload`);
  }

  revalidatePath(`/admin/paginas/${pageId}`);
  redirect(`/admin/paginas/${pageId}?salvo=1`);
}
