import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { AccessLinkForm } from '@/components/auth/forms';
import { FormMessage } from '@/components/ui/field';

export const metadata: Metadata = {
  title: 'Link de acesso',
  robots: { index: false, follow: false },
};

export default async function AccessPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;

  return (
    <AuthShell
      eyebrow="Compra como visitante"
      title="Receber link de acesso"
      description="Se você comprou sem criar conta, enviamos um link de uso único para entrar na sua biblioteca. Informe o e-mail usado na compra."
      aside={
        <p className="text-[12.5px] leading-relaxed text-muted">
          O link vale por 7 dias. Depois de entrar, você pode definir uma senha em{' '}
          <span className="text-ink">Minha conta → Dados</span> e passar a entrar com e-mail e senha.
        </p>
      }
    >
      <div className="space-y-4">
        {erro === 'link' ? <FormMessage>O link expirou ou já foi usado. Peça um novo abaixo.</FormMessage> : null}
        <AccessLinkForm />
        <p className="text-center text-[12px] text-muted">
          Já tem senha?{' '}
          <Link href="/entrar" className="text-wine underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
