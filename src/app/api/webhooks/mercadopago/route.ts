import { notifyOrderPaid } from '@/lib/order-notifications';
import { markOrderFailed, markOrderPaid } from '@/lib/orders';
import { mercadoPagoGateway } from '@/lib/payments/mercadopago';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook do Mercado Pago.
 * Regras: assinatura verificada, evento único, valor conferido e pedido só muda para pago aqui.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  const verification = await mercadoPagoGateway.verifyWebhook(request.headers, rawBody);
  if (!verification.ok || !verification.paymentId) {
    console.warn('[webhook:mercadopago] assinatura rejeitada', verification.reason);
    return Response.json({ error: 'invalid_signature' }, { status: 401 });
  }

  const eventId = verification.eventId ?? `mp:${verification.paymentId}`;

  const existing = await prisma.paymentEvent.findUnique({ where: { externalId: eventId } });
  if (existing?.processedAt) {
    console.info('[webhook:mercadopago] evento já processado', eventId);
    return Response.json({ ok: true, duplicate: true });
  }

  if (!existing) {
    try {
      await prisma.paymentEvent.create({
        data: {
          gateway: 'mercadopago',
          externalId: eventId,
          type: 'payment',
          payload: rawBody.slice(0, 20000),
        },
      });
    } catch {
      // Corrida entre duas entregas: a outra requisição está processando.
      return Response.json({ ok: true, duplicate: true });
    }
  }

  try {
    const payment = await mercadoPagoGateway.getPayment(verification.paymentId);
    if (!payment) {
      await prisma.paymentEvent.update({
        where: { externalId: eventId },
        data: { processedAt: new Date() },
      });
      return Response.json({ ok: true, ignored: 'payment_not_found' });
    }

    const orderId = payment.externalReference;
    if (!orderId) {
      return Response.json({ ok: true, ignored: 'no_external_reference' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return Response.json({ ok: true, ignored: 'order_not_found' });
    }

    await prisma.paymentEvent.update({
      where: { externalId: eventId },
      data: { orderId: order.id },
    });

    if (payment.status === 'approved') {
      const result = await markOrderPaid({
        orderId: order.id,
        gateway: 'mercadopago',
        gatewayPaymentId: payment.id,
        amountCents: payment.amountCents,
        method: payment.method,
        statusDetail: payment.statusDetail ?? null,
      });

      if (!result.alreadyPaid) {
        await notifyOrderPaid(order.id);
      }
    } else if (payment.status === 'rejected' || payment.status === 'cancelled' || payment.status === 'expired') {
      await markOrderFailed({
        orderId: order.id,
        gateway: 'mercadopago',
        gatewayPaymentId: payment.id,
        status: payment.status === 'expired' ? 'EXPIRED' : payment.status === 'cancelled' ? 'CANCELED' : 'FAILED',
        detail: payment.statusDetail ?? payment.status,
      });
    }

    await prisma.paymentEvent.update({
      where: { externalId: eventId },
      data: { processedAt: new Date() },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[webhook:mercadopago] erro ao processar', eventId, error);
    // 500 faz o gateway reenviar; o evento duplicado será tratado na próxima tentativa.
    return Response.json({ error: 'processing_error' }, { status: 500 });
  }
}
