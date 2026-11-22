import Link from 'next/link';
import { AdminCard, AdminHeader, AdminTable, StatCard } from '@/components/admin/ui';
import { brl, formatDate } from '@/lib/format';
import { prisma } from '@/lib/prisma';

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '');
}

export default async function AdminReportsPage() {
  const now = new Date();
  const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const start6m = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [paid30, all30, paidAll, revenue30, downloads30, newCustomers, subscribers, topItems, monthly, recent] =
    await Promise.all([
      prisma.order.count({ where: { status: 'PAID', paidAt: { gte: start30 } } }),
      prisma.order.count({ where: { createdAt: { gte: start30 } } }),
      prisma.order.count({ where: { status: 'PAID' } }),
      prisma.order.aggregate({ where: { status: 'PAID', paidAt: { gte: start30 } }, _sum: { totalCents: true } }),
      prisma.downloadLog.count({ where: { createdAt: { gte: start30 } } }),
      prisma.user.count({ where: { createdAt: { gte: start30 } } }),
      prisma.user.count({ where: { marketingOptIn: true } }),
      prisma.orderItem.groupBy({
        by: ['productName', 'productId'],
        where: { order: { status: 'PAID' } },
        _sum: { totalCents: true, quantity: true },
        orderBy: { _sum: { totalCents: 'desc' } },
        take: 6,
      }),
      prisma.order.findMany({
        where: { status: 'PAID', paidAt: { gte: start6m } },
        select: { paidAt: true, totalCents: true },
      }),
      prisma.order.findMany({
        where: { status: 'PAID' },
        orderBy: { paidAt: 'desc' },
        take: 8,
        include: { items: true },
      }),
    ]);

  const revenue = revenue30._sum.totalCents ?? 0;
  const ticket = paid30 > 0 ? Math.round(revenue / paid30) : 0;
  const conversion = all30 > 0 ? Math.round((paid30 / all30) * 100) : 0;

  const buckets = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const total = monthly
      .filter((order) => order.paidAt && order.paidAt.getMonth() === date.getMonth() && order.paidAt.getFullYear() === date.getFullYear())
      .reduce((sum, order) => sum + order.totalCents, 0);
    return { label: monthLabel(date), total };
  });
  const maxBucket = Math.max(...buckets.map((bucket) => bucket.total), 1);

  return (
    <div>
      <AdminHeader
        eyebrow="Visão geral"
        title="Relatórios"
        description="Leitura rápida dos últimos 30 dias e do acumulado. Dados calculados direto dos pedidos confirmados, sem métricas infladas."
        action={
          <a href="/api/admin/export/orders" className="rounded-full border border-line bg-paper px-4 py-2 text-[12px] hover:border-wine">
            Exportar pedidos (CSV)
          </a>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Receita (30 dias)" value={brl(revenue)} hint={`${paid30} ${paid30 === 1 ? 'pedido pago' : 'pedidos pagos'}`} />
        <StatCard label="Ticket médio" value={brl(ticket)} hint="pedidos pagos em 30 dias" />
        <StatCard label="Conversão" value={`${conversion}%`} hint={`${paid30} de ${all30} pedidos criados`} />
        <StatCard label="Pedidos pagos (total)" value={String(paidAll)} hint="desde o início da loja" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <AdminCard>
          <div className="border-b border-line px-5 py-3">
            <h2 className="font-serif text-[17px] text-wine">Receita por mês</h2>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-end gap-3" style={{ height: 168 }}>
              {buckets.map((bucket) => (
                <div key={bucket.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="w-full bg-wine/85"
                    style={{ height: Math.max(Math.round((bucket.total / maxBucket) * 136), bucket.total > 0 ? 6 : 2) }}
                    title={`${bucket.label}: ${brl(bucket.total)}`}
                  />
                  <span className="text-[10px] text-muted">{bucket.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10.5px] text-muted">
              Últimos 6 meses. Valores em pedidos com pagamento confirmado.
            </p>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="border-b border-line px-5 py-3">
            <h2 className="font-serif text-[17px] text-wine">Moldes que mais vendem</h2>
          </div>
          {topItems.length === 0 ? (
            <p className="px-5 py-6 text-[12px] text-muted">Sem vendas confirmadas ainda.</p>
          ) : (
            <ol className="divide-y divide-line">
              {topItems.map((item, index) => (
                <li key={`${item.productId}-${index}`} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="flex items-center gap-3 text-[12px]">
                    <span className="font-serif text-[15px] text-muted">{index + 1}</span>
                    {item.productId ? (
                      <Link href={`/admin/produtos/${item.productId}`} className="hover:text-wine">
                        {item.productName}
                      </Link>
                    ) : (
                      item.productName
                    )}
                  </span>
                  <span className="whitespace-nowrap text-[11.5px] text-muted">
                    {item._sum.quantity ?? 0} un · {brl(item._sum.totalCents ?? 0)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </AdminCard>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Downloads (30 dias)" value={String(downloads30)} hint="arquivos entregues na biblioteca" />
        <StatCard label="Novos clientes (30 dias)" value={String(newCustomers)} hint="cadastros criados" />
        <StatCard label="Newsletter" value={String(subscribers)} hint="contatos com opt-in" />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-serif text-[19px] text-wine">Últimos pedidos pagos</h2>
          <Link href="/admin/pedidos?status=PAID" className="text-[11.5px] text-muted underline underline-offset-4 hover:text-wine">
            Ver todos
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-2xl border border-line bg-paper px-5 py-8 text-[12.5px] text-muted">Nenhum pedido pago ainda.</p>
        ) : (
          <AdminTable head={['Pedido', 'Cliente', 'Itens', 'Total', 'Pago em']}>
            {recent.map((order) => (
              <tr key={order.id} className="hover:bg-[#FAF9F6]">
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${order.id}`} className="text-wine hover:underline">
                    #{order.number}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p>{order.customerName}</p>
                  <p className="text-[10.5px] text-muted">{order.email}</p>
                </td>
                <td className="px-4 py-3 text-muted">{order.items.length}</td>
                <td className="px-4 py-3">{brl(order.totalCents)}</td>
                <td className="px-4 py-3 text-muted">{order.paidAt ? formatDate(order.paidAt) : '—'}</td>
              </tr>
            ))}
          </AdminTable>
        )}
      </div>
    </div>
  );
}
