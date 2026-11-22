/**
 * Fonte única da marca e dos canais de suporte.
 * Trocar o nome da loja, o WhatsApp ou o e-mail exige editar apenas este arquivo
 * (ou as variáveis de ambiente correspondentes).
 */
export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || 'FioForma',
  wordmark: 'fioforma',
  tagline:
    process.env.NEXT_PUBLIC_BRAND_TAGLINE?.trim() ||
    'Moldes de costura em PDF, feitos para imprimir e costurar',
  shortDescription:
    'Moldes digitais de costura em PDF, com ficha técnica completa, tabela de medidas e arquivos prontos para imprimir em casa.',
  support: {
    whatsapp: process.env.NEXT_PUBLIC_STORE_WHATSAPP?.trim() || '[WHATSAPP]',
    email: process.env.NEXT_PUBLIC_STORE_EMAIL?.trim() || '[EMAIL]',
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM?.trim() || '',
    hours: 'Segunda a sexta, 9h às 18h',
  },
  legal: {
    owner: '[RAZÃO SOCIAL]',
    cnpj: '[CNPJ — MEI]',
    address: '[ENDEREÇO]',
  },
  licenseSummary:
    'Você pode vender as peças que costurar com este molde, sem limite. Não pode compartilhar, revender ou redistribuir o arquivo em PDF.',
} as const;

export type Brand = typeof brand;

/** Um placeholder é um valor entre colchetes, ainda não fornecido pelo dono da loja. */
export function isPlaceholder(value: string | null | undefined): boolean {
  if (!value) return true;
  return /^\[.*\]$/.test(value.trim());
}

export function whatsappLink(message?: string): string | null {
  if (isPlaceholder(brand.support.whatsapp)) return null;
  const digits = brand.support.whatsapp.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

export function mailtoLink(subject?: string): string | null {
  if (isPlaceholder(brand.support.email)) return null;
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return `mailto:${brand.support.email}${query}`;
}
