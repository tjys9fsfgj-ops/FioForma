import Link from 'next/link';
import type { ProductCardData } from '@/lib/products';
import { brl, difficultyLabels } from '@/lib/format';
import { PatternPlaceholder } from './pattern-placeholder';

export function ProductCard({ product, index = 0 }: { product: ProductCardData; index?: number }) {
  const sizes = product.sizesIncluded.length
    ? `${product.sizesIncluded[0]}–${product.sizesIncluded[product.sizesIncluded.length - 1]}`
    : null;
  const onSale = product.compareAtCents && product.compareAtCents > product.priceCents;

  return (
    <article className="group">
      <Link href={`/produto/${product.slug}`} className="block focus-visible:outline-none">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-cream ring-1 ring-line transition-shadow duration-300 group-hover:shadow-float">
          {product.imageId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/media/${product.imageId}`}
              alt={product.imageAlt ?? product.name}
              loading={index < 4 ? 'eager' : 'lazy'}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <PatternPlaceholder label={product.categoryName ?? 'Foto da peça'} seed={index} />
          )}

          {product.formats.length ? (
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10.5px] font-semibold text-ink/75 backdrop-blur">
              {product.formats.includes('A4') ? 'A4' : product.formats[0]}
              {product.formats.includes('A0') ? ' · A0' : ''}
            </span>
          ) : null}

          {onSale ? (
            <span className="absolute right-3 top-3 rounded-full bg-clay px-3 py-1 text-[10.5px] font-semibold text-white">
              Oferta
            </span>
          ) : null}

          <span
            aria-hidden="true"
            className="absolute inset-x-3 bottom-3 translate-y-2 rounded-full bg-forest px-4 py-2.5 text-center text-[12.5px] font-semibold text-paper opacity-0 shadow-float transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
          >
            Ver molde →
          </span>
        </div>

        <div className="mt-4 space-y-1.5 px-1">
          {product.collectionName ? <p className="text-[11.5px] font-semibold text-clay">{product.collectionName}</p> : null}
          <h3 className="font-serif text-[20px] leading-snug text-ink transition-colors group-hover:text-forest">
            {product.name}
          </h3>
          {product.tagline ? <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">{product.tagline}</p> : null}
          <div className="flex items-center justify-between gap-3 pt-1.5">
            <p className="flex items-baseline gap-2 font-serif text-[18px] text-forest">
              {brl(product.priceCents)}
              {onSale ? (
                <span className="font-sans text-[12px] text-muted line-through">{brl(product.compareAtCents ?? 0)}</span>
              ) : null}
            </p>
            <p className="rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-medium text-forest">
              {sizes ? `Tam. ${sizes}` : difficultyLabels[product.difficulty]}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
