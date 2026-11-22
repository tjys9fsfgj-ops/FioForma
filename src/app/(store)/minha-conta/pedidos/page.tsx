import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { brl, formatDate, orderStatusLabels } from '@/lib/format';
import { listOrdersForUser } from '@/lib/orders';
import { requireUser } from '@/lib/session';

export default async function OrdersPage() {
  const user = await requireUser('/minha-conta/pedidos');
  const orders = await listOrdersForUser(user.id, user.email);

  return (
    <div>
      <h1 className="text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight">Pedidos</h1>
      <p className="mt-2 text-[14px] text-muted">Histórico de compras e situação de cada pagamento.</p>

      {orders.length === 0 ? (
        <div className="rounded-2xl mt-8 border border-line bg-paper px-6 py-12 text-center">
          <p className="font-serif text-[22px] text-wine">Nenhum pedido ainda.</p>
          <Link href="/catalogo" className="rounded-full mt-4 inline-block border border-wine bg-wine px-5 py-2.5 text-[13px] text-paper">
            Explorar moldes
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-[18px] text-ink">{order.number}</p>
                  <p className="mt-0.5 text-[11.5px] text-muted">{formatDate(order.createdAt)}</p>
                </div>
                <Badge tone={order.status === 'PAID' ? 'wine' : 'neutral'}>{orderStatusLabels[order.status]}</Badge>
              </div>

              <ul className="mt-3 space-y-1 text-[13px] text-ink/80">
                {order.items.map((item) => (
                  <li key={item.id}>{item.productName}</li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <p className="text-[13.5px]">
                  Total <span className="font-serif text-[16px] text-wine">{brl(order.totalCents)}</span>
                </p>
                <div className="flex gap-3">
                  {order.status === 'PAID' ? (
                    <Link href="/minha-conta/biblioteca" className="text-[12px] text-wine underline underline-offset-4">
                      Baixar arquivos
                    </Link>
                  ) : null}
                  <Link href={`/pedido/${order.number}`} className="text-[12px] text-wine underline underline-offset-4">
                    Ver pedido
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
