import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sha256 } from '@/lib/crypto';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'CUSTOMER' | 'ADMIN';
    } & DefaultSession['user'];
  }
  interface User {
    role?: 'CUSTOMER' | 'ADMIN';
  }
}

const secureCookies = process.env.COOKIE_SECURE !== 'false';

const secret =
  process.env.AUTH_SECRET ||
  process.env.SESSION_SECRET ||
  // Fallback de desenvolvimento/Preview: segredo do próprio projeto, apenas no servidor.
  process.env.MANUS_JWT_SECRET ||
  'fioforma-dev-secret-change-me';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: '/entrar', error: '/entrar' },
  cookies: {
    sessionToken: {
      name: 'fioforma_session',
      options: {
        httpOnly: true,
        sameSite: secureCookies ? 'none' : 'lax',
        path: '/',
        secure: secureCookies,
      },
    },
  },
  providers: [
    Credentials({
      id: 'credentials',
      name: 'E-mail e senha',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
    Credentials({
      id: 'access-link',
      name: 'Link de acesso',
      credentials: { token: { label: 'Token', type: 'text' } },
      async authorize(raw) {
        const token = typeof raw?.token === 'string' ? raw.token : '';
        if (!token || token.length < 20) return null;

        const record = await prisma.loginToken.findUnique({
          where: { tokenHash: sha256(token) },
          include: { user: true },
        });

        if (!record || record.usedAt || record.expiresAt < new Date()) return null;

        await prisma.loginToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
        await prisma.user.update({
          where: { id: record.userId },
          data: { lastLoginAt: new Date(), emailVerifiedAt: record.user.emailVerifiedAt ?? new Date() },
        });

        return {
          id: record.user.id,
          name: record.user.name,
          email: record.user.email,
          role: record.user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      const custom = token as typeof token & { id?: string; role?: 'CUSTOMER' | 'ADMIN' };
      if (user) {
        custom.id = user.id;
        custom.role = (user.role as 'CUSTOMER' | 'ADMIN') ?? 'CUSTOMER';
      }
      return custom;
    },
    session({ session, token }) {
      const custom = token as typeof token & { id?: string; role?: 'CUSTOMER' | 'ADMIN' };
      if (session.user) {
        session.user.id = custom.id ?? '';
        session.user.role = custom.role ?? 'CUSTOMER';
      }
      return session;
    },
  },
});
