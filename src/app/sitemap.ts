import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getSiteUrl();

  const [products, collections, categories, posts, pages] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.collection.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ where: { kind: 'POST', status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ where: { kind: 'PAGE', status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/colecoes`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/guias`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/sobre`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contato`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/licenca`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/reembolso`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/termos`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacidade`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  return [
    ...staticRoutes,
    ...products.map((product) => ({
      url: `${base}/produto/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...collections.map((collection) => ({
      url: `${base}/colecoes/${collection.slug}`,
      lastModified: collection.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...categories.map((category) => ({
      url: `${base}/categoria/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    ...pages.map((page) => ({
      url: `${base}/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
  ];
}
