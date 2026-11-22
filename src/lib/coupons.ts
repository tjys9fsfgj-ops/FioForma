import type { Coupon } from '@prisma/client';
import { prisma } from './prisma';

export type CouponResult = {
  ok: boolean;
  coupon?: Coupon;
  discountCents: number;
  message?: string;
};

export async function validateCoupon(code: string, subtotalCents: number): Promise<CouponResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, discountCents: 0, message: 'Informe um cupom.' };

  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  if (!coupon || !coupon.active) {
    return { ok: false, discountCents: 0, message: 'Cupom inválido ou expirado.' };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, discountCents: 0, message: 'Este cupom ainda não está válido.' };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { ok: false, discountCents: 0, message: 'Este cupom expirou.' };
  }
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { ok: false, discountCents: 0, message: 'Este cupom atingiu o limite de usos.' };
  }
  if (coupon.minSubtotalCents !== null && subtotalCents < coupon.minSubtotalCents) {
    return {
      ok: false,
      discountCents: 0,
      message: `O cupom vale a partir de R$ ${(coupon.minSubtotalCents / 100).toFixed(2).replace('.', ',')}.`,
    };
  }

  const rawDiscount =
    coupon.type === 'PERCENT'
      ? Math.round((subtotalCents * coupon.value) / 100)
      : coupon.value;

  const discountCents = Math.min(Math.max(rawDiscount, 0), subtotalCents);
  if (discountCents <= 0) return { ok: false, discountCents: 0, message: 'Cupom sem desconto aplicável.' };

  return { ok: true, coupon, discountCents };
}
