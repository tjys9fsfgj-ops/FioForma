import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { ResetPasswordForm } from '@/components/auth/forms';
import { prisma } from '@/lib/prisma';
import { sha256 } from '@/lib/crypto';

export const metadata: Metadata = {
  title: 'Criar nova senha',
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(token) },
  });

  const valid = record && !record.usedAt && record.expiresAt > new Date();

  return (
    <AuthShell
      eyebrow="Acesso"
      title={valid ? 'Criar nova senha' : 'Link expirado'}
      description={
        valid
          ? 'Escolha uma senha com pelo menos 8 caracteres. Depois de salvar, você já pode entrar.'
          : 'Este link já foi usado ou passou do prazo. Solicite um novo para continuar.'
      }
    >
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4">
          <p className="text-[13.5px] leading-relaxed text-muted">
            Por segurança, links de redefinição valem por 1 hora e só podem ser usados uma vez.
          </p>
          <Link
            href="/recuperar-senha"
            className="rounded-full inline-block border border-wine bg-wine px-5 py-3 text-[13px] text-paper"
          >
            Solicitar novo link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
