import { deleteCollectionAction, saveCollectionAction } from '@/app/actions/admin-taxonomy';
import { AdminHeader } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/field';
import { prisma } from '@/lib/prisma';

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string; erro?: string }>;
}) {
  const { salvo, erro } = await searchParams;
  const collections = await prisma.collection.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <AdminHeader
        eyebrow="Organização"
        title="Coleções"
        description="Coleções agrupam moldes por ideia (verão, alfaiataria, básicos). Elas aparecem na home e no catálogo."
      />

      {salvo ? <div className="mb-4"><FormMessage tone="success">Coleções atualizadas.</FormMessage></div> : null}
      {erro ? <div className="mb-4"><FormMessage>Informe o nome da coleção.</FormMessage></div> : null}

      <section className="rounded-2xl mb-8 border border-line bg-paper">
        <div className="border-b border-line px-5 py-3">
          <h2 className="font-serif text-[17px] text-wine">Nova coleção</h2>
        </div>
        <form action={saveCollectionAction} className="grid gap-3 p-5 sm:grid-cols-[1.2fr_1.6fr_0.5fr_auto] sm:items-end">
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
          <div className="flex items-center gap-3 pb-1">
            <label className="flex items-center gap-2 text-[12px]">
              <input type="checkbox" name="published" defaultChecked className="h-4 w-4 accent-[#7A3B3B]" />
              Publicada
            </label>
            <Button type="submit" size="sm">Criar</Button>
          </div>
        </form>
      </section>

      <div className="space-y-3">
        {collections.length === 0 ? (
          <p className="rounded-2xl border border-line bg-paper px-5 py-8 text-[12.5px] text-muted">
            Nenhuma coleção cadastrada. Crie a primeira acima.
          </p>
        ) : (
          collections.map((collection) => (
            <details key={collection.id} className="rounded-2xl border border-line bg-paper">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                <div>
                  <p className="font-serif text-[16px] text-ink">{collection.name}</p>
                  <p className="text-[10.5px] text-muted">
                    /{collection.slug} · {collection._count.products} moldes · {collection.published ? 'publicada' : 'oculta'}
                  </p>
                </div>
                <span aria-hidden="true" className="text-muted">+</span>
              </summary>
              <div className="border-t border-line p-5">
                <form action={saveCollectionAction} className="grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="id" value={collection.id} />
                  <div>
                    <label htmlFor={`name-${collection.id}`} className="field-label">Nome</label>
                    <input id={`name-${collection.id}`} name="name" defaultValue={collection.name} className="field-input" />
                  </div>
                  <div>
                    <label htmlFor={`slug-${collection.id}`} className="field-label">Slug</label>
                    <input id={`slug-${collection.id}`} name="slug" defaultValue={collection.slug} className="field-input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`description-${collection.id}`} className="field-label">Descrição</label>
                    <textarea id={`description-${collection.id}`} name="description" rows={2} defaultValue={collection.description ?? ''} className="field-input" />
                  </div>
                  <div>
                    <label htmlFor={`order-${collection.id}`} className="field-label">Ordem</label>
                    <input id={`order-${collection.id}`} name="sortOrder" type="number" defaultValue={collection.sortOrder} className="field-input" />
                  </div>
                  <label className="flex items-center gap-2 pt-5 text-[12px]">
                    <input type="checkbox" name="published" defaultChecked={collection.published} className="h-4 w-4 accent-[#7A3B3B]" />
                    Publicada no site
                  </label>
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <Button type="submit" size="sm">Salvar</Button>
                  </div>
                </form>
                <form action={deleteCollectionAction} className="mt-3 border-t border-line pt-3">
                  <input type="hidden" name="id" value={collection.id} />
                  <button type="submit" className="text-[11px] text-[#9B3A2E] underline underline-offset-4">
                    Excluir coleção (os moldes ficam sem coleção)
                  </button>
                </form>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
