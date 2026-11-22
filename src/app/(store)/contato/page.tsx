import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/site/contact-form';
import { brand, isPlaceholder } from '@/config/brand';
import { contactChannels } from '@/lib/contact';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com o ateliê FioForma: dúvidas sobre moldes, impressão, pagamento ou acesso aos arquivos.',
  alternates: { canonical: '/contato' },
};

export default async function ContactPage() {
  const settings = await getSettings();
  const contact = contactChannels(settings);
  const legal = [brand.legal.owner, brand.legal.cnpj].filter((value) => !isPlaceholder(value));

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <p className="eyebrow">Contato</p>
          <h1 className="mt-3 text-[clamp(2rem,4.2vw,3rem)] leading-[1.05]">Fale com o ateliê.</h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
            Dúvidas sobre tamanho, tecido, impressão ou acesso aos arquivos? Escreva. Respondemos em até dois
            dias úteis.
          </p>

          <dl className="mt-8 space-y-4 border-t border-rule pt-6 text-[13.5px]">
            {contact.email ? (
              <div>
                <dt className="eyebrow text-[10px]">E-mail</dt>
                <dd className="mt-1">
                  <a href={contact.email.href} className="link-underline text-wine">
                    {contact.email.label}
                  </a>
                </dd>
              </div>
            ) : null}
            {contact.whatsapp ? (
              <div>
                <dt className="eyebrow text-[10px]">WhatsApp</dt>
                <dd className="mt-1">
                  <a href={contact.whatsapp.href} target="_blank" rel="noreferrer" className="link-underline text-wine">
                    Abrir conversa
                  </a>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="eyebrow text-[10px]">Horário</dt>
              <dd className="mt-1 text-muted">{settings.supportHours}</dd>
            </div>
          </dl>

          <div className="mt-8 border border-rule bg-paper p-4 text-[12px] leading-relaxed text-muted">
            <p className="font-medium text-ink">Antes de escrever</p>
            <p className="mt-1">
              Boa parte das dúvidas de impressão e acesso está no{' '}
              <Link href="/faq" className="text-wine underline underline-offset-4">
                FAQ
              </Link>{' '}
              e no{' '}
              <Link href="/guias" className="text-wine underline underline-offset-4">
                guia de impressão
              </Link>
              .
            </p>
          </div>

          {legal.length ? <p className="mt-6 text-[11px] leading-relaxed text-muted">{legal.join(' · ')}</p> : null}
        </div>

        <div className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
          <h2 className="font-serif text-[22px] text-wine">Escreva para nós</h2>
          <p className="mt-1 text-[12.5px] text-muted">
            Se for sobre um pedido, informe o número (FF-…) para agilizar.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
