'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAudit } from '@/lib/audit';
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

function intOrNull(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateOrNull(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function saveCouponAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  const code = text(formData, 'code').toUpperCase().replace(/\s+/g, '');
  const type = text(formData, 'type') === 'FIXED' ? 'FIXED' : 'PERCENT';
  const rawValue = text(formData, 'value').replace(',', '.');
  const numericValue = type === 'PERCENT' ? Math.round(Number.parseFloat(rawValue)) : Math.round(Number.parseFloat(rawValue) * 100);

  if (!code || !Number.isFinite(numericValue) || numericValue <= 0) {
    redirect('/admin/cupons?erro=dados');
  }
  if (type === 'PERCENT' && numericValue > 100) {
    redirect('/admin/cupons?erro=percentual');
  }

  const data = {
    code,
    type: type as 'PERCENT' | 'FIXED',
    value: numericValue,
    minSubtotalCents: (() => {
      const min = text(formData, 'minSubtotal').replace(',', '.');
      if (!min) return null;
      const cents = Math.round(Number.parseFloat(min) * 100);
      return Number.isFinite(cents) ? cents : null;
    })(),
    maxRedemptions: intOrNull(text(formData, 'maxRedemptions')),
    startsAt: dateOrNull(text(formData, 'startsAt')),
    endsAt: dateOrNull(text(formData, 'endsAt')),
    active: formData.get('active') === 'on',
  };

  try {
    if (id) {
      await prisma.coupon.update({ where: { id }, data });
      await logAudit({ actorId: user.id, actorEmail: user.email, action: 'coupon.update', entity: 'coupon', entityId: id, meta: { code } });
    } else {
      const created = await prisma.coupon.create({ data });
      await logAudit({ actorId: user.id, actorEmail: user.email, action: 'coupon.create', entity: 'coupon', entityId: created.id, meta: { code } });
    }
  } catch (error) {
    console.error('[admin] falha ao salvar cupom', error);
    redirect('/admin/cupons?erro=duplicado');
  }

  revalidatePath('/admin/cupons');
  redirect('/admin/cupons?salvo=1');
}

export async function toggleCouponAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) redirect('/admin/cupons');

  await prisma.coupon.update({ where: { id }, data: { active: !coupon.active } });
  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: coupon.active ? 'coupon.disable' : 'coupon.enable',
    entity: 'coupon',
    entityId: id,
    meta: { code: coupon.code },
  });
  revalidatePath('/admin/cupons');
  redirect('/admin/cupons?salvo=1');
}

export async function deleteCouponAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  const coupon = await prisma.coupon.findUnique({ where: { id }, include: { _count: { select: { redemptions: true } } } });
  if (!coupon) redirect('/admin/cupons');

  if (coupon._count.redemptions > 0) {
    await prisma.coupon.update({ where: { id }, data: { active: false } });
  } else {
    await prisma.coupon.delete({ where: { id } });
  }

  await logAudit({ actorId: user.id, actorEmail: user.email, action: 'coupon.delete', entity: 'coupon', entityId: id, meta: { code: coupon.code } });
  revalidatePath('/admin/cupons');
  redirect('/admin/cupons?salvo=1');
}
