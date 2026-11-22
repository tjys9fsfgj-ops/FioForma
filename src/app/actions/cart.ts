'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addToCart, getOrCreateCart, removeFromCart } from '@/lib/cart';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/session';

export async function addToCartAction(formData: FormData) {
  const productId = String(formData.get('productId') ?? '');
  if (!productId) redirect('/catalogo');

  const ip = await getClientIp();
  const limit = await rateLimit(`cart:${ip ?? 'anon'}`, 60, 60 * 10);
  if (!limit.ok) redirect('/carrinho?erro=limite');

  await getOrCreateCart();
  const result = await addToCart(productId);

  revalidatePath('/carrinho');
  revalidatePath('/catalogo');
  revalidatePath('/produto');

  if (!result.ok) redirect(`/carrinho?erro=${encodeURIComponent(result.message ?? 'indisponivel')}`);
  redirect('/carrinho');
}

export async function removeCartItemAction(formData: FormData) {
  const itemId = String(formData.get('itemId') ?? '');
  if (itemId) await removeFromCart(itemId);
  revalidatePath('/carrinho');
  redirect('/carrinho');
}
