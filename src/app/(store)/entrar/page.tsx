import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/forms';
import { FormMessage } from '@/components/ui/field';
import { getCurrentUser } from '@/lib/session';
import { safeInternalPath } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Entrar',
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ next?: string; redefinida?: string; erro?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const [{ next, redefinida, erro }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const destination = safeInternalPath(next, '/minha-conta');
  if (user) redirect(destination);

  return (
    <AuthShell
      eyebrow="Sua conta"
      title="Entrar"
      description="Acesse sua biblioteca de moldes, baixe de novo e acompanhe seus pedidos."
      aside={
        <p className="text-[12.5px] leading-relaxed text-muted">
          Comprou como visitante? Use o link que enviamos por e-mail ou{' '}
          <Link href="/acesso" className="text-wine underline underline-offset-4">
            peça um novo link de acesso
          </Link>
          .
        </p>
      }
    >
      <div className="space-y-4">
        {redefinida ? <FormMessage tone="success">Senha alterada. Entre com a nova senha.</FormMessage> : null}
        {erro ? <FormMessage>Não foi possível concluir. Tente novamente.</FormMessage> : null}
        <LoginForm next={destination} />
        <p className="text-center text-[12px] text-muted">
          Ainda não tem conta?{' '}
          <Link href="/criar-conta" className="text-wine underline underline-offset-4">
            Criar conta
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
