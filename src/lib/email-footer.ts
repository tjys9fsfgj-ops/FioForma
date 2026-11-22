import { contactChannels } from './contact';

/** Linha de contato do rodapé dos e-mails; vazia enquanto não houver canal real. */
export function emailFooterContact(settings: { email: string; whatsapp: string }): string {
  const { email, whatsapp } = contactChannels(settings);
  const parts = [email?.label, whatsapp ? `WhatsApp ${whatsapp.label}` : null].filter(Boolean);
  return parts.length ? `Dúvidas: ${parts.join(' · ')}` : '';
}
