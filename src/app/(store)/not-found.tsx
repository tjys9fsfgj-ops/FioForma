import Link from 'next/link';
import { Logo } from '@/components/site/logo';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <Logo />
      <p className="eyebrow mt-10">Erro 404</p>
      <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.8rem)] leading-tight">Esta página saiu da linha.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted">
        O endereço pode ter mudado ou o molde saiu do catálogo. Tente pelo catálogo ou volte ao início.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/catalogo" className="rounded-full border border-wine bg-wine px-5 py-3 text-[13px] text-paper">
          Ver moldes
        </Link>
        <Link href="/" className="rounded-full border border-line px-5 py-3 text-[13px] hover:border-wine">
          Página inicial
        </Link>
      </div>
    </div>
  );
}
