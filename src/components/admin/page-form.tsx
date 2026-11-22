import Link from 'next/link';
import { savePageAction } from '@/app/actions/admin-pages';
import { Button } from '@/components/ui/button';
import type { Page } from '@prisma/client';

export function PageForm({ page }: { page?: Page }) {
  return (
    <form action={savePageAction} className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      {page ? <input type="hidden" name="id" value={page.id} /> : null}

      <div className="rounded-2xl space-y-4 border border-line bg-white p-5">
        <div>
          <label htmlFor="title" className="field-label">Título *</label>
          <input id="title" name="title" required defaultValue={page?.title ?? ''} className="field-input" />
        </div>
        <div>
          <label htmlFor="excerpt" className="field-label">Resumo</label>
          <input
            id="excerpt"
            name="excerpt"
            maxLength={320}
            defaultValue={page?.excerpt ?? ''}
            placeholder="Uma frase que aparece no blog e nos resultados de busca"
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="contentMd" className="field-label">Conteúdo (Markdown) *</label>
          <textarea
            id="contentMd"
            name="contentMd"
            required
            rows={22}
            defaultValue={page?.contentMd ?? ''}
            className="field-input font-mono text-[12px] leading-relaxed"
            placeholder={'## Título da seção\n\nParágrafo com **destaque**.\n\n- item\n- item'}
          />
          <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
            Use `##` para subtítulos, `-` para listas, `**texto**` para negrito e links no formato
            `[texto](https://exemplo.com)`. Linhas em branco separam parágrafos.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl space-y-4 border border-line bg-white p-5">
          <div>
            <label htmlFor="kind" className="field-label">Tipo</label>
            <select id="kind" name="kind" defaultValue={page?.kind ?? 'PAGE'} className="field-input">
              <option value="PAGE">Página institucional</option>
              <option value="POST">Post do blog</option>
            </select>
          </div>
          <div>
            <label htmlFor="slug" className="field-label">Endereço (slug)</label>
            <input
              id="slug"
              name="slug"
              defaultValue={page?.slug ?? ''}
              placeholder="gerado a partir do título"
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="status" className="field-label">Situação</label>
            <select id="status" name="status" defaultValue={page?.status ?? 'DRAFT'} className="field-input">
              <option value="DRAFT">Rascunho</option>
              <option value="PUBLISHED">Publicado</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl space-y-4 border border-line bg-white p-5">
          <p className="font-serif text-[16px] text-forest">SEO</p>
          <div>
            <label htmlFor="seoTitle" className="field-label">Título para busca</label>
            <input id="seoTitle" name="seoTitle" defaultValue={page?.seoTitle ?? ''} className="field-input" />
          </div>
          <div>
            <label htmlFor="seoDescription" className="field-label">Descrição para busca</label>
            <textarea
              id="seoDescription"
              name="seoDescription"
              rows={3}
              maxLength={320}
              defaultValue={page?.seoDescription ?? ''}
              className="field-input"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm">Salvar</Button>
          {page ? (
            <Link
              href={page.kind === 'POST' ? `/blog/${page.slug}` : `/${page.slug}`}
              target="_blank"
              className="text-[11.5px] text-muted underline underline-offset-4 hover:text-forest"
            >
              Ver no site
            </Link>
          ) : null}
          <Link href="/admin/paginas" className="text-[11.5px] text-muted underline underline-offset-4 hover:text-forest">
            Voltar
          </Link>
        </div>
      </div>
    </form>
  );
}
