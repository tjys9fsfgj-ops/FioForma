import Link from 'next/link';
import { deletePageAction, togglePageStatusAction } from '@/app/actions/admin-pages';
import { AdminEmpty, AdminHeader, AdminTable, StatusPill } from '@/components/admin/ui';
import { ButtonLink } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/field';
import { formatDate } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; tipo?: string }>;
}) {
  const { ok, tipo } = await searchParams;
  const kind = tipo === 'POST' ? 'POST' : tipo === 'PAGE' ? 'PAGE' : undefined;

  const pages = await prisma.page.findMany({
    where: kind ? { kind } : undefined,
    orderBy: [{ kind: 'asc' }, { updatedAt: 'desc' }],
  });

  return (
    <div>
      <AdminHeader
        eyebrow="Conteúdo"
        title="Páginas e blog"
        description="Textos institucionais, guias, FAQ e posts. O conteúdo usa Markdown simples: títulos com ##, listas com -, negrito com **."
        action={<ButtonLink href="/admin/paginas/novo" size="sm">Nova página</ButtonLink>}
      />

      {ok ? <div className="mb-4"><FormMessage tone="success">Conteúdo atualizado.</FormMessage></div> : null}

      <div className="mb-4 flex flex-wrap gap-2 text-[11.5px]">
        <Link href="/admin/paginas" className={!tipo ? 'rounded-full border border-forest bg-forest px-4 py-1.5 text-white' : 'rounded-full border border-line bg-white px-4 py-1.5 text-muted hover:border-forest'}>
          Tudo
        </Link>
        <Link href="/admin/paginas?tipo=PAGE" className={tipo === 'PAGE' ? 'rounded-full border border-forest bg-forest px-4 py-1.5 text-white' : 'rounded-full border border-line bg-white px-4 py-1.5 text-muted hover:border-forest'}>
          Páginas
        </Link>
        <Link href="/admin/paginas?tipo=POST" className={tipo === 'POST' ? 'rounded-full border border-forest bg-forest px-4 py-1.5 text-white' : 'rounded-full border border-line bg-white px-4 py-1.5 text-muted hover:border-forest'}>
          Blog
        </Link>
      </div>

      {pages.length === 0 ? (
        <AdminEmpty
          title="Nenhum conteúdo ainda"
          description="Comece pelas páginas obrigatórias: sobre, contato, licença de uso, política de privacidade e termos de compra."
          action={<ButtonLink href="/admin/paginas/novo" size="sm">Criar página</ButtonLink>}
        />
      ) : (
        <AdminTable head={['Título', 'Tipo', 'Endereço', 'Situação', 'Atualizado', 'Ações']}>
          {pages.map((page) => (
            <tr key={page.id} className="hover:bg-[#FAF9F6]">
              <td className="px-4 py-3">
                <Link href={`/admin/paginas/${page.id}`} className="font-medium text-ink hover:text-forest">
                  {page.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted">{page.kind === 'POST' ? 'Blog' : 'Página'}</td>
              <td className="px-4 py-3 text-muted">
                {page.kind === 'POST' ? `/blog/${page.slug}` : `/${page.slug}`}
              </td>
              <td className="px-4 py-3">
                <StatusPill tone={page.status === 'PUBLISHED' ? 'green' : 'amber'}>
                  {page.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                </StatusPill>
              </td>
              <td className="px-4 py-3 text-muted">{formatDate(page.updatedAt)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/admin/paginas/${page.id}`} className="text-[11px] text-forest underline underline-offset-4">
                    Editar
                  </Link>
                  <Link
                    href={page.kind === 'POST' ? `/blog/${page.slug}` : `/${page.slug}`}
                    target="_blank"
                    className="text-[11px] text-muted underline underline-offset-4 hover:text-forest"
                  >
                    Ver
                  </Link>
                  <form action={togglePageStatusAction}>
                    <input type="hidden" name="id" value={page.id} />
                    <button type="submit" className="text-[11px] text-muted underline underline-offset-4 hover:text-forest">
                      {page.status === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}
                    </button>
                  </form>
                  <form action={deletePageAction}>
                    <input type="hidden" name="id" value={page.id} />
                    <button type="submit" className="text-[11px] text-[#9B3A2E] underline underline-offset-4">
                      Excluir
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
