import { prisma } from './prisma';
import { sendOrderPaidEmail } from './email';
import { getSiteUrl } from './site';
import { randomToken, sha256 } from './crypto';

/** Envia o e-mail de pedido pago e, para visitantes, um link de acesso de uso único. */
export async function notifyOrderPaid(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });
  if (!order) return;

  const siteUrl = await getSiteUrl();
  const isGuest = !order.user?.passwordHash;

  let accessUrl: string | undefined;
  if (isGuest) {
    const token = randomToken(32);
    await prisma.loginToken.create({
      data: {
        userId: order.userId ?? (await ensureUser(order.email, order.customerName)),
        tokenHash: sha256(token),
        purpose: 'GUEST_ACCESS',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    accessUrl = `${siteUrl}/acesso/${token}`;
  }

  try {
    await sendOrderPaidEmail({
      to: order.email,
      customerName: order.customerName,
      orderNumber: order.number,
      totalCents: order.totalCents,
      items: order.items.map((item) => ({ name: item.productName, priceCents: item.unitPriceCents })),
      libraryUrl: `${siteUrl}/minha-conta/biblioteca`,
      accessUrl,
      isGuest,
    });
  } catch (error) {
    console.error('[email] falha ao enviar confirmação do pedido', order.number, error);
  }
}

async function ensureUser(email: string, name: string): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name },
    update: {},
  });
  return user.id;
}
