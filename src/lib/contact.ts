import { isPlaceholder } from '@/config/brand';

export type ContactChannel = { href: string; label: string };

/**
 * Canais de contato prontos para exibir. Canal vazio ou com placeholder
 * ("[EMAIL]", "[WHATSAPP]") vira null e não deve aparecer na loja.
 */
export function contactChannels(settings: { email: string; whatsapp: string }): {
  email: ContactChannel | null;
  whatsapp: ContactChannel | null;
} {
  const email = settings.email?.trim();
  const phone = settings.whatsapp?.trim();
  const digits = phone ? phone.replace(/\D/g, '') : '';

  return {
    email: email && !isPlaceholder(email) && email.includes('@') ? { href: `mailto:${email}`, label: email } : null,
    whatsapp: phone && !isPlaceholder(phone) && digits.length >= 10 ? { href: `https://wa.me/${digits}`, label: phone } : null,
  };
}
