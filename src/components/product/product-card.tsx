import Link from 'next/link';
import type { ProductCardData } from '@/lib/products';
import { brl, difficultyLabels, formatModelNumber } from '@/lib/format';
import { Mat } from '@/components/ui/mat';

export function priceLabel(cents: number) {
  return cents === 0 ? 'Grátis' : brl(cents);
}

export function ProductCard({ product, index = 0 }: { product: ProductCardData; index?: number }) {
  const sizes =
    product.sizesIncluded.length > 1
      ? `${product.sizesIncluded[0]}–${product.sizesIncluded[product.sizesIncluded.length - 1]}`
      : product.sizesIncluded[0] === 'Único'
        ? 'Tamanho único'
        : (product.sizesIncluded[0] ?? difficultyLabels[product.difficulty]);
  const onSale = product.compareAtCents && product.compareAtCents > product.priceCents;
  const model = formatModelNumber(product.modelNumber);

  return (
    <article className="group text-center">
      <Link href={`/produto/${product.slug}`} className="block focus-visible:outline-none">
        <Mat tone={index % 2 === 1 ? 'rosewood' : 'sand'} className="transition-shadow group-hover:shadow-[0_2px_10px_rgba(58,46,42,0.12)]">
          {product.imageId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/media/${product.imageId}`}
              alt={product.imageAlt ?? product.name}
              loading={index < 4 ? 'eager' : 'lazy'}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center font-serif text-[18px] italic text-muted">
              {product.categoryName ?? 'Molde'}
            </span>
          )}
          {onSale ? (
            <span className="absolute right-2 top-2 bg-wine px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-paper">
              Oferta
            </span>
          ) : null}
        </Mat>

        <div className="mt-4 space-y-1">
          {model ? <p className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-wine">{model}</p> : null}
          <h3 className="text-[19px] leading-snug text-ink decoration-rule underline-offset-4 group-hover:underline">
            {product.name}
          </h3>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-2">
            {priceLabel(product.priceCents)}
            {onSale ? <span className="ml-1.5 line-through">{brl(product.compareAtCents ?? 0)}</span> : null}
            {sizes ? ` · ${sizes}` : ''}
          </p>
        </div>
      </Link>
    </article>
  );
}
