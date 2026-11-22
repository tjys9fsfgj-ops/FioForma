'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAudit } from '@/lib/audit';
import { notifyOrderPaid } from '@/lib/order-notifications';
import { markOrderPaid } from '@/lib/orders';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') throw new Error('Acesso negado.');
  return user;
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

/** Marca um pedido como pago manualmente (Pix recebido fora do gateway, cortesia etc.). */
export async function markPaidManuallyAction(formData: FormData): Promise<void> {
  const user = await guard();
  const orderId = text(formData, 'orderId');
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) redirect('/admin/pedidos?erro=nao-encontrado');

  try {
    await markOrderPaid({
      orderId,
      gateway: 'manual',
      gatewayPaymentId: `manual-${Date.now()}`,
      amountCents: order.totalCents,
      statusDetail: text(formData, 'note') || 'Confirmado manualmente pelo painel',
    });
    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'order.mark_paid_manual',
      entity: 'order',
      entityId: orderId,
      meta: { number: order.number },
    });
    await notifyOrderPaid(orderId);
  } catch (error) {
    console.error('[admin] falha ao marcar pedido como pago', orderId, error);
    redirect(`/admin/pedidos/${orderId}?erro=pagamento`);
  }

  revalidatePath('/admin/pedidos');
  revalidatePath(`/admin/pedidos/${orderId}`);
  redirect(`/admin/pedidos/${orderId}?ok=pago`);
}

export async function cancelOrderAction(formData: FormData): Promise<void> {
  const user = await guard();
  const orderId = text(formData, 'orderId');
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) redirect('/admin/pedidos?erro=nao-encontrado');
  if (order.status === 'PAID') redirect(`/admin/pedidos/${orderId}?erro=estornar`);

  await prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELED' } });
  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'order.cancel',
    entity: 'order',
    entityId: orderId,
    meta: { number: order.number },
  });

  revalidatePath('/admin/pedidos');
  redirect(`/admin/pedidos/${orderId}?ok=cancelado`);
}

/**
 * Reembolso registrado manualmente. O estorno financeiro precisa ser feito no painel
 * do Mercado Pago; aqui registramos o ocorrido e revogamos o acesso aos arquivos.
 */
export async function refundOrderAction(formData: FormData): Promise<void> {
  const user = await guard();
  const orderId = text(formData, 'orderId');
  const note = text(formData, 'note');
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) redirect('/admin/pedidos?erro=nao-encontrado');

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: 'REFUNDED' } });
    await tx.entitlement.updateMany({ where: { orderId }, data: { revokedAt: new Date() } });
    if (order.gatewayRef) {
      await tx.payment.updateMany({
        where: { orderId, gatewayPaymentId: order.gatewayRef },
        data: { status: 'REFUNDED', statusDetail: note || 'Reembolso registrado no painel' },
      });
    }
  });

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'order.refund',
    entity: 'order',
    entityId: orderId,
    meta: { number: order.number, note },
  });

  revalidatePath('/admin/pedidos');
  redirect(`/admin/pedidos/${orderId}?ok=reembolsado`);
}

export async function resendOrderEmailAction(formData: FormData): Promise<void> {
  await guard();
  const orderId = text(formData, 'orderId');
  await notifyOrderPaid(orderId);
  revalidatePath(`/admin/pedidos/${orderId}`);
  redirect(`/admin/pedidos/${orderId}?ok=email`);
}

export async function addOrderNoteAction(formData: FormData): Promise<void> {
  const user = await guard();
  const orderId = text(formData, 'orderId');
  const note = text(formData, 'note');
  if (!note) redirect(`/admin/pedidos/${orderId}?erro=nota`);

  await prisma.order.update({ where: { id: orderId }, data: { internalNote: note } });
  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'order.note',
    entity: 'order',
    entityId: orderId,
    meta: { note },
  });
  redirect(`/admin/pedidos/${orderId}?ok=nota`);
}
