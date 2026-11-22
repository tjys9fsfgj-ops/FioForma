import Link from 'next/link';
import { deleteProductAction, toggleProductStatusAction } from '@/app/actions/admin-products';
import { AdminEmpty, AdminHeader, AdminTable, StatusPill } from '@/components/admin/ui';
import { ButtonLink } from '@/components/ui/button';
import { brl, formatDate, productStatusLabels } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const products = await prisma.product.findMany({
    where: {
      ...(q ? { name: { contains: q } } : {}),
      ...(status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)
        ? { status: status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }
        : {}),
    },
    include: {
      images: { take: 1, orderBy: { sortOrder: 'asc' } },
      category: true,
      collection: true,
      files: { select: { id: true } },
      _count: { select: { orderItems: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div>
      <AdminHeader
        eyebrow="Catálogo"
        title="Produtos"
        description="Cada molde tem ficha técnica, medidas e arquivos próprios. Publique só quando as fotos e os PDFs estiverem anexados."
        action={<ButtonLink href="/admin/produtos/novo" size="sm">Novo molde</ButtonLink>}
      />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="q" className="field-label">Buscar</label>
          <input id="q" name="q" defaultValue={q ?? ''} placeholder="Nome do molde" className="field-input" />
        </div>
        <div>
          <label htmlFor="status" className="field-label">Situação</label>
          <select id="status" name="status" defaultValue={status ?? ''} className="field-input">
            <option value="">Todas</option>
            <option value="PUBLISHED">Publicados</option>
            <option value="DRAFT">Rascunhos</option>
            <option value="ARCHIVED">Arquivados</option>
          </select>
        </div>
        <button type="submit" className="rounded-full border border-line bg-white px-4 py-3 text-[12px] hover:border-forest">
          Filtrar
        </button>
      </form>

      {products.length === 0 ? (
        <AdminEmpty
          title="Nenhum molde encontrado"
          description="Cadastre o primeiro molde com fotos, ficha técnica, tabela de medidas e PDFs."
          action={<ButtonLink href="/admin/produtos/novo" size="sm">Criar molde</ButtonLink>}
        />
      ) : (
        <AdminTable head={['Molde', 'Preço', 'Categoria', 'Arquivos', 'Situação', 'Atualizado', 'Ações']}>
          {products.map((product) => (
            <tr key={product.id} className="align-middle hover:bg-[#FAF9F6]">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl h-12 w-10 shrink-0 overflow-hidden border border-line bg-[#EFEDE6]">
                    {product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/media/${product.images[0].mediaId}`} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/admin/produtos/${product.id}`} className="block truncate font-medium text-ink hover:text-forest">
                      {product.name}
                    </Link>
                    <p className="truncate text-[10.5px] text-muted">/{product.slug}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">{brl(product.priceCents)}</td>
              <td className="px-4 py-3 text-muted">{product.category?.name ?? '—'}</td>
              <td className="px-4 py-3">{product.files.length}</td>
              <td className="px-4 py-3">
                <StatusPill tone={product.status === 'PUBLISHED' ? 'green' : product.status === 'DRAFT' ? 'amber' : 'gray'}>
                  {productStatusLabels[product.status]}
                </StatusPill>
              </td>
              <td className="px-4 py-3 text-muted">{formatDate(product.updatedAt)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/produtos/${product.id}`} className="text-[11px] text-forest underline underline-offset-4">
                    Editar
                  </Link>
                  <form action={toggleProductStatusAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <button type="submit" className="text-[11px] text-muted underline underline-offset-4 hover:text-forest">
                      {product.status === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}
                    </button>
                  </form>
                  <form action={deleteProductAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <button type="submit" className="text-[11px] text-[#9B3A2E] underline underline-offset-4">
                      {product._count.orderItems > 0 ? 'Arquivar' : 'Excluir'}
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
