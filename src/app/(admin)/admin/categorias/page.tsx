import { deleteCategoryAction, saveCategoryAction } from '@/app/actions/admin-taxonomy';
import { AdminHeader } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/field';
import { prisma } from '@/lib/prisma';

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string; erro?: string }>;
}) {
  const { salvo, erro } = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <AdminHeader
        eyebrow="Organização"
        title="Categorias"
        description="Categorias são o tipo de peça (vestido, camisa, saia). Cada uma tem uma página indexável no catálogo."
      />

      {salvo ? <div className="mb-4"><FormMessage tone="success">Categorias atualizadas.</FormMessage></div> : null}
      {erro ? <div className="mb-4"><FormMessage>Informe o nome da categoria.</FormMessage></div> : null}

      <section className="rounded-2xl mb-8 border border-line bg-paper">
        <div className="border-b border-line px-5 py-3">
          <h2 className="font-serif text-[17px] text-wine">Nova categoria</h2>
        </div>
        <form action={saveCategoryAction} className="grid gap-3 p-5 sm:grid-cols-[1.2fr_1.6fr_0.5fr_auto] sm:items-end">
          <div>
            <label htmlFor="new-name" className="field-label">Nome *</label>
            <input id="new-name" name="name" required className="field-input" />
          </div>
          <div>
            <label htmlFor="new-description" className="field-label">Descrição</label>
            <input id="new-description" name="description" className="field-input" />
          </div>
          <div>
            <label htmlFor="new-order" className="field-label">Ordem</label>
            <input id="new-order" name="sortOrder" type="number" defaultValue={0} className="field-input" />
          </div>
          <Button type="submit" size="sm">Criar</Button>
        </form>
      </section>

      <div className="space-y-3">
        {categories.map((category) => (
          <details key={category.id} className="rounded-2xl border border-line bg-paper">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
              <div>
                <p className="font-serif text-[16px] text-ink">{category.name}</p>
                <p className="text-[10.5px] text-muted">
                  /categoria/{category.slug} · {category._count.products} moldes
                </p>
              </div>
              <span aria-hidden="true" className="text-muted">+</span>
            </summary>
            <div className="border-t border-line p-5">
              <form action={saveCategoryAction} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={category.id} />
                <div>
                  <label htmlFor={`name-${category.id}`} className="field-label">Nome</label>
                  <input id={`name-${category.id}`} name="name" defaultValue={category.name} className="field-input" />
                </div>
                <div>
                  <label htmlFor={`slug-${category.id}`} className="field-label">Slug</label>
                  <input id={`slug-${category.id}`} name="slug" defaultValue={category.slug} className="field-input" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`description-${category.id}`} className="field-label">Descrição</label>
                  <textarea id={`description-${category.id}`} name="description" rows={2} defaultValue={category.description ?? ''} className="field-input" />
                </div>
                <div>
                  <label htmlFor={`order-${category.id}`} className="field-label">Ordem</label>
                  <input id={`order-${category.id}`} name="sortOrder" type="number" defaultValue={category.sortOrder} className="field-input" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" size="sm">Salvar</Button>
                </div>
              </form>
              <form action={deleteCategoryAction} className="mt-3 border-t border-line pt-3">
                <input type="hidden" name="id" value={category.id} />
                <button type="submit" className="text-[11px] text-[#9B3A2E] underline underline-offset-4">
                  Excluir categoria (os moldes ficam sem categoria)
                </button>
              </form>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
