import Link from 'next/link';
import type { Metadata } from 'next';
import { brand } from '@/config/brand';
import { ButtonLink } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section';
import { PatternPlaceholder } from '@/components/product/pattern-placeholder';
import { ProductCard } from '@/components/product/product-card';
import { getLatestProducts, listCollections } from '@/lib/products';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = {
  title: `${brand.name} — moldes de costura em PDF`,
  description: brand.shortDescription,
  alternates: { canonical: '/' },
};

const steps = [
  {
    title: 'Escolha o molde',
    text: 'Veja fotos, tamanhos, tabela de medidas e o que vem em cada arquivo antes de comprar.',
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
    text: 'Imprima em escala 100%, monte as folhas pelo gabarito e siga a ficha técnica.',
  },
];

const benefits = [
  {
    title: 'Pagamento seguro',
    text: 'Pix e cartão processados pelo Mercado Pago. Nenhum dado de cartão passa pela loja.',
    icon: (
      <path d="M4 8h16v10H4zM4 11h16M8 15h4" stroke="currentColor" strokeWidth="1.3" fill="none" />
    ),
  },
  {
    title: 'Acesso imediato',
    text: 'Assim que o pagamento é confirmado, os arquivos aparecem na sua biblioteca.',
    icon: <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14" stroke="currentColor" strokeWidth="1.3" fill="none" />,
  },
  {
    title: 'Baixe de novo',
    text: 'Re-download ilimitado, sem prazo. O molde é seu para sempre.',
    icon: (
      <path
        d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4h-4"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
    ),
  },
  {
    title: 'Licença para vender',
    text: 'Pode vender as peças que costurar, sem limite. Só não pode revender o PDF.',
    icon: (
      <path
        d="M12 4l7 3v5c0 4-3 6.5-7 8-4-1.5-7-4-7-8V7l7-3Z"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
    ),
  },
];

const marquee = [
  'Tamanhos PP ao G',
  'PDF para imprimir em casa',
  'Pix e cartão',
  'Download imediato',
  'Baixe quantas vezes quiser',
  'Licença para vender as peças',
];

const collectionTints = ['bg-sand', 'bg-rosewood', 'bg-sand'];

export default async function HomePage() {
  const [collections, latest, settings] = await Promise.all([listCollections(), getLatestProducts(4), getSettings()]);
  const visibleCollections = collections.filter((collection) => collection._count.products > 0).slice(0, 3);

  return (
    <>
      <section className="container-page pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-wine text-paper sm:rounded-[2.75rem]">
          <svg
            className="pointer-events-none absolute -left-24 bottom-[-60px] h-[420px] w-[420px] text-sand/25"
            viewBox="0 0 200 200"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="100" cy="100" r="96" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
            <circle cx="100" cy="100" r="64" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
          </svg>

          <div className="relative grid items-center gap-10 px-6 py-12 sm:px-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:px-16 lg:py-20">
            <div className="animate-rise">
              <p className="inline-flex items-center gap-2 rounded-full border border-paper/20 bg-paper/10 px-4 py-1.5 text-[12px] font-medium text-paper">
                <span className="h-1.5 w-1.5 rounded-full bg-rosewood" aria-hidden="true" />
                Moldes digitais · PP ao G
              </p>
              <h1 className="mt-6 text-[clamp(2.5rem,6.2vw,4.6rem)] leading-[0.98] tracking-[-0.035em] text-paper">
                O molde certo,
                <br />
                na <span className="italic text-rosewood">escala certa.</span>
              </h1>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-paper/80">
                {settings.tagline}. Ficha técnica completa, tabela de medidas em centímetros e arquivos
                prontos para a sua impressora.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <ButtonLink href="/catalogo" size="lg" variant="paper">
                  Explorar moldes
                  <span aria-hidden="true">→</span>
                </ButtonLink>
                <ButtonLink href="#como-funciona" variant="outline-light" size="lg">
                  Como funciona
                </ButtonLink>
              </div>
              <p className="mt-6 text-[12.5px] text-paper/60">Compra avulsa, sem assinatura. Re-download ilimitado.</p>
            </div>

            <div className="relative mx-auto h-[400px] w-full max-w-[460px] animate-rise animate-delay-2 sm:h-[500px] lg:mx-0 lg:ml-auto">
              <div className="absolute right-0 top-0 h-[86%] w-[62%] overflow-hidden rounded-none">
                <PatternPlaceholder label="Peça pronta" seed={0} />
              </div>
              <div className="absolute bottom-0 left-0 h-[60%] w-[46%] overflow-hidden rounded-none ring-4 ring-wine">
                <PatternPlaceholder label="Detalhe" seed={1} />
              </div>
              <div className="absolute -right-1 bottom-10 w-[188px] rounded-3xl bg-paper p-4 text-ink shadow-paper sm:-right-4">
                <p className="text-[11px] font-semibold text-wine">Na ficha técnica</p>
                <ul className="mt-2.5 space-y-2 text-[12px]">
                  <li className="flex justify-between gap-2 border-b border-line pb-2">
                    <span className="text-muted">Tamanhos</span>
                    <span className="font-semibold">PP · P · M · G</span>
                  </li>
                  <li className="flex justify-between gap-2 border-b border-line pb-2">
                    <span className="text-muted">Medidas</span>
                    <span className="font-semibold">em cm</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-muted">Arquivos</span>
                    <span className="font-semibold">A4 · A0</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 overflow-hidden border-y border-line bg-rosewood py-4" aria-label="Diferenciais da loja">
        <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap pr-10 text-[14px] font-medium text-wine">
          {[...marquee, ...marquee].map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-10" aria-hidden={index >= marquee.length}>
              {item}
              <span className="text-wine" aria-hidden="true">
                ✦
              </span>
            </span>
          ))}
        </div>
      </div>

      {visibleCollections.length > 0 ? (
        <section className="container-page py-20">
          <SectionHeading
           
            eyebrow="Coleções"
            title="Moldes organizados por ideia, não por sorte."
            description="Cada coleção reúne peças que conversam entre si — mesmo tecido, mesma época, mesmo gesto."
            action={{ href: '/colecoes', label: 'Ver todas' }}
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCollections.map((collection, index) => (
              <Link
                key={collection.id}
                href={`/catalogo?colecao=${collection.slug}`}
                className={`group relative flex flex-col overflow-hidden rounded-[2rem] p-3 transition-transform duration-300 hover:-translate-y-1 ${collectionTints[index % collectionTints.length]}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
                  <PatternPlaceholder label={collection.name} seed={index + 1} />
                </div>
                <div className="flex items-end justify-between gap-4 px-3 pb-3 pt-5">
                  <div>
                    <h3 className="font-serif text-[24px] leading-tight text-wine">{collection.name}</h3>
                    <p className="mt-1 text-[13px] text-wine/70">
                      {collection._count.products} {collection._count.products === 1 ? 'molde' : 'moldes'}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wine text-paper transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {latest.length > 0 ? (
        <section className="container-page pb-20 pt-4">
          <SectionHeading
            eyebrow="Lançamentos"
            title="O que acabou de sair da mesa de corte."
            action={{ href: '/catalogo?ordem=novidades', label: 'Ver todos os moldes' }}
          />
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {latest.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      <section id="como-funciona" className="container-page scroll-mt-28 pb-20">
        <div className="rounded-[2rem] bg-rosewood px-6 py-14 sm:rounded-[2.75rem] sm:px-12 lg:px-16">
          <SectionHeading
            eyebrow="Como funciona"
            title="Quatro passos entre o molde e a peça pronta."
          />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex flex-col rounded-3xl bg-paper p-6 shadow-paper">
                <span className="font-serif text-[44px] leading-none text-wine">0{index + 1}</span>
                <h3 className="mt-5 font-serif text-[21px] leading-snug text-wine">{step.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3 text-[13px] font-semibold">
            <Link href="/guias" className="rounded-full border border-wine/25 px-5 py-2.5 text-wine hover:border-wine hover:bg-paper">
              Guia de impressão e montagem
            </Link>
            <Link href="/faq" className="rounded-full border border-wine/25 px-5 py-2.5 text-wine hover:border-wine hover:bg-paper">
              Perguntas frequentes
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page pb-20">
        <SectionHeading
          eyebrow="Por que comprar aqui"
          title="Feito para quem costura de verdade."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className={`rounded-3xl p-6 ${index % 2 === 0 ? 'bg-sand' : 'bg-sand'}`}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-wine text-paper">
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  {benefit.icon}
                </svg>
              </span>
              <h3 className="mt-5 font-serif text-[21px] leading-snug text-wine">{benefit.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-wine/75">{benefit.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-4">
        <div className="relative overflow-hidden rounded-[2rem] bg-sand px-6 py-14 sm:rounded-[2.75rem] sm:px-12 lg:px-16">
          <svg
            className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 text-wine/15"
            viewBox="0 0 200 200"
            fill="none"
            aria-hidden="true"
          >
            <path d="M10 120c40-60 80-60 120-20s60 20 60 20" stroke="currentColor" strokeWidth="1.2" strokeDasharray="5 6" />
            <circle cx="150" cy="150" r="30" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <div className="relative max-w-2xl">
            <p className="pill">Ateliê</p>
            <h2 className="mt-5 text-[clamp(2rem,4vw,3rem)] leading-[1.06]">Cada molde é um documento de trabalho.</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-wine/80">
              Margem de costura marcada, tabela de medidas do corpo, metragem por tamanho e instruções de
              impressão. O que você precisa saber antes de cortar está escrito — não fica na dúvida.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/sobre">Conhecer a marca</ButtonLink>
              <ButtonLink href="/contato" variant="outline">
                Falar com o ateliê
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
