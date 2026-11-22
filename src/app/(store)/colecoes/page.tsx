import type { Metadata } from 'next';
import Link from 'next/link';
import { PatternPlaceholder } from '@/components/product/pattern-placeholder';
import { listCollections } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Coleções de moldes',
  description:
    'Coleções de moldes digitais de costura organizadas por ideia: peças que conversam entre si, com fichas técnicas completas.',
  alternates: { canonical: '/colecoes' },
};

export default async function CollectionsPage() {
  const collections = await listCollections();

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="eyebrow">Coleções</p>
        <h1 className="mt-3 text-[clamp(2rem,4.4vw,3.2rem)] leading-[1.05]">Moldes que conversam entre si.</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Cada coleção nasce de um mesmo gesto: um tecido, uma estação, uma forma de vestir. Comece por
          aqui e monte um guarda-roupa com coerência.
        </p>
      </header>

      {collections.length === 0 ? (
        <p className="rounded-2xl mt-12 border border-line bg-white px-6 py-12 text-center text-[14px] text-muted">
          As coleções estão sendo cadastradas. Enquanto isso, veja todos os{' '}
          <Link href="/catalogo" className="text-forest underline underline-offset-4">
            moldes disponíveis
          </Link>
          .
        </p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection, index) => (
            <Link
              key={collection.id}
              href={`/colecoes/${collection.slug}`}
              className="rounded-2xl group border border-line bg-white transition-colors hover:border-forest/40"
            >
              <div className="relative aspect-[4/5] overflow-hidden border-b border-line">
                <PatternPlaceholder label={collection.name} seed={index + 4} />
              </div>
              <div className="p-6">
                <h2 className="font-serif text-[24px] text-ink group-hover:text-forest">{collection.name}</h2>
                {collection.description ? (
                  <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-muted">
                    {collection.description}
                  </p>
                ) : null}
                <p className="mt-4 text-[11.5px] uppercase tracking-[0.12em] text-muted">
                  {collection._count.products} {collection._count.products === 1 ? 'molde' : 'moldes'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
