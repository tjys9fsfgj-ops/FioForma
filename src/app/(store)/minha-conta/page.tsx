import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { getLibrary } from '@/lib/entitlements';
import { brl, formatDate, orderStatusLabels } from '@/lib/format';
import { listOrdersForUser } from '@/lib/orders';
import { requireUser } from '@/lib/session';

export default async function AccountOverviewPage() {
  const user = await requireUser();
  const [library, orders] = await Promise.all([getLibrary(user), listOrdersForUser(user.id, user.email)]);

  const paidOrders = orders.filter((order) => order.status === 'PAID');
  const lastOrder = orders[0];

  return (
    <div>
      <h1 className="text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight">Olá, {user.name?.split(' ')[0] ?? 'tudo bem'}.</h1>
      <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-muted">
        Aqui ficam seus moldes, seus pedidos e seus dados. O download é ilimitado: pode baixar de novo
        sempre que for costurar.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="eyebrow text-[10px]">Moldes na biblioteca</p>
          <p className="mt-2 font-serif text-[34px] text-forest">{library.length}</p>
          <Link href="/minha-conta/biblioteca" className="mt-2 inline-block text-[12px] text-forest underline underline-offset-4">
            Ver biblioteca
          </Link>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="eyebrow text-[10px]">Pedidos pagos</p>
          <p className="mt-2 font-serif text-[34px] text-forest">{paidOrders.length}</p>
          <Link href="/minha-conta/pedidos" className="mt-2 inline-block text-[12px] text-forest underline underline-offset-4">
            Ver pedidos
          </Link>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="eyebrow text-[10px]">Última compra</p>
          <p className="mt-2 font-serif text-[18px] text-forest">
            {lastOrder ? formatDate(lastOrder.createdAt) : '—'}
          </p>
          {lastOrder ? (
            <p className="mt-1 text-[11.5px] text-muted">{orderStatusLabels[lastOrder.status]}</p>
          ) : (
            <p className="mt-1 text-[11.5px] text-muted">Nenhuma compra ainda</p>
          )}
        </div>
      </div>

      {library.length === 0 ? (
        <div className="rounded-2xl mt-8 border border-line bg-white px-6 py-10 text-center">
          <p className="font-serif text-[22px] text-forest">Sua biblioteca está vazia.</p>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
            Escolha um molde no catálogo. Assim que o pagamento for confirmado, ele aparece aqui.
          </p>
          <ButtonLink href="/catalogo" className="mt-5">
            Explorar moldes
          </ButtonLink>
        </div>
      ) : (
        <section className="mt-8">
          <h2 className="font-serif text-[21px] text-forest">Continuar de onde parou</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {library.slice(0, 3).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <Link href={`/produto/${item.product.slug}`} className="text-[14px] font-medium hover:text-forest">
                    {item.product.name}
                  </Link>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    {item.product.files.length} {item.product.files.length === 1 ? 'arquivo' : 'arquivos'} ·{' '}
                    {item.order ? `pedido ${item.order.number}` : 'compra avulsa'}
                  </p>
                </div>
                <Link
                  href="/minha-conta/biblioteca"
                  className="rounded-full shrink-0 border border-line px-3 py-1.5 text-[11.5px] hover:border-forest hover:text-forest"
                >
                  Baixar
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lastOrder && lastOrder.status === 'PENDING' ? (
        <div className="mt-8 border border-[#D9C9A3] bg-[#FBF6E8] p-5 text-[12.5px] leading-relaxed text-[#6B5320]">
          O pedido <strong>{lastOrder.number}</strong> está aguardando pagamento ({brl(lastOrder.totalCents)}).{' '}
          <Link href={`/pedido/${lastOrder.number}`} className="underline underline-offset-4">
            Ver detalhes
          </Link>
          .
        </div>
      ) : null}
    </div>
  );
}
