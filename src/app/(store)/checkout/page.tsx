import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { COUPON_COOKIE } from '@/lib/checkout-cookies';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { CouponForm } from '@/components/checkout/coupon-form';
import { getCart } from '@/lib/cart';
import { validateCoupon } from '@/lib/coupons';
import { brl } from '@/lib/format';
import { isDemoPaymentMode } from '@/lib/payments';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [cart, user] = await Promise.all([getCart(), getCurrentUser()]);
  if (cart.lines.length === 0) redirect('/carrinho');

  const store = await cookies();
  const couponCode = store.get(COUPON_COOKIE)?.value;
  const coupon = couponCode ? await validateCoupon(couponCode, cart.subtotalCents) : null;
  const appliedCode = coupon?.ok ? coupon.coupon?.code : undefined;
  const discountCents = coupon?.ok ? coupon.discountCents : 0;
  const totalCents = Math.max(cart.subtotalCents - discountCents, 0);

  return (
    <div className="container-page py-10 sm:py-14">
      <header>
        <p className="pill">Checkout</p>
        <h1 className="mt-4 text-[clamp(1.9rem,3.8vw,2.8rem)] leading-tight">Finalizar compra</h1>
        <p className="mt-2 text-[13px] text-muted">
          Compra segura. Você recebe os arquivos por download assim que o pagamento for confirmado.
        </p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div>
          <CheckoutForm
            defaultName={user?.name ?? undefined}
            defaultEmail={user?.email}
            defaultPhone={user?.phone ?? undefined}
            isLoggedIn={Boolean(user)}
            demo={isDemoPaymentMode()}
          />
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-line bg-paper p-6 shadow-paper sm:p-7">
            <h2 className="font-serif text-[22px] text-wine">Seu pedido</h2>
            <ul className="mt-4 divide-y divide-line/70">
              {cart.lines.map((line) => (
                <li key={line.itemId} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium leading-snug text-ink">{line.name}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted">PDF · download imediato</p>
                  </div>
                  <p className="shrink-0 text-[13px]">{brl(line.priceCents)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-line pt-4">
              <CouponForm appliedCode={appliedCode} />
            </div>

            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{brl(cart.subtotalCents)}</dd>
              </div>
              {discountCents > 0 ? (
                <div className="flex justify-between text-wine">
                  <dt>Desconto</dt>
                  <dd>− {brl(discountCents)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-line pt-2 text-[15px]">
                <dt className="font-medium">Total</dt>
                <dd className="font-serif text-[20px] text-wine">{brl(totalCents)}</dd>
              </div>
            </dl>

            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              Ao continuar, você aceita os{' '}
              <Link href="/termos" className="underline underline-offset-4">
                termos
              </Link>{' '}
              e a{' '}
              <Link href="/licenca" className="underline underline-offset-4">
                licença de uso
              </Link>
              . Reembolso conforme a política vigente.
            </p>
          </div>

          <div className="mt-5 rounded-2xl bg-sand p-5 text-[12px] leading-relaxed text-wine/80">
            <p className="font-medium text-ink">Depois do pagamento</p>
            <p className="mt-1">
              Você é levado a uma página de confirmação e recebe um e-mail com o link da sua biblioteca. O
              download é ilimitado.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
