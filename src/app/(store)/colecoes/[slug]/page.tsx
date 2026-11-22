import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogView } from '@/components/catalog/catalog-view';
import type { CatalogParams } from '@/components/catalog/filters';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await prisma.collection.findUnique({ where: { slug } });
  if (!collection) return { title: 'Coleção não encontrada' };

  return {
    title: collection.name,
    description:
      collection.description ??
      `Moldes digitais da coleção ${collection.name}, com ficha técnica e tabela de medidas.`,
    alternates: { canonical: `/colecoes/${collection.slug}` },
    openGraph: {
      title: `${collection.name} · moldes digitais`,
      description: collection.description ?? undefined,
      url: `/colecoes/${collection.slug}`,
    },
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const [{ slug }, raw, settings] = await Promise.all([params, searchParams, getSettings()]);
  const collection = await prisma.collection.findFirst({ where: { slug, published: true } });
  if (!collection) notFound();

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
      basePath={`/colecoes/${collection.slug}`}
      params={query}
      lockedCollection={collection.slug}
      title={collection.name}
      description={collection.description ?? `Moldes da coleção ${collection.name}, por ${settings.storeName}.`}
    />
  );
}
