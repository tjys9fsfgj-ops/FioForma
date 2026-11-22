import type { CheckoutMethod } from './payments/types';
import type { OrderStatus } from '@prisma/client';
import { prisma } from './prisma';
import { getCurrentUser } from './session';
import { orderNumber, randomToken } from './crypto';

export type CheckoutCustomer = {
  name: string;
  email: string;
  phone?: string | null;
};

export type CreateOrderInput = {
  cartId: string;
  customer: CheckoutCustomer;
  method: CheckoutMethod;
  couponCode?: string | null;
  discountCents: number;
  ipHash?: string | null;
};

export type CreatedOrder = {
  id: string;
  number: string;
  accessToken: string;
  totalCents: number;
};

/**
 * Cria o pedido pendente recalculando preços no servidor.
 * O carrinho nunca é fonte de preço: apenas de quais produtos foram escolhidos.
 */
export async function createPendingOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  const cart = await prisma.cart.findUnique({
    where: { id: input.cartId },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, slug: true, priceCents: true, status: true } } },
      },
    },
  });

  if (!cart) throw new Error('Carrinho não encontrado.');
  const items = cart.items.filter((item) => item.product.status === 'PUBLISHED');
  if (items.length === 0) throw new Error('Seu carrinho está vazio.');

  const subtotalCents = items.reduce((total, item) => total + item.product.priceCents, 0);
  const discountCents = Math.min(Math.max(input.discountCents, 0), subtotalCents);
  const totalCents = subtotalCents - discountCents;

  const email = input.customer.email.trim().toLowerCase();
  const sessionUser = await getCurrentUser();

  const user =
    sessionUser ??
    (await prisma.user.upsert({
      where: { email },
      create: { email, name: input.customer.name, phone: input.customer.phone ?? null },
      update: { name: input.customer.name },
    }));

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        number: orderNumber(),
        userId: user.id,
        email,
        customerName: input.customer.name,
        phone: input.customer.phone ?? null,
        status: 'PENDING',
        subtotalCents,
        discountCents,
        totalCents,
        couponCode: input.couponCode?.toUpperCase() ?? null,
        paymentMethod: input.method,
        accessToken: randomToken(24),
        ipHash: input.ipHash ?? null,
        items: {
          create: items.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            productSlug: item.product.slug,
            unitPriceCents: item.product.priceCents,
            quantity: 1,
            totalCents: item.product.priceCents,
          })),
        },
      },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  return {
    id: order.id,
    number: order.number,
    accessToken: order.accessToken,
    totalCents: order.totalCents,
  };
}

export type MarkPaidInput = {
  orderId: string;
  gateway: string;
  gatewayPaymentId: string;
  amountCents: number;
  method?: CheckoutMethod | null;
  statusDetail?: string | null;
};

export type MarkPaidResult = {
  alreadyPaid: boolean;
  orderNumber: string;
};

/**
 * Confirmação de pagamento: única porta de entrada para liberar arquivos.
 * Idempotente e protegida contra valor divergente.
 */
export async function markOrderPaid(input: MarkPaidInput): Promise<MarkPaidResult> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { items: true },
  });

  if (!order) throw new Error('Pedido não encontrado.');

  if (order.status === 'PAID') {
    return { alreadyPaid: true, orderNumber: order.number };
  }

  if (input.amountCents + 1 < order.totalCents) {
    throw new Error(
      `Valor pago (${input.amountCents}) menor que o total do pedido (${order.totalCents}).`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        gateway: input.gateway,
        gatewayRef: input.gatewayPaymentId,
        paymentMethod: input.method ?? order.paymentMethod,
      },
    });

    const existingPayment = await tx.payment.findFirst({
      where: { orderId: order.id, gateway: input.gateway, gatewayPaymentId: input.gatewayPaymentId },
    });

    if (existingPayment) {
      await tx.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: 'APPROVED',
          amountCents: input.amountCents,
          statusDetail: input.statusDetail ?? null,
          method: input.method ?? order.paymentMethod,
        },
      });
    } else {
      await tx.payment.create({
        data: {
          orderId: order.id,
          gateway: input.gateway,
          gatewayPaymentId: input.gatewayPaymentId,
          method: input.method ?? order.paymentMethod,
          status: 'APPROVED',
          amountCents: input.amountCents,
          statusDetail: input.statusDetail ?? null,
        },
      });
    }

    for (const item of order.items) {
      if (!item.productId) continue;
      const existing = await tx.entitlement.findUnique({
        where: { email_productId: { email: order.email, productId: item.productId } },
      });

      if (existing) {
        await tx.entitlement.update({
          where: { id: existing.id },
          data: {
            revokedAt: null,
            userId: existing.userId ?? order.userId,
            orderId: existing.orderId ?? order.id,
          },
        });
      } else {
        await tx.entitlement.create({
          data: {
            userId: order.userId,
            email: order.email,
            productId: item.productId,
            orderId: order.id,
          },
        });
      }
    }

    if (order.couponCode) {
      const coupon = await tx.coupon.findUnique({ where: { code: order.couponCode } });
      if (coupon) {
        const redemption = await tx.couponRedemption.findUnique({ where: { orderId: order.id } });
        if (!redemption) {
          await tx.couponRedemption.create({
            data: {
              couponId: coupon.id,
              orderId: order.id,
              userId: order.userId,
              email: order.email,
            },
          });
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { redemptionCount: { increment: 1 } },
          });
        }
      }
    }
  });

  return { alreadyPaid: false, orderNumber: order.number };
}

export async function markOrderFailed(input: {
  orderId: string;
  gateway: string;
  gatewayPaymentId?: string;
  status: OrderStatus;
  detail?: string | null;
}) {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order || order.status === 'PAID') return;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: input.status, gateway: input.gateway, gatewayRef: input.gatewayPaymentId ?? order.gatewayRef },
    }),
    prisma.payment.create({
      data: {
        orderId: order.id,
        gateway: input.gateway,
        gatewayPaymentId: input.gatewayPaymentId ?? null,
        method: order.paymentMethod,
        status: input.status === 'EXPIRED' ? 'EXPIRED' : 'REJECTED',
        amountCents: order.totalCents,
        statusDetail: input.detail ?? null,
      },
    }),
  ]);
}

export async function getOrderByNumber(number: string) {
  return prisma.order.findUnique({
    where: { number },
    include: {
      items: { include: { product: { include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } } } } },
      payments: { orderBy: { createdAt: 'desc' } },
      entitlements: true,
    },
  });
}

export type OrderView = NonNullable<Awaited<ReturnType<typeof getOrderByNumber>>>;

/** Autoriza ver o pedido: dono logado, token do pedido ou admin. */
export async function canViewOrder(order: OrderView, token?: string | null): Promise<boolean> {
  if (token && token === order.accessToken) return true;
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return user.email.toLowerCase() === order.email.toLowerCase();
}

export async function listOrdersForUser(userId: string, email: string) {
  return prisma.order.findMany({
    where: { OR: [{ userId }, { email: email.toLowerCase() }] },
    include: { items: true, entitlements: true },
    orderBy: { createdAt: 'desc' },
  });
}
