import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/forms';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Criar conta',
  robots: { index: false, follow: true },
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect('/minha-conta');

  return (
    <AuthShell
      eyebrow="Sua conta"
      title="Criar conta"
      description="Uma conta guarda sua biblioteca, seus pedidos e permite baixar os moldes de novo quando quiser."
      aside={
        <p className="text-[12.5px] leading-relaxed text-muted">
          Você também pode comprar como visitante e criar a senha depois, pelo link que chega no e-mail de
          confirmação.
        </p>
      }
    >
      <div className="space-y-4">
        <RegisterForm />
        <p className="text-center text-[12px] text-muted">
          Já tem conta?{' '}
          <Link href="/entrar" className="text-forest underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
