import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/site/contact-form';
import { brand, mailtoLink, whatsappLink } from '@/config/brand';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com o ateliê FioForma: dúvidas sobre moldes, impressão, pagamento ou acesso aos arquivos.',
  alternates: { canonical: '/contato' },
};

export default async function ContactPage() {
  const settings = await getSettings();
  const whatsapp = whatsappLink('Olá! Preciso de ajuda com um molde.');
  const email = mailtoLink('Contato pelo site — FioForma');

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

          <dl className="mt-8 space-y-4 border-t border-line pt-6 text-[13.5px]">
            <div>
              <dt className="eyebrow text-[10px]">E-mail</dt>
              <dd className="mt-1">
                {email ? (
                  <a href={email} className="link-underline text-wine">
                    {settings.email}
                  </a>
                ) : (
                  <span className="text-muted">{settings.email} (canal em criação)</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-[10px]">WhatsApp</dt>
              <dd className="mt-1">
                {whatsapp ? (
                  <a href={whatsapp} target="_blank" rel="noreferrer" className="link-underline text-wine">
                    Abrir conversa
                  </a>
                ) : (
                  <span className="text-muted">{settings.whatsapp} (canal em criação)</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-[10px]">Horário</dt>
              <dd className="mt-1 text-muted">{settings.supportHours}</dd>
            </div>
          </dl>

          <div className="rounded-2xl mt-8 border border-line bg-[#F2F0EA] p-4 text-[12px] leading-relaxed text-muted">
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

          <p className="mt-6 text-[11px] leading-relaxed text-muted">
            {brand.legal.owner} · {brand.legal.cnpj}
          </p>
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
