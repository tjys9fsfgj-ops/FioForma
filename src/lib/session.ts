import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from './prisma';
import { safeInternalPath } from './utils';

export type SessionUser = {
  id: string;
  name: string | null;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  passwordHash: string | null;
  phone: string | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, passwordHash: true, phone: true },
  });

  return user;
}

export async function requireUser(nextPath = '/minha-conta'): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/entrar?next=${encodeURIComponent(safeInternalPath(nextPath))}`);
  }
  return user;
}

export async function requireAdmin(nextPath = '/admin'): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/entrar?next=${encodeURIComponent(safeInternalPath(nextPath))}`);
  }
  if (user.role !== 'ADMIN') {
    redirect('/minha-conta');
  }
  return user;
}

export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return h.get('x-real-ip');
}
