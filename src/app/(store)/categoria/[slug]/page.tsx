import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogView } from '@/components/catalog/catalog-view';
import type { CatalogParams } from '@/components/catalog/filters';
import { prisma } from '@/lib/prisma';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: 'Categoria não encontrada' };

  return {
    title: `Moldes de ${category.name.toLowerCase()}`,
    description:
      category.description ??
      `Moldes digitais de ${category.name.toLowerCase()} em PDF, do PP ao G, com tabela de medidas e ficha técnica.`,
    alternates: { canonical: `/categoria/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, raw] = await Promise.all([params, searchParams]);
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const query: CatalogParams = {
    q: first(raw.q),
    tamanho: first(raw.tamanho),
    dificuldade: first(raw.dificuldade),
    preco: first(raw.preco),
    ordem: first(raw.ordem),
    page: first(raw.page),
  };

  return (
    <CatalogView
      basePath={`/categoria/${category.slug}`}
      params={query}
      lockedCategory={category.slug}
      title={`Moldes de ${category.name.toLowerCase()}`}
      description={category.description ?? undefined}
    />
  );
}
