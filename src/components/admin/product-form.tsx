import type { Category, Collection, Product, ProductSpec, SizeChart, SizeRow } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { centsToInput } from '@/lib/format';
import { parseJson } from '@/lib/utils';

type ProductWithRelations = Product & {
  spec: ProductSpec | null;
  sizeCharts: (SizeChart & { rows: SizeRow[] })[];
};

const sizeOptions = ['PP', 'P', 'M', 'G'];
const formatOptions = ['A4', 'A0', 'PROJETOR'];

export function ProductForm({
  product,
  categories,
  collections,
  action,
}: {
  product?: ProductWithRelations;
  categories: Category[];
  collections: Collection[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const sizes = parseJson<string[]>(product?.sizesIncluded, ['PP', 'P', 'M', 'G']);
  const formats = parseJson<string[]>(product?.spec?.includedFormats, ['A4']);
  const faq = parseJson<{ question: string; answer: string }[]>(product?.spec?.faq, []);
  const chart = product?.sizeCharts[0];
  const rowFor = (size: string) => chart?.rows.find((row) => row.size === size);

  return (
    <form action={action} className="space-y-6">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <section className="rounded-2xl border border-line bg-white">
        <div className="border-b border-line px-5 py-3">
          <h2 className="font-serif text-[17px] text-forest">Dados do molde</h2>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="field-label">Nome do molde *</label>
            <input id="name" name="name" required defaultValue={product?.name} className="field-input" />
          </div>
          <div>
            <label htmlFor="slug" className="field-label">URL (slug)</label>
            <input id="slug" name="slug" defaultValue={product?.slug} className="field-input" placeholder="gerado pelo nome" />
          </div>
          <div>
            <label htmlFor="price" className="field-label">Preço (R$) *</label>
            <input
              id="price"
              name="price"
              required
              inputMode="decimal"
              defaultValue={product ? centsToInput(product.priceCents) : ''}
              placeholder="14,90"
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="compareAt" className="field-label">Preço comparativo (opcional)</label>
            <input
              id="compareAt"
              name="compareAt"
              inputMode="decimal"
              defaultValue={product?.compareAtCents ? centsToInput(product.compareAtCents) : ''}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="difficulty" className="field-label">Dificuldade</label>
            <select id="difficulty" name="difficulty" defaultValue={product?.difficulty ?? 'INICIANTE'} className="field-input">
              <option value="INICIANTE">Iniciante</option>
              <option value="INTERMEDIARIO">Intermediário</option>
              <option value="AVANCADO">Avançado</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="tagline" className="field-label">Frase curta (aparece no cartão e no topo)</label>
            <input id="tagline" name="tagline" defaultValue={product?.tagline ?? ''} className="field-input" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className="field-label">Descrição (Markdown aceito)</label>
            <textarea
              id="description"
              name="description"
              rows={8}
              defaultValue={product?.description}
              className="field-input min-h-40 font-mono text-[12.5px]"
            />
          </div>
          <div>
            <label htmlFor="categoryId" className="field-label">Categoria</label>
            <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ''} className="field-input">
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="collectionId" className="field-label">Coleção</label>
            <select id="collectionId" name="collectionId" defaultValue={product?.collectionId ?? ''} className="field-input">
              <option value="">Sem coleção</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>{collection.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="field-label">Situação</label>
            <select id="status" name="status" defaultValue={product?.status ?? 'DRAFT'} className="field-input">
              <option value="DRAFT">Rascunho (fora do ar)</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>
          </div>
          <div>
            <span className="field-label">Tamanhos incluídos</span>
            <div className="flex flex-wrap gap-3 pt-1">
              {sizeOptions.map((size) => (
                <label key={size} className="flex items-center gap-1.5 text-[12.5px]">
                  <input
                    type="checkbox"
                    name="sizes"
                    value={size}
                    defaultChecked={sizes.includes(size)}
                    className="h-4 w-4 accent-[#24483D]"
                  />
                  {size}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="seoTitle" className="field-label">Título SEO</label>
            <input id="seoTitle" name="seoTitle" defaultValue={product?.seoTitle ?? ''} className="field-input" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="seoDescription" className="field-label">Descrição SEO (até 160 caracteres)</label>
            <input id="seoDescription" name="seoDescription" maxLength={320} defaultValue={product?.seoDescription ?? ''} className="field-input" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white">
        <div className="border-b border-line px-5 py-3">
          <h2 className="font-serif text-[17px] text-forest">Ficha técnica</h2>
          <p className="mt-1 text-[11px] text-muted">Deixe em branco o que não se aplica: o campo não aparece no site.</p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="fabricRecommendation" className="field-label">Tecido recomendado</label>
            <textarea id="fabricRecommendation" name="fabricRecommendation" rows={3} defaultValue={product?.spec?.fabricRecommendation ?? ''} className="field-input" />
          </div>
          <div>
            <label htmlFor="yardage" className="field-label">Metragem por tamanho</label>
            <textarea id="yardage" name="yardage" rows={5} defaultValue={product?.spec?.yardage ?? ''} className="field-input" placeholder={'PP: 1,20 m\nP: 1,30 m\nM: 1,40 m\nG: 1,50 m'} />
          </div>
          <div>
            <label htmlFor="notions" className="field-label">Aviamentos</label>
            <textarea id="notions" name="notions" rows={5} defaultValue={product?.spec?.notions ?? ''} className="field-input" />
          </div>
          <div>
            <label htmlFor="seamAllowance" className="field-label">Margem de costura</label>
            <input id="seamAllowance" name="seamAllowance" defaultValue={product?.spec?.seamAllowance ?? ''} className="field-input" placeholder="1 cm incluída" />
          </div>
          <div>
            <label htmlFor="pageCount" className="field-label">Número de folhas</label>
            <input id="pageCount" name="pageCount" type="number" min={1} defaultValue={product?.spec?.pageCount ?? ''} className="field-input" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="printInstructions" className="field-label">Instruções de impressão</label>
            <textarea id="printInstructions" name="printInstructions" rows={4} defaultValue={product?.spec?.printInstructions ?? ''} className="field-input" placeholder="Imprima em escala 100% e confira o gabarito de 5 × 5 cm." />
          </div>
          <div>
            <span className="field-label">Formatos incluídos</span>
            <div className="flex flex-wrap gap-3 pt-1">
              {formatOptions.map((format) => (
                <label key={format} className="flex items-center gap-1.5 text-[12.5px]">
                  <input type="checkbox" name="includedFormats" value={format} defaultChecked={formats.includes(format)} className="h-4 w-4 accent-[#24483D]" />
                  {format}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-[12.5px]">
              <input type="checkbox" name="layersAvailable" defaultChecked={product?.spec?.layersAvailable} className="h-4 w-4 accent-[#24483D]" />
              PDF com camadas por tamanho
            </label>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input type="checkbox" name="projectorAvailable" defaultChecked={product?.spec?.projectorAvailable} className="h-4 w-4 accent-[#24483D]" />
              Arquivo para projetor
            </label>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="faq" className="field-label">FAQ do molde (uma por linha: Pergunta | Resposta)</label>
            <textarea
              id="faq"
              name="faq"
              rows={4}
              defaultValue={faq.map((item) => `${item.question} | ${item.answer}`).join('\n')}
              className="field-input"
              placeholder="Serve para iniciante? | Sim, é uma peça reta com poucas curvas."
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white">
        <div className="border-b border-line px-5 py-3">
          <h2 className="font-serif text-[17px] text-forest">Tabela de medidas do corpo (cm)</h2>
        </div>
        <div className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="chartTitle" className="field-label">Título da tabela</label>
              <input id="chartTitle" name="chartTitle" defaultValue={chart?.title ?? 'Tabela de medidas'} className="field-input" />
            </div>
            <div>
              <label htmlFor="chartNotes" className="field-label">Observações</label>
              <input id="chartNotes" name="chartNotes" defaultValue={chart?.notes ?? ''} className="field-input" placeholder="Medidas do corpo, sem roupa por cima." />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.12em] text-muted">Tamanho</th>
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.12em] text-muted">Busto</th>
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.12em] text-muted">Cintura</th>
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.12em] text-muted">Quadril</th>
                </tr>
              </thead>
              <tbody>
                {sizeOptions.map((size) => {
                  const row = rowFor(size);
                  return (
                    <tr key={size} className="border-b border-line/60">
                      <td className="px-2 py-2 font-serif text-[14px] text-forest">{size}</td>
                      {(['bust', 'waist', 'hip'] as const).map((field) => (
                        <td key={field} className="px-2 py-2">
                          <input
                            name={`${field}_${size}`}
                            inputMode="decimal"
                            defaultValue={
                              field === 'bust' ? row?.bustCm ?? '' : field === 'waist' ? row?.waistCm ?? '' : row?.hipCm ?? ''
                            }
                            className="rounded-2xl w-full border border-line px-2 py-1.5 text-[12px] focus:border-forest focus:outline-none"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">{product ? 'Salvar alterações' : 'Criar molde'}</Button>
        <a href="/admin/produtos" className="text-[12px] text-muted underline underline-offset-4 hover:text-forest">
          Voltar sem salvar
        </a>
      </div>
    </form>
  );
}
