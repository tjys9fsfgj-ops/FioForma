import Link from 'next/link';
import { difficultyLabels } from '@/lib/format';
import { cn } from '@/lib/utils';

export type CatalogParams = {
  q?: string;
  colecao?: string;
  categoria?: string;
  tamanho?: string;
  dificuldade?: string;
  preco?: string;
  ordem?: string;
  page?: string;
};

const sizes = ['PP', 'P', 'M', 'G', 'GG'];
const difficulties = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'] as const;
const priceRanges = [
  { value: 'ate-12', label: 'Até R$ 12' },
  { value: '12-16', label: 'R$ 12 a R$ 16' },
  { value: '16-20', label: 'R$ 16 a R$ 20' },
  { value: 'acima-20', label: 'Acima de R$ 20' },
];

export function catalogHref(
  basePath: string,
  params: CatalogParams,
  overrides: Partial<CatalogParams> = {},
): string {
  const merged: CatalogParams = { ...params, ...overrides };
  const search = new URLSearchParams();
  (Object.keys(merged) as (keyof CatalogParams)[]).forEach((key) => {
    const value = merged[key];
    if (value && key !== 'page') search.set(key, value);
  });
  if (overrides.page) search.set('page', overrides.page);
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

type Option = { value: string; label: string; count?: number };

function FilterGroup({
  title,
  options,
  paramKey,
  params,
  basePath,
}: {
  title: string;
  options: Option[];
  paramKey: keyof CatalogParams;
  params: CatalogParams;
  basePath: string;
}) {
  if (options.length === 0) return null;
  const active = params[paramKey];

  return (
    <details open className="group border-b border-line py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[11.5px] font-semibold uppercase tracking-[0.14em] text-wine marker:content-none [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <ul className="mt-3 space-y-0.5">
        {options.map((option) => {
          const isActive = active === option.value;
          return (
            <li key={option.value}>
              <Link
                href={catalogHref(basePath, params, {
                  [paramKey]: isActive ? undefined : option.value,
                })}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-[13.5px] leading-snug transition-colors',
                  isActive ? 'bg-sand font-semibold text-wine' : 'text-ink/75 hover:bg-wine/[0.05] hover:text-wine',
                )}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'inline-block h-2.5 w-2.5 rounded-full border',
                      isActive ? 'border-wine bg-wine' : 'border-line bg-transparent',
                    )}
                  />
                  {option.label}
                </span>
                {option.count !== undefined ? (
                  <span className="text-[11px] text-muted">{option.count}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

export function FilterPanel({
  params,
  basePath,
  collections,
  categories,
}: {
  params: CatalogParams;
  basePath: string;
  collections: { slug: string; name: string; count: number }[];
  categories: { slug: string; name: string; count: number }[];
}) {
  const hasFilters = Boolean(
    params.q || params.colecao || params.categoria || params.tamanho || params.dificuldade || params.preco,
  );

  return (
    <div>
      <div className="flex items-center justify-between pb-2">
        <p className="eyebrow">Filtrar</p>
        {hasFilters ? (
          <Link href={basePath} className="text-[11.5px] text-wine underline underline-offset-4">
            Limpar
          </Link>
        ) : null}
      </div>

      <FilterGroup
        title="Coleção"
        paramKey="colecao"
        params={params}
        basePath={basePath}
        options={collections.map((collection) => ({
          value: collection.slug,
          label: collection.name,
          count: collection.count,
        }))}
      />
      <FilterGroup
        title="Categoria"
        paramKey="categoria"
        params={params}
        basePath={basePath}
        options={categories.map((category) => ({
          value: category.slug,
          label: category.name,
          count: category.count,
        }))}
      />
      <FilterGroup
        title="Tamanho"
        paramKey="tamanho"
        params={params}
        basePath={basePath}
        options={sizes.map((size) => ({ value: size, label: size }))}
      />
      <FilterGroup
        title="Dificuldade"
        paramKey="dificuldade"
        params={params}
        basePath={basePath}
        options={difficulties.map((difficulty) => ({
          value: difficulty,
          label: difficultyLabels[difficulty],
        }))}
      />
      <FilterGroup
        title="Preço"
        paramKey="preco"
        params={params}
        basePath={basePath}
        options={priceRanges}
      />
    </div>
  );
}
