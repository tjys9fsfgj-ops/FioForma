'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import type { CatalogParams } from './filters';

export function CatalogFiltersBar({
  total,
  sortOptions,
  currentSort,
  params,
  basePath,
  mobileFilters,
}: {
  total: number;
  sortOptions: { value: string; label: string }[];
  currentSort: string;
  params: CatalogParams;
  basePath: string;
  mobileFilters: ReactNode;
}) {
  const router = useRouter();

  function changeSort(value: string) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, entry]) => {
      if (entry && key !== 'page' && key !== 'ordem') search.set(key, entry);
    });
    if (value !== 'novidades') search.set('ordem', value);
    const query = search.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  return (
    <div className="flex items-center gap-3">
      <details className="relative lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-[12.5px] font-medium text-ink marker:content-none [&::-webkit-details-marker]:hidden">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          Filtros
        </summary>
        <div className="absolute left-0 top-12 z-40 max-h-[70vh] w-[min(86vw,340px)] overflow-y-auto rounded-3xl border border-line bg-paper p-5 shadow-paper">
          {mobileFilters}
          <p className="mt-4 border-t border-line pt-3 text-[11.5px] text-muted">{total} moldes encontrados</p>
        </div>
      </details>

      <label htmlFor="sort" className="sr-only">
        Ordenar por
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={(event) => changeSort(event.target.value)}
        className="rounded-full border border-line bg-paper px-4 py-2 text-[12.5px] font-medium text-ink focus:border-wine focus:outline-none"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
