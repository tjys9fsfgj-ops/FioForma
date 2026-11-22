import Link from 'next/link';
import { AdminCard, AdminEmpty, AdminHeader, AdminTable, StatCard, StatusPill } from '@/components/admin/ui';
import { ButtonLink } from '@/components/ui/button';
import { brl, formatDate, orderStatusLabels, productStatusLabels } from '@/lib/format';
import { isDemoPaymentMode } from '@/lib/payments';
import { prisma } from '@/lib/prisma';

export default async function AdminDashboardPage() {
  const now = new Date();
  const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [paidAgg, paid30Agg, ordersCount, pendingCount, customersCount, products, recentOrders, topItems, audit] =
    await Promise.all([
      prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { totalCents: true }, _count: true }),
      prisma.order.aggregate({
        where: { status: 'PAID', paidAt: { gte: start30 } },
        _sum: { totalCents: true },
        _count: true,
      }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } },
      }),
      prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { items: true } }),
      prisma.orderItem.groupBy({
        by: ['productName'],
        _sum: { totalCents: true },
        _count: true,
        orderBy: { _sum: { totalCents: 'desc' } },
        take: 5,
      }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
    ]);

  const revenue = paidAgg._sum.totalCents ?? 0;
  const revenue30 = paid30Agg._sum.totalCents ?? 0;
  const averageTicket = paidAgg._count > 0 ? Math.round(revenue / paidAgg._count) : 0;
  const demo = isDemoPaymentMode();

  return (
    <div>
      <AdminHeader
        eyebrow="Painel"
        title="Visão geral"
        description="Acompanhe vendas, pedidos e o estado do catálogo. Os valores consideram apenas pedidos com pagamento confirmado."
        action={
          <>
            <ButtonLink href="/admin/produtos/novo" size="sm">
              Novo molde
            </ButtonLink>
            <ButtonLink href="/admin/pedidos" size="sm" variant="outline">
              Pedidos
            </ButtonLink>
          </>
        }
      />

      {demo ? (
        <div className="mb-6 border border-[#D9C9A3] bg-[#FBF6E8] px-4 py-3 text-[12px] leading-relaxed text-[#6B5320]">
          <strong className="font-medium">Pagamentos em modo demonstração.</strong> Nenhuma cobrança real está
          ativa. Configure <code className="bg-white/60 px-1">PAYMENT_GATEWAY=mercadopago</code> e as chaves do
          Mercado Pago para vender de verdade.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Receita confirmada" value={brl(revenue)} hint={`${paidAgg._count} ${paidAgg._count === 1 ? 'pedido pago' : 'pedidos pagos'}`} />
        <StatCard label="Últimos 30 dias" value={brl(revenue30)} hint={`${paid30Agg._count} ${paid30Agg._count === 1 ? 'pedido pago' : 'pedidos pagos'}`} />
        <StatCard label="Ticket médio" value={brl(averageTicket)} hint={`${ordersCount} pedidos no total`} />
        <StatCard
          label="Aguardando pagamento"
          value={String(pendingCount)}
          hint="Pedidos pendentes"
          href="/admin/pedidos?status=PENDING"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <AdminCard>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-serif text-[18px] text-forest">Pedidos recentes</h2>
            <Link href="/admin/pedidos" className="text-[11.5px] text-forest underline underline-offset-4">
              Ver todos
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-5">
              <AdminEmpty title="Nenhum pedido ainda" description="Os pedidos aparecem aqui assim que a loja começar a vender." />
            </div>
          ) : (
            <AdminTable head={['Pedido', 'Cliente', 'Data', 'Total', 'Status']}>
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAF9F6]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pedidos/${order.id}`} className="font-medium text-forest hover:underline">
                      {order.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-ink">{order.customerName}</p>
                    <p className="text-[10.5px] text-muted">{order.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">{brl(order.totalCents)}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={order.status === 'PAID' ? 'green' : order.status === 'PENDING' ? 'amber' : 'gray'}>
                      {orderStatusLabels[order.status]}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </AdminTable>
          )}
        </AdminCard>

        <div className="space-y-6">
          <AdminCard>
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-serif text-[18px] text-forest">Mais vendidos</h2>
            </div>
            {topItems.length === 0 ? (
              <p className="px-5 py-6 text-[12.5px] text-muted">Sem vendas registradas.</p>
            ) : (
              <ul className="divide-y divide-line">
                {topItems.map((item) => (
                  <li key={item.productName} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="text-[12.5px] text-ink">{item.productName}</p>
                      <p className="text-[10.5px] text-muted">{item._count} {item._count === 1 ? 'venda' : 'vendas'}</p>
                    </div>
                    <p className="text-[12px] text-forest">{brl(item._sum.totalCents ?? 0)}</p>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard>
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-serif text-[18px] text-forest">Catálogo</h2>
            </div>
            {products.length === 0 ? (
              <div className="p-5">
                <p className="text-[12.5px] text-muted">
                  Nenhum molde cadastrado. Comece criando o primeiro produto.
                </p>
                <Link href="/admin/produtos/novo" className="mt-3 inline-block text-[12px] text-forest underline underline-offset-4">
                  Criar molde
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {products.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <Link href={`/admin/produtos/${product.id}`} className="block truncate text-[12.5px] text-ink hover:text-forest">
                        {product.name}
                      </Link>
                      <p className="text-[10.5px] text-muted">
                        {productStatusLabels[product.status]} · {brl(product.priceCents)}
                      </p>
                    </div>
                    <StatusPill tone={product.status === 'PUBLISHED' ? 'green' : 'gray'}>
                      {product.status === 'PUBLISHED' ? 'No ar' : 'Rascunho'}
                    </StatusPill>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <AdminCard className="xl:col-span-2">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-serif text-[18px] text-forest">Últimas ações</h2>
          </div>
          {audit.length === 0 ? (
            <p className="px-5 py-6 text-[12.5px] text-muted">Nenhuma ação registrada.</p>
          ) : (
            <ul className="divide-y divide-line">
              {audit.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-[11.5px]">
                  <span className="text-ink/80">
                    <strong className="font-medium text-ink">{entry.action}</strong> · {entry.entity}
                    {entry.entityId ? ` ${entry.entityId.slice(0, 8)}` : ''}
                  </span>
                  <span className="text-muted">
                    {entry.actorEmail ?? 'sistema'} · {formatDate(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard>
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-serif text-[18px] text-forest">Atalhos</h2>
          </div>
          <ul className="divide-y divide-line text-[12.5px]">
            {[
              { href: '/admin/produtos/novo', label: 'Cadastrar molde' },
              { href: '/admin/colecoes', label: 'Organizar coleções' },
              { href: '/admin/cupons', label: 'Criar cupom' },
              { href: '/admin/paginas', label: 'Editar páginas e blog' },
              { href: '/admin/relatorios', label: 'Ver relatórios' },
              { href: '/admin/clientes', label: `Clientes (${customersCount})` },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block px-5 py-2.5 text-ink/80 hover:text-forest">
                  {item.label} →
                </Link>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>
    </div>
  );
}
