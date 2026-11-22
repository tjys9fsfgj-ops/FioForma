import Link from 'next/link';
import { brand } from '@/config/brand';
import { contactChannels } from '@/lib/contact';
import { getSettings } from '@/lib/settings';
import { NewsletterForm } from './newsletter-form';

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
  const contact = contactChannels(settings);

  return (
    <footer className="mt-24 bg-ink text-linen">
      <div className="container-page py-16">
        <div className="border-b border-linen/15 pb-10 text-center">
          <p className="font-serif text-[30px] font-semibold uppercase tracking-[0.14em] text-linen">{brand.name}</p>
          <p className="mx-auto mt-3 max-w-md font-serif text-[18px] italic text-linen/75">{settings.tagline}</p>
        </div>

        <div className="grid gap-10 border-b border-linen/15 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="mb-4 text-[11px] font-medium uppercase tracking-eyebrow text-linen/55">{column.title}</p>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[14px] text-linen/85 transition-colors hover:text-paper">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-eyebrow text-linen/55">Atendimento</p>
            <ul className="space-y-2.5 text-[14px] text-linen/85">
              {contact.email ? (
                <li>
                  <a href={contact.email.href} className="underline decoration-linen/30 underline-offset-4 hover:decoration-linen">
                    {contact.email.label}
                  </a>
                </li>
              ) : null}
              {contact.whatsapp ? (
                <li>
                  <a href={contact.whatsapp.href} target="_blank" rel="noreferrer" className="underline decoration-linen/30 underline-offset-4 hover:decoration-linen">
                    WhatsApp
                  </a>
                </li>
              ) : null}
              {!contact.email && !contact.whatsapp ? (
                <li>
                  <Link href="/contato" className="hover:text-paper">
                    Fale com a gente pelo formulário de contato
                  </Link>
                </li>
              ) : (
                <li className="text-linen/60">{settings.supportHours}</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-xl py-10 text-center">
          <p className="font-serif text-[24px] text-linen">Cartas do ateliê</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-linen/70">
            Lançamentos, notas de modelagem e um aviso quando entra molde novo.
          </p>
          <NewsletterForm />
        </div>

        <div className="flex flex-col gap-3 border-t border-linen/15 pt-6 text-[12px] text-linen/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}. Todos os direitos reservados.
          </p>
          <p className="max-w-xl sm:text-right">
            Moldes digitais para uso pessoal e venda das peças costuradas. Proibida a redistribuição dos arquivos.
          </p>
        </div>
      </div>
    </footer>
  );
}
