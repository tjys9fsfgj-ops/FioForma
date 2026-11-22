import type { Metadata } from 'next';
import Link from 'next/link';
import { removeCartItemAction } from '@/app/actions/cart';
import { ButtonLink } from '@/components/ui/button';
import { PatternPlaceholder } from '@/components/product/pattern-placeholder';
import { getCart } from '@/lib/cart';
import { brl, priceLabel } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Carrinho',
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const cart = await getCart();

  if (cart.lines.length === 0) {
    return (
      <div className="container-page py-16 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <p className="eyebrow">Carrinho</p>
          <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.8rem)] leading-tight">Seu carrinho está vazio.</h1>
          <p className="mt-4 text-[14.5px] leading-relaxed text-muted">
            Comece pelos moldes mais recentes ou escolha uma coleção inteira. Todos os arquivos são digitais
            e chegam por download.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/catalogo">Explorar moldes</ButtonLink>
            <ButtonLink href="/colecoes" variant="outline">
              Ver coleções
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Carrinho</p>
          <h1 className="mt-2 text-[clamp(1.8rem,3.6vw,2.6rem)] leading-tight">Seus moldes</h1>
        </div>
        <Link href="/catalogo" className="rounded-full border border-wine/25 px-5 py-2.5 text-[13px] font-semibold text-wine hover:border-wine hover:bg-paper">
          Continuar comprando
        </Link>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
        <ul className="space-y-4">
          {cart.lines.map((line) => (
            <li key={line.itemId} className="flex gap-4 border border-line bg-paper p-4 shadow-paper sm:gap-6 sm:p-5">
              <Link
                href={`/produto/${line.slug}`}
                className="rounded-2xl relative aspect-[4/5] w-24 shrink-0 overflow-hidden border border-line bg-[#EFEDE6] sm:w-28"
              >
                {line.imageId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/media/${line.imageId}`} alt={line.name} className="h-full w-full object-cover" />
                ) : (
                  <PatternPlaceholder label="Molde" seed={0} />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div>
                  <Link href={`/produto/${line.slug}`} className="font-serif text-[19px] leading-snug text-ink hover:text-wine">
                    {line.name}
                  </Link>
                  {line.tagline ? (
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted">{line.tagline}</p>
                  ) : null}
                  {line.sizesIncluded.length ? (
                    <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-muted">
                      Tamanhos: {line.sizesIncluded.join(' · ')}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="font-serif text-[17px] text-wine">{priceLabel(line.priceCents)}</p>
                  <form action={removeCartItemAction}>
                    <input type="hidden" name="itemId" value={line.itemId} />
                    <button
                      type="submit"
                      className="text-[11.5px] text-muted underline decoration-line underline-offset-4 hover:text-wine"
                    >
                      Remover
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-line bg-paper p-6 shadow-paper sm:p-7">
            <h2 className="font-serif text-[22px] text-wine">Resumo</h2>
            <dl className="mt-5 space-y-3 text-[13.5px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{brl(cart.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Entrega</dt>
                <dd className="text-wine">Digital, imediata</dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-4 text-[15px]">
                <dt className="font-medium">Total</dt>
                <dd className="font-serif text-[19px] text-wine">{priceLabel(cart.subtotalCents)}</dd>
              </div>
            </dl>
            <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
              Ir para o checkout
            </ButtonLink>
            <p className="mt-3 text-center text-[11px] text-muted">Pix ou cartão · Ambiente seguro</p>
          </div>

          <div className="mt-5 space-y-2 text-[12px] leading-relaxed text-muted">
            <p>Os arquivos ficam disponíveis para download imediato após a confirmação do pagamento.</p>
            <p>
              Precisa de ajuda?{' '}
              <Link href="/contato" className="text-wine underline underline-offset-4">
                Fale com o ateliê
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
