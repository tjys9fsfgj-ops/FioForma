import Link from 'next/link';
import { brand, mailtoLink, whatsappLink } from '@/config/brand';
import { getSettings } from '@/lib/settings';
import { NewsletterForm } from './newsletter-form';
import { Logo } from './logo';

const columns = [
  {
    title: 'Comprar',
    links: [
      { href: '/catalogo', label: 'Todos os moldes' },
      { href: '/colecoes', label: 'Coleções' },
      { href: '/catalogo?ordem=novidades', label: 'Lançamentos' },
      { href: '/guias', label: 'Guias de impressão' },
    ],
  },
  {
    title: 'Ajuda',
    links: [
      { href: '/faq', label: 'Perguntas frequentes' },
      { href: '/contato', label: 'Contato' },
      { href: '/reembolso', label: 'Reembolso' },
      { href: '/licenca', label: 'Licença de uso' },
    ],
  },
  {
    title: 'Institucional',
    links: [
      { href: '/sobre', label: 'Sobre a marca' },
      { href: '/blog', label: 'Blog' },
      { href: '/termos', label: 'Termos de uso' },
      { href: '/privacidade', label: 'Privacidade e LGPD' },
    ],
  },
];

export async function Footer() {
  const settings = await getSettings();
  const whatsapp = whatsappLink('Olá! Preciso de ajuda com um molde.');
  const email = mailtoLink('Ajuda com molde — FioForma');

  return (
    <footer className="mt-24 bg-forest text-paper">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr_1.2fr]">
          <div>
            <div className="[&_span]:text-paper [&_svg_path:first-of-type]:stroke-sage [&_svg_path:last-of-type]:fill-paper [&_svg_circle]:stroke-paper">
              <Logo />
            </div>
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-paper/75">{settings.tagline}</p>
            <div className="mt-6 space-y-2 text-[13.5px] text-paper/85">
              {email ? (
                <p>
                  <a href={email} className="underline decoration-paper/30 underline-offset-4 hover:decoration-paper">
                    {settings.email}
                  </a>
                </p>
              ) : (
                <p className="text-paper/60">E-mail: {settings.email}</p>
              )}
              {whatsapp ? (
                <p>
                  <a
                    href={whatsapp}
                    className="underline decoration-paper/30 underline-offset-4 hover:decoration-paper"
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                </p>
              ) : (
                <p className="text-paper/60">WhatsApp: {settings.whatsapp}</p>
              )}
              <p className="text-paper/60">{settings.supportHours}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-eyebrow text-sage">{column.title}</p>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-[14px] text-paper/80 transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white/[0.07] p-6">
            <p className="font-serif text-[22px] leading-snug text-paper">Cartas do ateliê</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-paper/75">
              Lançamentos, notas de modelagem e um aviso quando entra molde novo.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-paper/15 pt-6 text-[12px] text-paper/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}. Todos os direitos reservados.
          </p>
          <p className="max-w-xl sm:text-right">
            Moldes digitais para uso pessoal e venda das peças costuradas. Proibida a redistribuição dos
            arquivos.
          </p>
        </div>
      </div>
    </footer>
  );
}
