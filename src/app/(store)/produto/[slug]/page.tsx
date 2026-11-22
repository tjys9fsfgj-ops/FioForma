import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { addToCartAction } from '@/app/actions/cart';
import { Gallery } from '@/components/product/gallery';
import { ProductCard } from '@/components/product/product-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section';
import { brand } from '@/config/brand';
import {
  brl,
  difficultyLabels,
  formatLabels,
  formatBytes,
  pluralize,
} from '@/lib/format';
import { renderMarkdown } from '@/lib/markdown';
import { getProductBySlug, getRelatedProducts } from '@/lib/products';
import { getSiteUrl } from '@/lib/site';
import { parseJson } from '@/lib/utils';

type Props = { params: Promise<{ slug: string }> };

type FaqItem = { question: string; answer: string };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Molde não encontrado' };

  const description =
    product.seoDescription || product.tagline || product.description.replace(/[#*_]/g, '').slice(0, 155);
  const image = product.images[0] ? `/api/media/${product.images[0].mediaId}` : undefined;

  return {
    title: product.seoTitle || product.name,
    description,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      type: 'website',
      title: `${product.name} — molde digital`,
      description,
      url: `/produto/${product.slug}`,
      images: image ? [{ url: image, alt: product.images[0]?.alt ?? product.name }] : undefined,
    },
  };
}

function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-4 last:border-b-0 sm:grid-cols-[190px_1fr] sm:gap-6">
      <dt className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-clay">{label}</dt>
      <dd className="text-[14px] leading-relaxed text-ink/90">{children}</dd>
    </div>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, siteUrl] = await Promise.all([getRelatedProducts(product), getSiteUrl()]);
  const sizes = parseJson<string[]>(product.sizesIncluded, []);
  const faq = parseJson<FaqItem[]>(product.spec?.faq, []);
  const spec = product.spec;

  const extraLabels = Array.from(
    new Set(
      product.sizeCharts.flatMap((chart) =>
        chart.rows.flatMap((row) => parseJson<{ label: string; value: string }[]>(row.extra, []).map((e) => e.label)),
      ),
    ),
  );
  const hasBust = product.sizeCharts.some((chart) => chart.rows.some((row) => row.bustCm !== null));
  const hasWaist = product.sizeCharts.some((chart) => chart.rows.some((row) => row.waistCm !== null));
  const hasHip = product.sizeCharts.some((chart) => chart.rows.some((row) => row.hipCm !== null));

  const printInstructions =
    spec?.printInstructions ||
    'Imprima em escala 100% (tamanho real), sem “ajustar à página”. Antes de cortar, confira o quadrado de teste de 5 × 5 cm com uma régua.';

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.tagline ?? product.description.slice(0, 300),
    image: product.images.map((image) => `${siteUrl}/api/media/${image.mediaId}`),
    sku: product.id,
    brand: { '@type': 'Brand', name: brand.name },
    category: product.category?.name,
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/produto/${product.slug}`,
      priceCurrency: 'BRL',
      price: (product.priceCents / 100).toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Moldes', item: `${siteUrl}/catalogo` },
      ...(product.category
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: product.category.name,
              item: `${siteUrl}/categoria/${product.category.slug}`,
            },
          ]
        : []),
      { '@type': 'ListItem', position: 4, name: product.name, item: `${siteUrl}/produto/${product.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="container-page pt-6">
        <nav aria-label="Trilha de navegação" className="text-[11.5px] text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-forest">
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/catalogo" className="hover:text-forest">
                Moldes
              </Link>
            </li>
            {product.category ? (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={`/categoria/${product.category.slug}`} className="hover:text-forest">
                    {product.category.name}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink/70">
              {product.name}
            </li>
          </ol>
        </nav>
      </div>

      <div className="container-page grid gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-12">
        <div className="animate-rise">
          <Gallery
            images={product.images.map((image) => ({
              id: image.id,
              mediaId: image.mediaId,
              alt: image.alt,
              kind: image.kind,
            }))}
            productName={product.name}
          />
        </div>

        <div className="rounded-[2rem] border border-line bg-white p-6 shadow-soft sm:p-8 lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            {product.collection ? (
              <Link href={`/colecoes/${product.collection.slug}`}>
                <Badge tone="sage">{product.collection.name}</Badge>
              </Link>
            ) : null}
            <Badge>{difficultyLabels[product.difficulty]}</Badge>
            {sizes.length ? <Badge>Tam. {sizes.join(' · ')}</Badge> : null}
          </div>

          <h1 className="mt-5 text-[clamp(2rem,4vw,3rem)] leading-[1.04]">{product.name}</h1>
          {product.tagline ? <p className="mt-3 text-[15.5px] leading-relaxed text-muted">{product.tagline}</p> : null}

          <div className="mt-6 flex items-baseline gap-3">
            <p className="font-serif text-[34px] leading-none text-forest">{brl(product.priceCents)}</p>
            {product.compareAtCents && product.compareAtCents > product.priceCents ? (
              <p className="text-[14px] text-muted line-through">{brl(product.compareAtCents)}</p>
            ) : null}
          </div>
          <p className="mt-1 text-[12px] text-muted">Pagamento único. Sem assinatura.</p>

          <form action={addToCartAction} className="mt-6">
            <input type="hidden" name="productId" value={product.id} />
            <Button type="submit" size="lg" className="w-full">
              Comprar molde
              <span aria-hidden="true">→</span>
            </Button>
          </form>

          <ul className="mt-6 space-y-2.5 text-[13px] text-muted">
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage-200 text-[9px] font-bold text-forest">✓</span>
              Download imediato depois da confirmação do pagamento.
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage-200 text-[9px] font-bold text-forest">✓</span>
              Re-download ilimitado na sua biblioteca.
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage-200 text-[9px] font-bold text-forest">✓</span>
              Pix ou cartão de crédito. Sem boleto.
            </li>
          </ul>

          <div className="mt-6 rounded-2xl bg-sage-100 p-4 text-[12.5px] leading-relaxed text-forest/80">
            <p>
              <strong className="font-medium text-ink">Licença:</strong> {brand.licenseSummary}{' '}
              <Link href="/licenca" className="underline decoration-line underline-offset-4 hover:text-forest">
                Ler a licença completa
              </Link>
              .
            </p>
          </div>

          <details className="mt-4 rounded-2xl border border-line px-4 py-3.5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] font-medium text-ink marker:content-none [&::-webkit-details-marker]:hidden">
              Descrição do molde
              <span aria-hidden="true" className="text-muted">+</span>
            </summary>
            <div
              className="prose-atelier mt-4 text-[14px]"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(product.description) }}
            />
          </details>
        </div>
      </div>

      <section className="container-page py-10">
        <SectionHeading index="01" eyebrow="Ficha técnica" title="Tudo o que vem com este molde." />
        <dl className="mt-8 rounded-[2rem] border border-line bg-white px-6 shadow-soft sm:px-10">
          {sizes.length ? <SpecRow label="Tamanhos incluídos">{sizes.join(' · ')}</SpecRow> : null}
          {spec?.fabricRecommendation ? (
            <SpecRow label="Tecido recomendado">
              <span className="whitespace-pre-line">{spec.fabricRecommendation}</span>
            </SpecRow>
          ) : null}
          {spec?.yardage ? (
            <SpecRow label="Metragem por tamanho">
              <span className="whitespace-pre-line">{spec.yardage}</span>
            </SpecRow>
          ) : null}
          {spec?.notions ? (
            <SpecRow label="Aviamentos">
              <span className="whitespace-pre-line">{spec.notions}</span>
            </SpecRow>
          ) : null}
          <SpecRow label="Nível de dificuldade">
            {difficultyLabels[product.difficulty]}
            {product.difficulty ? ` — ${product.difficulty.toLowerCase() === 'iniciante' ? 'primeiras costuras' : 'peças com mais detalhes'}` : ''}
          </SpecRow>
          {spec?.seamAllowance ? <SpecRow label="Margem de costura">{spec.seamAllowance}</SpecRow> : null}
          {product.files.length ? (
            <SpecRow label="Arquivos incluídos">
              <ul className="space-y-1">
                {product.files.map((file) => (
                  <li key={file.id}>
                    {formatLabels[file.format]} — {file.fileName}
                    {file.pages ? ` · ${file.pages} ${pluralize(file.pages, 'folha', 'folhas')}` : ''} ·{' '}
                    {formatBytes(file.sizeBytes)}
                  </li>
                ))}
              </ul>
            </SpecRow>
          ) : null}
          {spec?.layersAvailable ? <SpecRow label="Camadas">PDF com camadas por tamanho.</SpecRow> : null}
          {spec?.projectorAvailable ? <SpecRow label="Projetor">Arquivo próprio para projeção.</SpecRow> : null}
          {spec?.pageCount ? (
            <SpecRow label="Número de folhas">{spec.pageCount} folhas no total</SpecRow>
          ) : null}
          <SpecRow label="Instruções de impressão">{printInstructions}</SpecRow>
        </dl>
      </section>

      {product.sizeCharts.some((chart) => chart.rows.length > 0) ? (
        <section className="container-page py-10">
          <SectionHeading
            index="02"
            eyebrow="Medidas do corpo"
            title="Tabela de medidas em centímetros."
            description="Meça o corpo, sem roupa por cima, e compare com a tabela. Em caso de dúvida entre dois tamanhos, escolha o maior e ajuste na prova."
          />
          <div className="mt-8 space-y-10">
            {product.sizeCharts.map((chart) => (
              <div key={chart.id}>
                <h3 className="font-serif text-[19px] text-ink">{chart.title}</h3>
                <div className="rounded-2xl mt-3 overflow-x-auto border border-line bg-white">
                  <table className="w-full min-w-[520px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-ink/15">
                        <th scope="col" className="sticky left-0 bg-white px-4 py-3 text-[10.5px] uppercase tracking-[0.12em] text-muted">
                          Tamanho
                        </th>
                        {hasBust ? <th scope="col" className="px-4 py-3 text-[10.5px] uppercase tracking-[0.12em] text-muted">Busto</th> : null}
                        {hasWaist ? <th scope="col" className="px-4 py-3 text-[10.5px] uppercase tracking-[0.12em] text-muted">Cintura</th> : null}
                        {hasHip ? <th scope="col" className="px-4 py-3 text-[10.5px] uppercase tracking-[0.12em] text-muted">Quadril</th> : null}
                        {extraLabels.map((label) => (
                          <th key={label} scope="col" className="px-4 py-3 text-[10.5px] uppercase tracking-[0.12em] text-muted">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chart.rows.map((row) => {
                        const extras = parseJson<{ label: string; value: string }[]>(row.extra, []);
                        return (
                          <tr key={row.id} className="border-b border-line last:border-0">
                            <th scope="row" className="sticky left-0 bg-white px-4 py-3 font-serif text-[15px] font-normal text-forest">
                              {row.size}
                            </th>
                            {hasBust ? <td className="px-4 py-3 text-[14px]">{row.bustCm ?? '—'}</td> : null}
                            {hasWaist ? <td className="px-4 py-3 text-[14px]">{row.waistCm ?? '—'}</td> : null}
                            {hasHip ? <td className="px-4 py-3 text-[14px]">{row.hipCm ?? '—'}</td> : null}
                            {extraLabels.map((label) => (
                              <td key={label} className="px-4 py-3 text-[14px]">
                                {extras.find((extra) => extra.label === label)?.value ?? '—'}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {chart.notes ? <p className="mt-2 text-[12px] text-muted">{chart.notes}</p> : null}
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11.5px] text-muted">
            Margem de costura não incluída na tabela. Na dúvida entre dois tamanhos, escolha o maior.
          </p>
        </section>
      ) : null}

      <section className="container-page py-10">
        <SectionHeading index="03" eyebrow="Impressão e montagem" title="Como imprimir sem perder a escala." />
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: 'Escala 100%',
              text: 'No diálogo de impressão, escolha “Tamanho real” ou 100%. Nunca “Ajustar à página”.',
            },
            {
              title: 'Gabarito de teste',
              text: 'Meça o quadrado de 5 × 5 cm impresso. Se estiver menor ou maior, a escala está errada.',
            },
            {
              title: 'Monte as folhas',
              text: 'Cada página tem marcações de canto e numeração. Una pelas setas antes de cortar o papel.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-line bg-white p-5">
              <h3 className="font-serif text-[18px] text-ink">{item.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{item.text}</p>
            </div>
          ))}
        </div>
        <Link href="/guias" className="link-underline mt-6 inline-block text-[13px] text-forest">
          Ver o guia completo de impressão e montagem
        </Link>
      </section>

      {faq.length > 0 ? (
        <section className="container-page py-10">
          <SectionHeading index="04" eyebrow="Dúvidas" title="Perguntas sobre este molde." />
          <div className="mt-8 space-y-3">
            {faq.map((item, index) => (
              <details key={`${item.question}-${index}`} className="rounded-2xl border border-line bg-white px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14.5px] text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-100 text-forest">+</span>
                </summary>
                <p className="mt-3 max-w-2xl whitespace-pre-line text-[13.5px] leading-relaxed text-muted">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="container-page py-12">
          <SectionHeading index="05" eyebrow="Combina com" title="Outros moldes para a mesma mesa." action={{ href: '/catalogo', label: 'Ver catálogo' }} />
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {related.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="h-24 lg:hidden" aria-hidden="true" />

      <div className="fixed inset-x-3 bottom-3 z-40 rounded-full border border-line bg-white/95 py-2 pl-6 pr-2 shadow-float backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-serif text-[19px] leading-tight text-forest">{brl(product.priceCents)}</p>
            <p className="text-[11px] text-muted">Download imediato</p>
          </div>
          <form action={addToCartAction}>
            <input type="hidden" name="productId" value={product.id} />
            <Button type="submit">Comprar molde</Button>
          </form>
        </div>
      </div>
    </>
  );
}
