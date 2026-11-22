'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCart } from '@/lib/cart';
import { validateCoupon } from '@/lib/coupons';
import { createPendingOrder, markOrderPaid } from '@/lib/orders';
import { getGateway, isPaymentReady, PAYMENT_NOT_READY_MESSAGE } from '@/lib/payments';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp, getCurrentUser } from '@/lib/session';
import { COUPON_COOKIE } from '@/lib/checkout-cookies';
import { getSiteUrl } from '@/lib/site';
import { hashIp } from '@/lib/crypto';
import { safeInternalPath } from '@/lib/utils';


function cookieOptions() {
  const secure = process.env.COOKIE_SECURE !== 'false';
  return {
    httpOnly: true,
    sameSite: (secure ? 'none' : 'lax') as 'none' | 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 2,
  };
}

export type CouponState = { status: 'idle' | 'success' | 'error'; message?: string };

export async function applyCouponAction(
  _prev: CouponState,
  formData: FormData,
): Promise<CouponState> {
  const code = String(formData.get('coupon') ?? '').trim();
  const cart = await getCart();

  if (cart.lines.length === 0) return { status: 'error', message: 'Seu carrinho está vazio.' };
  if (!code) return { status: 'error', message: 'Informe o código do cupom.' };

  const result = await validateCoupon(code, cart.subtotalCents);
  if (!result.ok || !result.coupon) {
    return { status: 'error', message: result.message ?? 'Cupom inválido.' };
  }

  const store = await cookies();
  store.set(COUPON_COOKIE, result.coupon.code, cookieOptions());
  return { status: 'success', message: `Cupom aplicado: ${result.coupon.code}.` };
}

export async function removeCouponAction(): Promise<void> {
  const store = await cookies();
  store.delete(COUPON_COOKIE);
  revalidatePath('/checkout');
  redirect('/checkout');
}

export type CheckoutState = {
  status: 'idle' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
};

const checkoutSchema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
  phone: z.string().trim().max(32).optional().or(z.literal('')),
  method: z.enum(['PIX', 'CARD']),
  terms: z.string().refine((value) => value === 'on', { message: 'É preciso aceitar os termos e a licença.' }),
});

export async function startCheckoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    method: formData.get('method'),
    terms: formData.get('terms'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const field = String(issue.path[0] ?? 'form');
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    });
    return { status: 'error', message: 'Confira os campos destacados.', fieldErrors };
  }

  const ip = await getClientIp();
  const limit = await rateLimit(`checkout:${ip ?? 'anon'}`, 10, 60 * 10);
  if (!limit.ok) {
    return { status: 'error', message: 'Muitas tentativas de checkout. Aguarde alguns minutos.' };
  }

  const cart = await getCart();
  if (cart.lines.length === 0 || !cart.id) {
    return { status: 'error', message: 'Seu carrinho está vazio.' };
  }

  const store = await cookies();
  const couponCode = store.get(COUPON_COOKIE)?.value;
  let discountCents = 0;

  if (couponCode) {
    const coupon = await validateCoupon(couponCode, cart.subtotalCents);
    if (coupon.ok) discountCents = coupon.discountCents;
  }

  if (cart.subtotalCents - discountCents > 0 && !isPaymentReady()) {
    return { status: 'error', message: PAYMENT_NOT_READY_MESSAGE };
  }

  const user = await getCurrentUser();
  const customer = {
    name: parsed.data.name,
    email: user?.email ?? parsed.data.email,
    phone: parsed.data.phone || null,
  };

  let order;
  try {
    order = await createPendingOrder({
      cartId: cart.id,
      customer,
      method: parsed.data.method,
      couponCode: discountCents > 0 ? couponCode : null,
      discountCents,
      ipHash: hashIp(ip),
    });
  } catch (error) {
    console.error('[checkout] falha ao criar pedido', error);
    return { status: 'error', message: 'Não foi possível criar o pedido. Tente novamente.' };
  }

  const siteUrl = await getSiteUrl();

  if (order.totalCents === 0) {
    await markOrderPaid({
      orderId: order.id,
      gateway: 'coupon',
      gatewayPaymentId: `coupon-${order.id}`,
      amountCents: 0,
      method: parsed.data.method,
      statusDetail: 'Pedido coberto por cupom',
    });
    store.delete(COUPON_COOKIE);
    redirect(`/pedido/${order.number}?t=${order.accessToken}`);
  }

  try {
    const gateway = getGateway();
    const payment = await gateway.createPayment({
      order: {
        id: order.id,
        number: order.number,
        totalCents: order.totalCents,
        email: customer.email,
        customerName: customer.name,
        accessToken: order.accessToken,
      },
      method: parsed.data.method,
      siteUrl,
    });

    store.delete(COUPON_COOKIE);

    if (payment.kind === 'redirect') {
      redirect(safeInternalPath(payment.url, payment.url));
    }

    redirect(`/pedido/${order.number}?t=${order.accessToken}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
    console.error('[checkout] falha no gateway', error);
    return {
      status: 'error',
      message:
        'O pedido foi criado, mas o pagamento não pôde ser iniciado. Abra seus pedidos e tente novamente.',
    };
  }
}
