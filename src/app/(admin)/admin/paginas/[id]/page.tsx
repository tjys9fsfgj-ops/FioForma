import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/admin/ui';
import { PageForm } from '@/components/admin/page-form';
import { FormMessage } from '@/components/ui/field';
import { prisma } from '@/lib/prisma';

export default async function EditPagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) notFound();

  return (
    <div>
      <AdminHeader
        eyebrow={
          <>
            <Link href="/admin/paginas" className="hover:text-wine">Conteúdo</Link>
            <span className="mx-1">/</span>
            <span>{page.kind === 'POST' ? 'Blog' : 'Página'}</span>
          </>
        }
        title={page.title}
        description={`Endereço: ${page.kind === 'POST' ? `/blog/${page.slug}` : `/${page.slug}`}`}
      />
      {ok ? <div className="mb-4"><FormMessage tone="success">Conteúdo salvo.</FormMessage></div> : null}
      {erro ? <div className="mb-4"><FormMessage>Título e conteúdo são obrigatórios.</FormMessage></div> : null}
      <PageForm page={page} />
    </div>
  );
}
