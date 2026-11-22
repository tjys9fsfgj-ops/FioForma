import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { renderMarkdown } from '@/lib/markdown';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/format';

const LEGAL_SLUGS = new Set(['termos', 'privacidade', 'licenca', 'reembolso']);

type Props = { params: Promise<{ slug: string }> };

async function getPage(slug: string) {
  return prisma.page.findFirst({
    where: { slug, kind: 'PAGE', status: 'PUBLISHED' },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: 'Página não encontrada' };

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.excerpt || undefined,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      title: page.title,
      description: page.seoDescription || page.excerpt || undefined,
      url: `/${page.slug}`,
      type: 'article',
    },
  };
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <article className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Trilha" className="text-[11.5px] text-muted">
          <Link href="/" className="hover:text-forest">
            Início
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-ink/70">{page.title}</span>
        </nav>

        <header className="mt-6 border-b border-line pb-6">
          <p className="eyebrow">Ateliê</p>
          <h1 className="mt-3 text-[clamp(2rem,4.4vw,3.1rem)] leading-[1.05]">{page.title}</h1>
          {page.excerpt ? <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{page.excerpt}</p> : null}
          <p className="mt-4 text-[11px] text-muted">Atualizado em {formatDate(page.updatedAt)}</p>
        </header>

        {LEGAL_SLUGS.has(page.slug) ? (
          <div className="mt-6 border border-[#D9C9A3] bg-[#FBF6E8] px-4 py-3 text-[12px] leading-relaxed text-[#6B5320]">
            <strong className="font-medium">Rascunho.</strong> Este texto é um ponto de partida e precisa ser
            validado por advogado antes da publicação oficial da loja.
          </div>
        ) : null}

        <div
          className="prose-atelier mt-8"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(page.contentMd) }}
        />

        <div className="mt-12 border-t border-line pt-6 text-[12px] text-muted">
          <p>
            Precisa de ajuda?{' '}
            <Link href="/contato" className="text-forest underline underline-offset-4">
              Fale com o ateliê
            </Link>
            .
          </p>
        </div>
      </div>
    </article>
  );
}
