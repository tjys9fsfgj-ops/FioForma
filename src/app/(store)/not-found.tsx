import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="eyebrow">Erro 404</p>
      <h1 className="mt-3 text-[clamp(2rem,4vw,2.8rem)] leading-tight">Esta página saiu da linha</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted">
        O endereço pode ter mudado ou o molde saiu do catálogo. Tente pelo catálogo ou volte ao início.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/catalogo">Ver moldes</ButtonLink>
        <ButtonLink href="/" variant="outline">
          Página inicial
        </ButtonLink>
      </div>
    </div>
  );
}
