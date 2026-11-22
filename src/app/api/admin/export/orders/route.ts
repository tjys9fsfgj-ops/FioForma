import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

function escapeCsv(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return new Response('Acesso negado.', { status: 403 });
  }

  const orders = await prisma.order.findMany({
    include: { items: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const header = [
    'numero',
    'criado_em',
    'pago_em',
    'status',
    'cliente',
    'email',
    'telefone',
    'metodo',
    'gateway',
    'referencia_gateway',
    'cupom',
    'subtotal',
    'desconto',
    'total',
    'itens',
  ];

  const lines = [header.map(escapeCsv).join(';')];

  for (const order of orders) {
    lines.push(
      [
        order.number,
        order.createdAt.toISOString(),
        order.paidAt?.toISOString() ?? '',
        order.status,
        order.customerName,
        order.email,
        order.phone ?? '',
        order.paymentMethod ?? '',
        order.gateway ?? '',
        order.gatewayRef ?? '',
        order.couponCode ?? '',
        (order.subtotalCents / 100).toFixed(2).replace('.', ','),
        (order.discountCents / 100).toFixed(2).replace('.', ','),
        (order.totalCents / 100).toFixed(2).replace('.', ','),
        order.items.map((item) => item.productName).join(' | '),
      ]
        .map(escapeCsv)
        .join(';'),
    );
  }

  const csv = `\uFEFF${lines.join('\r\n')}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="fioforma-pedidos-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
