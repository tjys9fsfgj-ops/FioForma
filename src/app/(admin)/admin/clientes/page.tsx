import Link from 'next/link';
import { AdminEmpty, AdminHeader, AdminTable, StatusPill } from '@/components/admin/ui';
import { brl, formatDate } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const users = await prisma.user.findMany({
    where: q
      ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] }
      : undefined,
    include: {
      orders: { where: { status: 'PAID' }, select: { totalCents: true } },
      entitlements: { where: { revokedAt: null }, select: { id: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div>
      <AdminHeader
        eyebrow="Pessoas"
        title="Clientes"
        description="Toda compra cria um cadastro, mesmo como visitante. Quem comprou pode definir senha depois pelo link enviado por e-mail."
      />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <label htmlFor="q" className="field-label">Buscar</label>
          <input id="q" name="q" defaultValue={q ?? ''} placeholder="Nome ou e-mail" className="field-input" />
        </div>
        <button type="submit" className="rounded-full border border-line bg-white px-4 py-3 text-[12px] hover:border-forest">
          Buscar
        </button>
      </form>

      {users.length === 0 ? (
        <AdminEmpty title="Nenhum cliente encontrado" description="Os clientes aparecem aqui após a primeira compra ou cadastro." />
      ) : (
        <AdminTable head={['Cliente', 'Pedidos', 'Total gasto', 'Moldes liberados', 'Newsletter', 'Cadastro', '']}>
          {users.map((user) => {
            const total = user.orders.reduce((sum, order) => sum + order.totalCents, 0);
            return (
              <tr key={user.id} className="hover:bg-[#FAF9F6]">
                <td className="px-4 py-3">
                  <p className="text-ink">{user.name ?? 'Sem nome'}</p>
                  <p className="text-[10.5px] text-muted">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  {user._count.orders}
                  {user.orders.length > 0 ? <span className="text-[10.5px] text-muted"> ({user.orders.length} pagos)</span> : null}
                </td>
                <td className="px-4 py-3">{brl(total)}</td>
                <td className="px-4 py-3">{user.entitlements.length}</td>
                <td className="px-4 py-3">
                  {user.marketingOptIn ? <StatusPill tone="green">Sim</StatusPill> : <span className="text-muted">—</span>}
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos?q=${encodeURIComponent(user.email)}`} className="text-[11px] text-forest underline underline-offset-4">
                    Pedidos
                  </Link>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      )}
      <p className="mt-3 text-[11px] text-muted">
        Dados pessoais são tratados conforme a LGPD. Use apenas para atendimento e obrigações fiscais.
      </p>
    </div>
  );
}
