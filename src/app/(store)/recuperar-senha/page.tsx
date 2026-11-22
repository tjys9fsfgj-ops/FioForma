import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { ForgotPasswordForm } from '@/components/auth/forms';

export const metadata: Metadata = {
  title: 'Recuperar senha',
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Acesso"
      title="Recuperar senha"
      description="Informe o e-mail da conta. Enviamos um link válido por 1 hora para você criar uma nova senha."
    >
      <div className="space-y-4">
        <ForgotPasswordForm />
        <p className="text-center text-[12px] text-muted">
          <Link href="/entrar" className="text-forest underline underline-offset-4">
            Voltar para o login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
