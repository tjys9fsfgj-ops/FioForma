import type { Metadata } from 'next';
import Link from 'next/link';
import { guestAccessAction } from '@/app/actions/auth';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { sha256 } from '@/lib/crypto';
import { maskEmail } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Entrar na sua biblioteca',
  robots: { index: false, follow: false },
};

export default async function AccessTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await prisma.loginToken.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });

  const valid = record && !record.usedAt && record.expiresAt > new Date();

  if (!valid) {
    return (
      <AuthShell
        eyebrow="Acesso"
        title="Este link não vale mais"
        description="Links de acesso são de uso único e expiram em 7 dias. Peça um novo para entrar na sua biblioteca."
      >
        <div className="space-y-4">
          <p className="text-[13.5px] leading-relaxed text-muted">
            Se você já definiu uma senha, entre normalmente com e-mail e senha.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/acesso" className="rounded-full border border-forest bg-forest px-5 py-3 text-[13px] text-paper">
              Pedir novo link
            </Link>
            <Link href="/entrar" className="rounded-full border border-line px-5 py-3 text-[13px] hover:border-forest">
              Entrar com senha
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Bem-vinda de volta"
      title="Entrar na sua biblioteca"
      description={
        <>
          Encontramos a conta de <strong className="font-medium text-ink">{maskEmail(record.user.email)}</strong>.
          Ao entrar, você poderá baixar todos os moldes comprados e definir uma senha.
        </>
      }
    >
      <form action={guestAccessAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <Button type="submit" size="lg" className="w-full">
          Entrar e ver meus moldes
        </Button>
        <p className="text-center text-[11.5px] leading-relaxed text-muted">
          Este link é de uso único. Depois de entrar, a sessão fica ativa por 30 dias neste navegador.
        </p>
      </form>
    </AuthShell>
  );
}
