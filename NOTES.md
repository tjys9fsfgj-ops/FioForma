# Estado do desenvolvimento (nota interna)

## Pronto
- Loja completa: home, catálogo, coleções, categoria, produto, carrinho, checkout, pedido, demo de pagamento, conta, biblioteca, pedidos, dados, blog, páginas, contato, 404, sitemap, robots.
- Admin completo: dashboard, produtos, coleções, categorias, pedidos (lista/detalhe e ações), cupons, clientes, páginas/blog, relatórios com CSV, configurações.
- Pagamento: gateway simulator e Mercado Pago (Checkout Pro + webhook HMAC). Pedido pago só por confirmação verificada.
- Entrega: PDFs privados no banco (S3 opcional), links JWT de 10 min, rate limit e logs.
- Seed: admin, 6 moldes demo com PDF provisório, 3 coleções, 6 categorias, 10 páginas/posts, cupom BEMVINDA10.
- README.md, docs/OPERACAO.md, Dockerfile, .dockerignore, deploy declarado, dev command `pnpm dev`, public/manus-routes.json.
- `pnpm test` com 11 asserções passando; build de produção OK.

## Correções recentes
- `inputToCents` aceita "19.90" e "1.234,56" sem inflar preço.
- `formatBytes` usa vírgula decimal.
- Crypto movido de `lib/utils` para `lib/crypto`; `COUPON_COOKIE` em `lib/checkout-cookies`.
- Scripts db usam `node scripts/prisma.mjs`; campo `pnpm` removido; `bodySizeLimit` 32mb.
- Admin: `eyebrow` aceita ReactNode; título absoluto; gráfico de receita com altura em px.

## Observações
- DATABASE_URL é injetada só no runtime da plataforma. Para consultas manuais, ler de `/proc/<pid do next-server>/environ`.
- Falta apenas commit/push do checkpoint e resposta final.
