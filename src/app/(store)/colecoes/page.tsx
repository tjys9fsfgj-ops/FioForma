import type { Metadata } from 'next';
import Link from 'next/link';
import { Mat } from '@/components/ui/mat';
import { listCollections } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Coleções de moldes',
  description:
    'Coleções de moldes digitais de costura organizadas por ideia: peças que conversam entre si, com fichas técnicas completas.',
  alternates: { canonical: '/colecoes' },
};

export default async function CollectionsPage() {
  const collections = (await listCollections()).filter((collection) => collection._count.products > 0);

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="border-b border-rule pb-10 text-center">
        <p className="eyebrow">Coleções</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-[clamp(2.2rem,4.6vw,3.4rem)] leading-[1.05]">Moldes que conversam entre si</h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
          Cada coleção nasce de um mesmo gesto: um tecido, uma estação, uma forma de vestir.
        </p>
      </header>

      {collections.length === 0 ? (
        <p className="mt-12 text-center text-[14px] text-muted">
          As coleções estão sendo montadas. Enquanto isso, veja todos os{' '}
          <Link href="/catalogo" className="text-wine underline underline-offset-4">
            moldes disponíveis
          </Link>
          .
        </p>
      ) : (
        <div className="mx-auto mt-12 flex max-w-5xl flex-wrap justify-center gap-x-6 gap-y-12">
          {collections.map((collection, index) => {
            const cover = collection.products[0]?.images[0]?.mediaId;
            return (
              <Link key={collection.id} href={`/colecoes/${collection.slug}`} className="group block w-full max-w-[320px] text-center sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                <Mat tone={index % 2 ? 'rosewood' : 'sand'}>
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/media/${cover}`} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </Mat>
                <h2 className="mt-4 text-[26px] group-hover:text-wine">{collection.name}</h2>
                {collection.description ? (
                  <p className="mx-auto mt-1 max-w-xs text-[14px] leading-relaxed text-muted">{collection.description}</p>
                ) : null}
                <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted-2">
                  {collection._count.products} {collection._count.products === 1 ? 'molde' : 'moldes'}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
