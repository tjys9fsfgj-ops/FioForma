import type { Difficulty, Prisma } from '@prisma/client';
import { prisma } from './prisma';

export const PRODUCTS_PER_PAGE = 12;

export type CatalogFilters = {
  q?: string;
  colecao?: string;
  categoria?: string;
  tamanho?: string;
  dificuldade?: string;
  preco?: string;
  ordem?: string;
  page?: number;
};

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  priceCents: number;
  compareAtCents: number | null;
  difficulty: Difficulty;
  sizesIncluded: string[];
  imageId: string | null;
  imageAlt: string | null;
  collectionName: string | null;
  categoryName: string | null;
  formats: string[];
  modelNumber: string | null;
  createdAt: Date;
};

const cardInclude = {
  images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
  collection: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  spec: { select: { includedFormats: true } },
} satisfies Prisma.ProductInclude;

type ProductWithCardRelations = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export function toCard(product: ProductWithCardRelations): ProductCardData {
  let sizes: string[] = [];
  try {
    sizes = product.sizesIncluded ? (JSON.parse(product.sizesIncluded) as string[]) : [];
  } catch {
    sizes = [];
  }
  let formats: string[] = [];
  try {
    formats = product.spec?.includedFormats ? (JSON.parse(product.spec.includedFormats) as string[]) : [];
  } catch {
    formats = [];
  }
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    priceCents: product.priceCents,
    compareAtCents: product.compareAtCents,
    difficulty: product.difficulty,
    sizesIncluded: sizes,
    imageId: product.images[0]?.mediaId ?? null,
    imageAlt: product.images[0]?.alt ?? null,
    collectionName: product.collection?.name ?? null,
    categoryName: product.category?.name ?? null,
    formats,
    modelNumber: product.modelNumber,
    createdAt: product.createdAt,
  };
}

const PRICE_RANGES: Record<string, { min?: number; max?: number }> = {
  'ate-12': { max: 1200 },
  '12-16': { min: 1200, max: 1600 },
  '16-20': { min: 1600, max: 2000 },
  'acima-20': { min: 2000 },
};

export function buildCatalogWhere(filters: CatalogFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { status: 'PUBLISHED' };

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { name: { contains: q } },
      { tagline: { contains: q } },
      { description: { contains: q } },
      { category: { is: { name: { contains: q } } } },
      { collection: { is: { name: { contains: q } } } },
    ];
  }

  if (filters.colecao) where.collection = { is: { slug: filters.colecao } };
  if (filters.categoria) where.category = { is: { slug: filters.categoria } };

  if (filters.tamanho && ['PP', 'P', 'M', 'G'].includes(filters.tamanho)) {
    where.sizesIncluded = { contains: `"${filters.tamanho}"` };
  }

  if (filters.dificuldade && ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'].includes(filters.dificuldade)) {
    where.difficulty = filters.dificuldade as Difficulty;
  }

  if (filters.preco && PRICE_RANGES[filters.preco]) {
    const range = PRICE_RANGES[filters.preco];
    where.priceCents = {
      ...(range.min !== undefined ? { gte: range.min } : {}),
      ...(range.max !== undefined ? { lt: range.max } : {}),
    };
  }

  return where;
}

function orderByFor(sort: string | undefined): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'preco-asc':
      return [{ priceCents: 'asc' }, { name: 'asc' }];
    case 'preco-desc':
      return [{ priceCents: 'desc' }, { name: 'asc' }];
    case 'nome':
      return [{ name: 'asc' }];
    case 'novidades':
    default:
      return [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
  }
}

export async function listProducts(filters: CatalogFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where = buildCatalogWhere(filters);

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: cardInclude,
      orderBy: orderByFor(filters.ordem),
      skip: (page - 1) * PRODUCTS_PER_PAGE,
      take: PRODUCTS_PER_PAGE,
    }),
  ]);

  return {
    items: products.map(toCard),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)),
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      spec: true,
      sizeCharts: { orderBy: { sortOrder: 'asc' }, include: { rows: { orderBy: { sortOrder: 'asc' } } } },
      files: { orderBy: { format: 'asc' } },
      category: true,
      collection: true,
    },
  });
}

export type FullProduct = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getRelatedProducts(product: FullProduct, limit = 4) {
  const products = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: product.id },
      OR: [
        ...(product.categoryId ? [{ categoryId: product.categoryId }] : []),
        ...(product.collectionId ? [{ collectionId: product.collectionId }] : []),
      ],
    },
    include: cardInclude,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });

  if (products.length >= limit) return products.map(toCard);

  const fallback = await prisma.product.findMany({
    where: { status: 'PUBLISHED', id: { notIn: [product.id, ...products.map((p) => p.id)] } },
    include: cardInclude,
    orderBy: { publishedAt: 'desc' },
    take: limit - products.length,
  });

  return [...products, ...fallback].map(toCard);
}

export async function getLatestProducts(limit = 4) {
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    include: cardInclude,
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });
  return products.map(toCard);
}

export async function listCollections() {
  return prisma.collection.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: { where: { status: 'PUBLISHED' } } } } },
  });
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: { where: { status: 'PUBLISHED' } } } } },
  });
}

export async function getProductSlugs() {
  return prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });
}
