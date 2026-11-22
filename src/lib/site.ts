import { headers } from 'next/headers';

/**
 * URL pública do site. Em produção defina NEXT_PUBLIC_SITE_URL.
 * Fora isso, deriva dos cabeçalhos do proxy (nunca do host interno do container).
 */
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && !configured.includes('localhost')) return configured.replace(/\/$/, '');

  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'https';
    if (host) return `${proto}://${host}`;
  } catch {
    // fora de uma requisição (scripts)
  }

  return configured?.replace(/\/$/, '') || 'http://localhost:3000';
}

export async function absoluteUrl(path: string): Promise<string> {
  const base = await getSiteUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
