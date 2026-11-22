'use server';

import { redirect } from 'next/navigation';
import { notifyOrderPaid } from '@/lib/order-notifications';
import { markOrderFailed, markOrderPaid } from '@/lib/orders';
import { isDemoPaymentMode } from '@/lib/payments';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/session';

async function loadOrder(formData: FormData) {
  if (!isDemoPaymentMode()) throw new Error('Pagamento de demonstração desativado.');

  const number = String(formData.get('number') ?? '');
  const token = String(formData.get('token') ?? '');
  if (!number || !token) return null;

  const order = await prisma.order.findUnique({ where: { number } });
  if (!order || order.accessToken !== token) return null;
  return order;
}

export async function approveDemoPayment(formData: FormData): Promise<void> {
  const order = await loadOrder(formData);
  if (!order) redirect('/');

  const ip = await getClientIp();
  const limit = await rateLimit(`demo-pay:${ip ?? 'anon'}`, 20, 60 * 10);
  if (!limit.ok) redirect(`/pedido/${order.number}?t=${order.accessToken}`);

  if (order.status !== 'PAID') {
    await markOrderPaid({
      orderId: order.id,
      gateway: 'simulator',
      gatewayPaymentId: `demo-${order.id}`,
      amountCents: order.totalCents,
      method: order.paymentMethod ?? 'PIX',
      statusDetail: 'Aprovação simulada (ambiente de demonstração)',
    });
    await notifyOrderPaid(order.id);
  }

  redirect(`/pedido/${order.number}?t=${order.accessToken}`);
}

export async function rejectDemoPayment(formData: FormData): Promise<void> {
  const order = await loadOrder(formData);
  if (!order) redirect('/');

  if (order.status === 'PENDING') {
    await markOrderFailed({
      orderId: order.id,
      gateway: 'simulator',
      status: 'FAILED',
      detail: 'Recusa simulada (ambiente de demonstração)',
    });
  }

  redirect(`/pedido/${order.number}?t=${order.accessToken}`);
}
