import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { randomToken } from './crypto';
import { getCurrentUser } from './session';

export const CART_COOKIE = 'ff_cart';
const CART_MAX_AGE = 60 * 60 * 24 * 30;

function cookieOptions() {
  const secure = process.env.COOKIE_SECURE !== 'false';
  return {
    httpOnly: true,
    sameSite: (secure ? 'none' : 'lax') as 'none' | 'lax',
    secure,
    path: '/',
    maxAge: CART_MAX_AGE,
  };
}

export async function readCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/** Só pode ser chamado em Server Action ou Route Handler (escreve cookie). */
export async function getOrCreateCart(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  const user = await getCurrentUser();

  if (existing) {
    const cart = await prisma.cart.findUnique({ where: { token: existing } });
    if (cart) {
      if (user && !cart.userId) {
        await prisma.cart.update({ where: { id: cart.id }, data: { userId: user.id } });
      }
      return cart.id;
    }
  }

  const token = randomToken(24);
  const cart = await prisma.cart.create({
    data: { token, userId: user?.id ?? null },
  });
  store.set(CART_COOKIE, token, cookieOptions());
  return cart.id;
}

export type CartLine = {
  itemId: string;
  productId: string;
  slug: string;
  name: string;
  tagline: string | null;
  priceCents: number;
  quantity: number;
  totalCents: number;
  imageId: string | null;
  sizesIncluded: string[];
};

export type CartView = {
  id: string | null;
  lines: CartLine[];
  count: number;
  subtotalCents: number;
};

const emptyCart: CartView = { id: null, lines: [], count: 0, subtotalCents: 0 };

export async function getCart(): Promise<CartView> {
  const token = await readCartToken();
  if (!token) return emptyCart;

  const cart = await prisma.cart.findUnique({
    where: { token },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!cart) return emptyCart;

  const lines: CartLine[] = cart.items
    .filter((item) => item.product.status === 'PUBLISHED')
    .map((item) => {
      let sizes: string[] = [];
      try {
        sizes = item.product.sizesIncluded ? (JSON.parse(item.product.sizesIncluded) as string[]) : [];
      } catch {
        sizes = [];
      }
      return {
        itemId: item.id,
        productId: item.productId,
        slug: item.product.slug,
        name: item.product.name,
        tagline: item.product.tagline,
        priceCents: item.product.priceCents,
        quantity: 1,
        totalCents: item.product.priceCents,
        imageId: item.product.images[0]?.mediaId ?? null,
        sizesIncluded: sizes,
      };
    });

  return {
    id: cart.id,
    lines,
    count: lines.length,
    subtotalCents: lines.reduce((total, line) => total + line.totalCents, 0),
  };
}

export async function addToCart(productId: string): Promise<{ ok: boolean; message?: string }> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== 'PUBLISHED') {
    return { ok: false, message: 'Este molde não está disponível.' };
  }

  const cartId = await getOrCreateCart();
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    create: { cartId, productId, quantity: 1 },
    update: {},
  });

  return { ok: true };
}

export async function removeFromCart(itemId: string): Promise<void> {
  const cartId = await getOrCreateCart();
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
}

export async function clearCart(cartId: string): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { cartId } });
}
