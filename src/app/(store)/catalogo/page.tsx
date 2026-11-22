import type { Metadata } from 'next';
import { CatalogView } from '@/components/catalog/catalog-view';
import type { CatalogParams } from '@/components/catalog/filters';
import { brand } from '@/config/brand';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const raw = await searchParams;
  const q = first(raw.q);
  const page = Number(first(raw.page) ?? '1');

  return {
    title: q ? `Busca: ${q}` : 'Moldes de costura em PDF',
    description:
      'Catálogo de moldes digitais de costura em PDF, dos tamanhos PP ao G, com tabela de medidas, ficha técnica e arquivos para imprimir em casa.',
    alternates: { canonical: q ? '/catalogo' : '/catalogo' },
    robots: q || page > 1 ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: `Moldes de costura em PDF · ${brand.name}`,
      description: 'Moldes digitais com ficha técnica completa, do PP ao G.',
      url: '/catalogo',
    },
  };
}

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const params: CatalogParams = {
    q: first(raw.q),
    colecao: first(raw.colecao),
    categoria: first(raw.categoria),
    tamanho: first(raw.tamanho),
    dificuldade: first(raw.dificuldade),
    preco: first(raw.preco),
    ordem: first(raw.ordem),
    page: first(raw.page),
  };

  return (
    <CatalogView
      basePath="/catalogo"
      params={params}
      title="Moldes de costura em PDF"
      description="Peças completas, com tabela de medidas do corpo, metragem por tamanho e arquivos prontos para imprimir. Escolha por coleção, categoria ou tamanho."
    />
  );
}
