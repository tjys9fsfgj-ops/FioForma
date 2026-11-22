import Link from 'next/link';
import { ProductCard } from '@/components/product/product-card';
import { listCategories, listCollections, listProducts, type CatalogFilters } from '@/lib/products';
import { difficultyLabels } from '@/lib/format';
import { CatalogFiltersBar } from './filters-bar';
import { FilterPanel, type CatalogParams } from './filters';

const sortOptions = [
  { value: 'novidades', label: 'Mais recentes' },
  { value: 'preco-asc', label: 'Menor preço' },
  { value: 'preco-desc', label: 'Maior preço' },
  { value: 'nome', label: 'Nome (A–Z)' },
];

function Pagination({
  basePath,
  params,
  page,
  pages,
}: {
  basePath: string;
  params: CatalogParams;
  page: number;
  pages: number;
}) {
  if (pages <= 1) return null;

  const pagesToShow = Array.from({ length: pages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === pages || Math.abs(value - page) <= 1,
  );

  return (
    <nav aria-label="Paginação" className="mt-14 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link
          href={`${basePath}?${new URLSearchParams({ ...params, page: String(page - 1) } as Record<string, string>).toString()}`}
          className="border border-rule bg-paper px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink hover:border-ink"
          rel="prev"
        >
          ← Anterior
        </Link>
      ) : null}

      {pagesToShow.map((value, index) => {
        const previous = pagesToShow[index - 1];
        const gap = previous && value - previous > 1;
        return (
          <span key={value} className="flex items-center gap-1">
            {gap ? <span className="px-1 text-muted">…</span> : null}
            <Link
              href={`${basePath}?${new URLSearchParams({ ...params, page: String(value) } as Record<string, string>).toString()}`}
              aria-current={value === page ? 'page' : undefined}
              className={
                value === page
                  ? 'flex h-10 min-w-10 items-center justify-center rounded-full border border-wine bg-wine px-3 text-[12.5px] font-semibold text-paper'
                  : 'flex h-10 min-w-10 items-center justify-center rounded-full border border-line bg-paper px-3 text-[12.5px] font-medium hover:border-wine hover:text-wine'
              }
            >
              {value}
            </Link>
          </span>
        );
      })}

      {page < pages ? (
        <Link
          href={`${basePath}?${new URLSearchParams({ ...params, page: String(page + 1) } as Record<string, string>).toString()}`}
          className="border border-rule bg-paper px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink hover:border-ink"
          rel="next"
        >
          Próxima →
        </Link>
      ) : null}
    </nav>
  );
}

export async function CatalogView({
  basePath,
  params,
  title,
  description,
  lockedCollection,
  lockedCategory,
}: {
  basePath: string;
  params: CatalogParams;
  title: string;
  description?: string;
  lockedCollection?: string;
  lockedCategory?: string;
}) {
  const filters: CatalogFilters = {
    q: params.q,
    colecao: lockedCollection ?? params.colecao,
    categoria: lockedCategory ?? params.categoria,
    tamanho: params.tamanho,
    dificuldade: params.dificuldade,
    preco: params.preco,
    ordem: params.ordem,
    page: Number(params.page ?? '1') || 1,
  };

  const [{ items, total, page, pages }, collections, categories] = await Promise.all([
    listProducts(filters),
    listCollections(),
    listCategories(),
  ]);

  const collectionOptions = collections
    .filter((collection) => collection._count.products > 0)
    .map((collection) => ({
      slug: collection.slug,
      name: collection.name,
      count: collection._count.products,
    }));

  const categoryOptions = categories
    .filter((category) => category._count.products > 0)
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      count: category._count.products,
    }));

  const activeChips: { label: string; href: string }[] = [];
  if (params.q) {
    activeChips.push({ label: `“${params.q}”`, href: `${basePath}?${new URLSearchParams({ ...params, q: '' }).toString()}` });
  }
  if (params.colecao && !lockedCollection) {
    const found = collectionOptions.find((option) => option.slug === params.colecao);
    activeChips.push({
      label: found?.name ?? params.colecao,
      href: `${basePath}?${new URLSearchParams({ ...params, colecao: '' }).toString()}`,
    });
  }
  if (params.categoria && !lockedCategory) {
    const found = categoryOptions.find((option) => option.slug === params.categoria);
    activeChips.push({
      label: found?.name ?? params.categoria,
      href: `${basePath}?${new URLSearchParams({ ...params, categoria: '' }).toString()}`,
    });
  }
  if (params.tamanho) {
    activeChips.push({
      label: `Tam. ${params.tamanho}`,
      href: `${basePath}?${new URLSearchParams({ ...params, tamanho: '' }).toString()}`,
    });
  }
  if (params.dificuldade) {
    activeChips.push({
      label: difficultyLabels[params.dificuldade as keyof typeof difficultyLabels] ?? params.dificuldade,
      href: `${basePath}?${new URLSearchParams({ ...params, dificuldade: '' }).toString()}`,
    });
  }
  if (params.preco) {
    activeChips.push({
      label: 'Faixa de preço',
      href: `${basePath}?${new URLSearchParams({ ...params, preco: '' }).toString()}`,
    });
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="border-b border-rule pb-10 text-center">
        <p className="eyebrow">Catálogo</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-[clamp(2.2rem,4.6vw,3.4rem)] leading-[1.05]">{title}</h1>
        {description ? <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p> : null}
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FilterPanel
              params={params}
              basePath={basePath}
              collections={lockedCollection ? [] : collectionOptions}
              categories={lockedCategory ? [] : categoryOptions}
            />
          </div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-3">
            <p className="text-[12.5px] text-muted">
              {total} {total === 1 ? 'molde' : 'moldes'}
              {params.q ? ` para “${params.q}”` : ''}
            </p>
            <CatalogFiltersBar
              total={total}
              sortOptions={sortOptions}
              currentSort={params.ordem ?? 'novidades'}
              params={params}
              basePath={basePath}
              mobileFilters={
                <FilterPanel
                  params={params}
                  basePath={basePath}
                  collections={lockedCollection ? [] : collectionOptions}
                  categories={lockedCategory ? [] : categoryOptions}
                />
              }
            />
          </div>

          {activeChips.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="inline-flex items-center gap-2 border border-rule bg-paper px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink hover:border-wine hover:text-wine"
                >
                  {chip.label}
                  <span aria-hidden="true">×</span>
                </Link>
              ))}
            </div>
          ) : null}

          {items.length === 0 ? (
            <div className="rounded-2xl mt-12 border border-line bg-paper px-6 py-14 text-center">
              <p className="font-serif text-[24px] text-wine">Nenhum molde com esses filtros.</p>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted">
                Tente remover um filtro ou buscar por outro termo. Se você procura uma peça específica, fale
                com o ateliê.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href={basePath} className="border border-wine bg-wine px-6 py-3 text-[12px] font-medium uppercase tracking-[0.18em] text-paper hover:bg-wine-800">
                  Ver todos os moldes
                </Link>
                <Link href="/contato" className="border border-ink px-6 py-3 text-[12px] font-medium uppercase tracking-[0.18em] text-ink hover:bg-ink hover:text-paper">
                  Falar com o ateliê
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3">
              {items.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}

          <Pagination basePath={basePath} params={params} page={page} pages={pages} />
        </div>
      </div>
    </div>
  );
}
