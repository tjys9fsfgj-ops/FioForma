import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  deleteProductFileAction,
  deleteProductImageAction,
  moveProductImageAction,
  updateProductAction,
  uploadProductFileAction,
  uploadProductImageAction,
} from '@/app/actions/admin-products';
import { AdminHeader } from '@/components/admin/ui';
import { ProductForm } from '@/components/admin/product-form';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/field';
import { formatBytes, formatLabels } from '@/lib/format';
import { prisma } from '@/lib/prisma';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string; erro?: string }>;
};

const kindLabels: Record<string, string> = { PECA: 'Peça pronta', DETALHE: 'Detalhe', MOLDE: 'Prévia do molde' };

export default async function EditProductPage({ params, searchParams }: Props) {
  const [{ id }, { salvo, erro }] = await Promise.all([params, searchParams]);

  const [product, categories, collections] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        spec: true,
        sizeCharts: { include: { rows: { orderBy: { sortOrder: 'asc' } } } },
        images: { orderBy: { sortOrder: 'asc' }, include: { media: true } },
        files: { orderBy: { createdAt: 'asc' }, include: { media: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.collection.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <AdminHeader
        eyebrow="Catálogo"
        title={product.name}
        description={
          <>
            <span className="block">/{product.slug} · {product.images.length} fotos · {product.files.length} arquivos</span>
            <Link href={`/produto/${product.slug}`} target="_blank" className="mt-1 inline-block text-wine underline underline-offset-4">
              Ver no site
            </Link>
          </>
        }
        action={
          <Link href="/admin/produtos" className="rounded-full border border-line bg-paper px-3 py-2 text-[12px] hover:border-wine">
            Voltar
          </Link>
        }
      />

      {salvo ? <div className="mb-4"><FormMessage tone="success">Alterações salvas.</FormMessage></div> : null}
      {erro ? (
        <div className="mb-4">
          <FormMessage>
            {erro === 'upload'
              ? 'Não foi possível enviar o arquivo. Verifique o formato (PDF, JPG, PNG ou WebP) e o tamanho (até 30 MB para PDF e 8 MB para imagem).'
              : 'Confira os campos e tente novamente.'}
          </FormMessage>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div>
          <ProductForm product={product} categories={categories} collections={collections} action={updateProductAction} />
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-paper">
            <div className="border-b border-line px-5 py-3">
              <h2 className="font-serif text-[17px] text-wine">Fotos</h2>
              <p className="mt-1 text-[11px] text-muted">A primeira foto é a capa. Use 3:4 (vertical, como na loja), até 8 MB.</p>
            </div>

            <div className="space-y-3 p-4">
              {product.images.length === 0 ? (
                <p className="text-[12px] text-muted">Nenhuma foto enviada. O site mostra um placeholder neutro.</p>
              ) : (
                product.images.map((image, index) => (
                  <div key={image.id} className="rounded-2xl flex gap-3 border border-line p-2">
                    <div className="rounded-2xl h-20 w-16 shrink-0 overflow-hidden border border-line bg-[#EFEDE6]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/media/${image.mediaId}`} alt={image.alt} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] text-ink">{image.alt}</p>
                      <p className="text-[10.5px] text-muted">{kindLabels[image.kind] ?? image.kind} · {index === 0 ? 'capa' : `posição ${index + 1}`}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <form action={moveProductImageAction}>
                          <input type="hidden" name="id" value={image.id} />
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="direction" value="up" />
                          <button type="submit" className="text-[10.5px] text-muted underline underline-offset-2 hover:text-wine" disabled={index === 0}>
                            ↑
                          </button>
                        </form>
                        <form action={moveProductImageAction}>
                          <input type="hidden" name="id" value={image.id} />
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="direction" value="down" />
                          <button type="submit" className="text-[10.5px] text-muted underline underline-offset-2 hover:text-wine" disabled={index === product.images.length - 1}>
                            ↓
                          </button>
                        </form>
                        <form action={deleteProductImageAction}>
                          <input type="hidden" name="id" value={image.id} />
                          <input type="hidden" name="productId" value={product.id} />
                          <button type="submit" className="text-[10.5px] text-[#9B3A2E] underline underline-offset-2">
                            Remover
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form action={uploadProductImageAction} className="space-y-3 border-t border-line p-4">
              <input type="hidden" name="productId" value={product.id} />
              <div>
                <label htmlFor="image-file" className="field-label">Nova foto</label>
                <input id="image-file" name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="w-full text-[12px]" />
              </div>
              <div>
                <label htmlFor="alt" className="field-label">Texto alternativo</label>
                <input id="alt" name="alt" className="field-input" placeholder="Vestido midi em linho, vista frontal" />
              </div>
              <div>
                <label htmlFor="kind" className="field-label">Tipo</label>
                <select id="kind" name="kind" className="field-input">
                  <option value="PECA">Peça pronta</option>
                  <option value="DETALHE">Detalhe</option>
                  <option value="MOLDE">Prévia do molde</option>
                </select>
              </div>
              <Button type="submit" size="sm" variant="outline">Enviar foto</Button>
            </form>
          </section>

          <section className="rounded-2xl border border-line bg-paper">
            <div className="border-b border-line px-5 py-3">
              <h2 className="font-serif text-[17px] text-wine">Arquivos PDF</h2>
              <p className="mt-1 text-[11px] text-muted">Privados: só quem comprou baixa. Até 30 MB por arquivo.</p>
            </div>

            <div className="p-4">
              {product.files.length === 0 ? (
                <p className="text-[12px] text-muted">Nenhum PDF anexado. Sem arquivo, o molde não entrega nada.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {product.files.map((file) => (
                    <li key={file.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] text-ink">{file.fileName}</p>
                        <p className="text-[10.5px] text-muted">
                          {formatLabels[file.format]} · {formatBytes(file.sizeBytes)}
                          {file.pages ? ` · ${file.pages} pág.` : ''} · {file.checksum.slice(0, 8)}
                        </p>
                      </div>
                      <form action={deleteProductFileAction}>
                        <input type="hidden" name="id" value={file.id} />
                        <input type="hidden" name="productId" value={product.id} />
                        <button type="submit" className="text-[10.5px] text-[#9B3A2E] underline underline-offset-2">
                          Remover
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form action={uploadProductFileAction} className="space-y-3 border-t border-line p-4">
              <input type="hidden" name="productId" value={product.id} />
              <div>
                <label htmlFor="pdf-file" className="field-label">Novo PDF</label>
                <input id="pdf-file" name="file" type="file" accept="application/pdf" required className="w-full text-[12px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="format" className="field-label">Formato</label>
                  <select id="format" name="format" className="field-input">
                    <option value="A4">A4</option>
                    <option value="A0">A0</option>
                    <option value="PROJETOR">Projetor</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="pages" className="field-label">Páginas</label>
                  <input id="pages" name="pages" type="number" min={1} className="field-input" />
                </div>
              </div>
              <Button type="submit" size="sm" variant="outline">Enviar PDF</Button>
            </form>
          </section>

          <div className="rounded-2xl border border-line bg-[#F7F6F2] p-4 text-[11.5px] leading-relaxed text-muted">
            <p className="font-medium text-ink">Antes de publicar</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Fotos 3:4 com boa luz, sem texto por cima.</li>
              <li>Tabela de medidas preenchida e revisada.</li>
              <li>PDF conferido na escala 100%, com gabarito de teste.</li>
              <li>Preço entre R$ 10 e R$ 20 e descrição sem promessas que você não cumpre.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
