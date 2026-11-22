import Link from 'next/link';
import type { Metadata } from 'next';
import { brand } from '@/config/brand';
import { ButtonLink } from '@/components/ui/button';
import { Mat } from '@/components/ui/mat';
import { SectionHeading } from '@/components/ui/section';
import { ProductCard } from '@/components/product/product-card';
import { getLatestProducts, listCollections, type ProductCardData } from '@/lib/products';

export const metadata: Metadata = {
  title: `${brand.name} — moldes de costura em PDF`,
  description: brand.shortDescription,
  alternates: { canonical: '/' },
};

const steps = [
  {
    title: 'Escolha o molde',
    text: 'Veja tamanhos, tabela de medidas, plano de corte e o que vem em cada arquivo antes de comprar.',
  },
  {
    title: 'Pague com Pix ou cartão',
    text: 'Checkout seguro, com conta ou como visitante. Sem boleto e sem assinatura.',
  },
  {
    title: 'Baixe na hora',
    text: 'O PDF é liberado automaticamente depois da confirmação do pagamento, na sua biblioteca.',
  },
  {
    title: 'Imprima e costure',
    text: 'Imprima em escala 100%, monte as folhas pelo mapa e siga o passo a passo.',
  },
];

const benefits = [
  { title: 'Pagamento seguro', text: 'Pix e cartão processados pelo Mercado Pago. Nenhum dado de cartão passa pela loja.' },
  { title: 'Acesso imediato', text: 'Assim que o pagamento é confirmado, os arquivos aparecem na sua biblioteca.' },
  { title: 'Baixe de novo', text: 'Re-download ilimitado, sem prazo. O molde é seu para sempre.' },
  { title: 'Licença para vender', text: 'Pode vender as peças que costurar, sem limite. Só não pode revender o PDF.' },
];

function LookbookItem({ product, featured }: { product: ProductCardData; featured?: boolean }) {
  return (
    <Link href={`/produto/${product.slug}`} className={featured ? 'group mx-auto block w-[72%] sm:w-auto' : 'group hidden sm:block'}>
      <Mat caption={product.name} tone={featured ? 'rosewood' : 'sand'}>
        {product.imageId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media/${product.imageId}`}
            alt={product.imageAlt ?? product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        ) : null}
      </Mat>
    </Link>
  );
}

export default async function HomePage() {
  const [collections, latest] = await Promise.all([listCollections(), getLatestProducts(8)]);
  const visibleCollections = collections.filter((collection) => collection._count.products > 0);
  const lookbook = latest.slice(0, 3);
  const news = latest.slice(0, 4);

  return (
    <>
      <section className="container-page pt-14 text-center sm:pt-20">
        <p className="eyebrow">Moldes de costura em PDF</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-[clamp(2.6rem,6vw,4.25rem)] leading-[1.02]">
          O molde certo, na <em className="font-medium text-wine">escala certa</em>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-muted">
          Ficha técnica completa, tabela de medidas em centímetros e arquivos prontos para imprimir em casa, do PP ao GG.
        </p>
        <ButtonLink href="/catalogo" variant="outline" size="lg" className="mt-8">
          Conhecer os moldes
        </ButtonLink>
      </section>

      {lookbook.length === 3 ? (
        <section className="container-page pb-20 pt-14" aria-label="Destaques">
          <div className="grid items-end gap-6 sm:grid-cols-[1fr_1.3fr_1fr] lg:px-16">
            <LookbookItem product={lookbook[1]} />
            <LookbookItem product={lookbook[0]} featured />
            <LookbookItem product={lookbook[2]} />
          </div>
        </section>
      ) : null}

      {news.length ? (
        <section className="container-page border-t border-rule py-20">
          <SectionHeading
            eyebrow="Novidades"
            title="Saídos da mesa de corte"
            action={{ href: '/catalogo?ordem=novidades', label: 'Ver todos os moldes' }}
          />
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {news.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      {visibleCollections.length > 1 ? (
        <section className="container-page border-t border-rule py-20">
          <SectionHeading eyebrow="Coleções" title="Moldes organizados por ideia" action={{ href: '/colecoes', label: 'Ver todas' }} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCollections.slice(0, 3).map((collection) => {
              const cover = latest.find((product) => product.collectionName === collection.name);
              return (
                <Link key={collection.id} href={`/catalogo?colecao=${collection.slug}`} className="group block text-center">
                  <Mat>
                    {cover?.imageId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/media/${cover.imageId}`} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </Mat>
                  <h3 className="mt-4 text-[24px] group-hover:text-wine">{collection.name}</h3>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-2">
                    {collection._count.products} {collection._count.products === 1 ? 'molde' : 'moldes'}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section id="como-funciona" className="container-page scroll-mt-28 border-t border-rule py-20">
        <SectionHeading eyebrow="Como funciona" title="Quatro passos entre o molde e a peça pronta" />
        <ol className="mt-12 grid border-y border-rule sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="border-rule px-6 py-8 text-center [&:not(:last-child)]:border-b sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:[&:not(:last-child)]:border-r"
            >
              <span className="font-serif text-[40px] leading-none text-wine">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="mt-4 text-[22px] leading-snug">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap justify-center gap-8">
          <Link href="/guias" className="border-b border-ink pb-0.5 text-[11px] font-medium uppercase tracking-[0.18em] hover:border-wine hover:text-wine">
            Guia de impressão e montagem
          </Link>
          <Link href="/faq" className="border-b border-ink pb-0.5 text-[11px] font-medium uppercase tracking-[0.18em] hover:border-wine hover:text-wine">
            Perguntas frequentes
          </Link>
        </div>
      </section>

      <section className="container-page border-t border-rule py-20">
        <SectionHeading eyebrow="Por que comprar aqui" title="Feito para quem costura de verdade" />
        <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="border-t border-ink pt-5 text-center">
              <h3 className="text-[21px] leading-snug">{benefit.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{benefit.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-4">
        <div className="border border-rule bg-paper px-6 py-16 text-center shadow-paper sm:px-12">
          <p className="eyebrow">Ateliê</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-[clamp(2rem,4vw,2.8rem)] leading-[1.08]">
            Cada molde é um documento de trabalho
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted">
            Margem de costura marcada, tabela de medidas, metragem por tamanho, plano de corte e passo a passo. O que você
            precisa saber antes de cortar está escrito — não fica na dúvida.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/sobre">Conhecer a marca</ButtonLink>
            <ButtonLink href="/contato" variant="outline">
              Falar com o ateliê
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
