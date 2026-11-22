import Link from 'next/link';
import type { OrderStatus } from '@prisma/client';
import { AdminEmpty, AdminHeader, AdminTable, StatusPill } from '@/components/admin/ui';
import { brl, formatDateTime, orderStatusLabels } from '@/lib/format';
import { prisma } from '@/lib/prisma';

const statuses: OrderStatus[] = ['PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELED', 'REFUNDED'];

const tones: Record<OrderStatus, 'green' | 'amber' | 'gray' | 'red'> = {
  PENDING: 'amber',
  PAID: 'green',
  FAILED: 'red',
  EXPIRED: 'gray',
  CANCELED: 'gray',
  REFUNDED: 'red',
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const statusFilter = status && statuses.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q } },
            { email: { contains: q } },
            { customerName: { contains: q } },
          ],
        }
      : {}),
  };

  const [orders, totals] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.order.aggregate({
      where: { ...where, status: 'PAID' },
      _sum: { totalCents: true },
      _count: { _all: true },
    }),
  ]);

  const paidCount = await prisma.order.count({ where: { status: 'PAID' } });
  const pendingCount = await prisma.order.count({ where: { status: 'PENDING' } });

  return (
    <div>
      <AdminHeader
        eyebrow="Vendas"
        title="Pedidos"
        description="Um pedido só aparece como pago depois da confirmação do gateway. Confira os detalhes para liberar arquivos, reenviar e-mails ou registrar estornos."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Pedidos pagos</p>
          <p className="mt-1 font-serif text-[24px] text-forest">{paidCount}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Aguardando pagamento</p>
          <p className="mt-1 font-serif text-[24px] text-forest">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Receita no filtro atual</p>
          <p className="mt-1 font-serif text-[24px] text-forest">{brl(totals._sum.totalCents ?? 0)}</p>
          <p className="text-[10.5px] text-muted">{totals._count._all} {totals._count._all === 1 ? 'pedido pago' : 'pedidos pagos'}</p>
        </div>
      </div>

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="q" className="field-label">Buscar</label>
          <input id="q" name="q" defaultValue={q ?? ''} placeholder="Número, e-mail ou nome" className="field-input" />
        </div>
        <div>
          <label htmlFor="status" className="field-label">Situação</label>
          <select id="status" name="status" defaultValue={status ?? ''} className="field-input">
            <option value="">Todas</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {orderStatusLabels[value]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-full border border-line bg-white px-4 py-3 text-[12px] hover:border-forest">
          Filtrar
        </button>
      </form>

      {orders.length === 0 ? (
        <AdminEmpty
          title="Nenhum pedido encontrado"
          description="Quando a primeira venda acontecer, o pedido aparece aqui com status, pagamento e arquivos liberados."
        />
      ) : (
        <AdminTable head={['Pedido', 'Cliente', 'Itens', 'Total', 'Pagamento', 'Situação', 'Data', '']}>
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-[#FAF9F6]">
              <td className="px-4 py-3">
                <Link href={`/admin/pedidos/${order.id}`} className="font-medium text-forest hover:underline">
                  #{order.number}
                </Link>
              </td>
              <td className="px-4 py-3">
                <p className="text-ink">{order.customerName}</p>
                <p className="text-[10.5px] text-muted">{order.email}</p>
              </td>
              <td className="px-4 py-3 text-muted">{order.items.length}</td>
              <td className="px-4 py-3">{brl(order.totalCents)}</td>
              <td className="px-4 py-3 text-muted">
                {order.paymentMethod === 'PIX' ? 'Pix' : order.paymentMethod === 'CARD' ? 'Cartão' : '—'}
              </td>
              <td className="px-4 py-3">
                <StatusPill tone={tones[order.status]}>{orderStatusLabels[order.status]}</StatusPill>
              </td>
              <td className="px-4 py-3 text-muted">{formatDateTime(order.createdAt)}</td>
              <td className="px-4 py-3">
                <Link href={`/admin/pedidos/${order.id}`} className="text-[11px] text-forest underline underline-offset-4">
                  Abrir
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
      {orders.length === 100 ? (
        <p className="mt-3 text-[11px] text-muted">Mostrando os 100 pedidos mais recentes. Use a busca para localizar pedidos antigos.</p>
      ) : null}
    </div>
  );
}
