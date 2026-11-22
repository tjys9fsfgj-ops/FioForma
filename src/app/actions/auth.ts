'use server';

import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { signIn, signOut } from '@/auth';
import { sendAccessLinkEmail, sendPasswordResetEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp, getCurrentUser } from '@/lib/session';
import { getSiteUrl } from '@/lib/site';
import { randomToken, sha256 } from '@/lib/crypto';
import { safeInternalPath } from '@/lib/utils';

export type AuthState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
};

const emailSchema = z.string().trim().toLowerCase().email('Informe um e-mail válido.');

const passwordSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(100, 'A senha é muito longa.');

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = safeInternalPath(String(formData.get('next') ?? '/minha-conta'));

  const parsed = z.object({ email: emailSchema, password: z.string().min(1) }).safeParse({ email, password });
  if (!parsed.success) {
    return { status: 'error', message: 'Informe e-mail e senha.' };
  }

  const ip = await getClientIp();
  const limit = await rateLimit(`login:${ip ?? 'anon'}:${email}`, 8, 15 * 60);
  if (!limit.ok) {
    return { status: 'error', message: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' };
  }

  try {
    await signIn('credentials', { email, password, redirectTo: next });
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: 'error', message: 'E-mail ou senha incorretos.' };
    }
    throw error;
  }

  return { status: 'success' };
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    name: String(formData.get('name') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    password: String(formData.get('password') ?? ''),
    confirm: String(formData.get('confirm') ?? ''),
    terms: formData.get('terms'),
  };

  const fieldErrors: Record<string, string> = {};
  if (raw.name.length < 3) fieldErrors.name = 'Informe seu nome.';
  const emailParsed = emailSchema.safeParse(raw.email);
  if (!emailParsed.success) fieldErrors.email = emailParsed.error.issues[0]?.message ?? 'E-mail inválido.';
  const passwordParsed = passwordSchema.safeParse(raw.password);
  if (!passwordParsed.success) fieldErrors.password = passwordParsed.error.issues[0]?.message ?? 'Senha inválida.';
  if (raw.password !== raw.confirm) fieldErrors.confirm = 'As senhas não conferem.';
  if (raw.terms !== 'on') fieldErrors.terms = 'É preciso aceitar os termos e a privacidade.';

  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', message: 'Confira os campos destacados.', fieldErrors };
  }

  const ip = await getClientIp();
  const limit = await rateLimit(`register:${ip ?? 'anon'}`, 6, 60 * 60);
  if (!limit.ok) return { status: 'error', message: 'Muitas tentativas. Tente novamente mais tarde.' };

  const existing = await prisma.user.findUnique({ where: { email: raw.email } });
  if (existing?.passwordHash) {
    return {
      status: 'error',
      message: 'Já existe uma conta com este e-mail. Tente entrar ou recuperar a senha.',
    };
  }

  const passwordHash = await bcrypt.hash(raw.password, 12);

  await prisma.user.upsert({
    where: { email: raw.email },
    create: {
      email: raw.email,
      name: raw.name,
      passwordHash,
      emailVerifiedAt: new Date(),
      marketingOptIn: formData.get('newsletter') === 'on',
    },
    update: {
      name: raw.name,
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  try {
    await signIn('credentials', { email: raw.email, password: raw.password, redirectTo: '/minha-conta' });
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: 'success', message: 'Conta criada. Entre com seu e-mail e senha.' };
    }
    throw error;
  }

  return { status: 'success' };
}

export async function requestPasswordResetAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { status: 'error', message: 'Informe um e-mail válido.' };

  const ip = await getClientIp();
  const limit = await rateLimit(`reset:${ip ?? 'anon'}`, 5, 60 * 60);
  if (!limit.ok) return { status: 'error', message: 'Muitas solicitações. Tente novamente mais tarde.' };

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomToken(32);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const siteUrl = await getSiteUrl();
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: `${siteUrl}/redefinir-senha/${token}`,
    });
  }

  return {
    status: 'success',
    message: 'Se existir uma conta com este e-mail, enviamos um link para redefinir a senha.',
  };
}

export async function resetPasswordAction(token: string, formData: FormData): Promise<AuthState> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (password !== confirm) return { status: 'error', message: 'As senhas não conferem.' };
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Senha inválida.' };

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { status: 'error', message: 'Este link expirou. Solicite um novo.' };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash, emailVerifiedAt: new Date() } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id } },
    }),
  ]);

  redirect('/entrar?redefinida=1');
}

export async function guestAccessAction(formData: FormData): Promise<void> {
  const token = String(formData.get('token') ?? '');
  if (!token) redirect('/entrar');

  try {
    await signIn('access-link', { token, redirectTo: '/minha-conta/biblioteca' });
  } catch (error) {
    if (error instanceof AuthError) redirect('/acesso?erro=link');
    throw error;
  }
}

export async function setPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) return { status: 'error', message: 'Sua sessão expirou. Entre novamente.' };

  const current = String(formData.get('current') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (user.passwordHash) {
    const valid = await bcrypt.compare(current, user.passwordHash);
    if (!valid) return { status: 'error', message: 'A senha atual não confere.' };
  }

  if (password !== confirm) return { status: 'error', message: 'As senhas não conferem.' };
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Senha inválida.' };

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { status: 'success', message: 'Senha definida. Agora você pode entrar com e-mail e senha.' };
}

export async function updateProfileAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) return { status: 'error', message: 'Sua sessão expirou. Entre novamente.' };

  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const marketingOptIn = formData.get('newsletter') === 'on';

  if (name.length < 3) return { status: 'error', message: 'Informe seu nome.' };

  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone: phone || null, marketingOptIn },
  });

  return { status: 'success', message: 'Dados atualizados.' };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}

export async function requestAccessLinkAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { status: 'error', message: 'Informe um e-mail válido.' };

  const ip = await getClientIp();
  const limit = await rateLimit(`access:${ip ?? 'anon'}`, 5, 60 * 60);
  if (!limit.ok) return { status: 'error', message: 'Muitas solicitações. Tente novamente mais tarde.' };

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomToken(32);
    await prisma.loginToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        purpose: 'GUEST_ACCESS',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    const siteUrl = await getSiteUrl();
    await sendAccessLinkEmail({
      to: user.email,
      name: user.name,
      accessUrl: `${siteUrl}/acesso/${token}`,
    });
  }

  return {
    status: 'success',
    message: 'Se existir uma conta com este e-mail, enviamos um link de acesso válido por 7 dias.',
  };
}
