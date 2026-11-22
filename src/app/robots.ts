import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/minha-conta',
          '/carrinho',
          '/checkout',
          '/pedido/',
          '/pagamento/',
          '/entrar',
          '/criar-conta',
          '/recuperar-senha',
          '/redefinir-senha',
          '/acesso',
          '/api/',
          '/404',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
