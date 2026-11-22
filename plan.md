# FioForma — plano de implementação

Loja de moldes de costura em PDF, venda avulsa, público de costureiras iniciantes e intermediárias. O brief é a fonte de requisitos; este plano registra as decisões técnicas e de design.

## Stack e desvios justificados

| Brief | Implementação | Motivo |
| --- | --- | --- |
| Next.js + TypeScript (SSR) | Next.js 15 (App Router, Server Components) + TypeScript | Mantido. SSR/ISR para SEO e Server Actions para formulários. |
| PostgreSQL gerenciado + Prisma | MySQL/TiDB gerenciado da plataforma + Prisma | O ambiente entrega um banco MySQL gerenciado, com backup e conexão TLS, sem custo de conta externa. O schema é portável: trocar `provider` para `postgresql` e regenerar a migração leva a Neon/Supabase. Tudo em centavos e sem SQL específico de MySQL além de DDL. |
| Bucket S3 privado | Adaptador de armazenamento com drivers `db` e `s3` | O `db` (LongBlob privado, sem URL pública) é o padrão para o MVP funcionar sem credenciais. O driver S3/R2 (URL assinada de curta duração) está implementado e é ativado por `STORAGE_DRIVER=s3`. |
| Auth.js, e-mail e senha | Auth.js v5 (Credentials, JWT) + bcrypt | Mantido, com sessão em cookie HttpOnly `SameSite=None; Secure` para o Preview em iframe. Visitante compra sem conta e recebe link de acesso. |
| Mercado Pago | Interface `PaymentGateway` + adaptadores `mercadopago` e `simulator` | O adaptador real usa Checkout Pro e webhook com verificação de assinatura. Sem chaves, o modo `simulator` permite testar o fluxo completo localmente, sempre marcado como demonstração. Stripe fica como interface pronta. |
| Resend/Postmark | Adaptador `resend` + `console` | O modo `console` registra o e-mail no servidor para desenvolvimento. |
| Vercel/Netlify | Container na plataforma (Dockerfile) | Hospedagem gerenciada, sem VPS. O mesmo Dockerfile roda em Fly/Render/Vercel. |

Arquivos privados nunca são servidos por caminho estático: o download passa por `/api/download` com token assinado (5 min), vínculo ao direito de compra e registro em `DownloadLog`.

## Estrutura

```
src/app/(store)      páginas públicas e de conta (layout com header/footer)
src/app/(admin)      painel administrativo (layout próprio, exigindo ADMIN)
src/app/api          webhook, download, mídia, saúde
src/app/actions      Server Actions (carrinho, checkout, conta, admin, conteúdo)
src/components       UI reutilizável (cards, formulários, filtros, tabelas)
src/lib              domínio: produtos, carrinho, pedidos, pagamentos, arquivos, auth
src/config/brand.ts  marca, suporte e textos institucionais em um único lugar
prisma               schema, migração e seed
```

## Design

Estilos considerados: (1) editorial de moda com precisão de ateliê, 0.62; (2) brutalismo têxtil com grades expostas, 0.21; (3) minimalismo suíço com fotografia protagonista, 0.17. Escolhido: **editorial de moda com precisão de ateliê**.

- **Movimento**: revistas de moda independentes e cadernos de modelagem — papel, linha e tipografia.
- **Princípios**: o molde é documento, não brinquedo; hierarquia por tipografia e espaço, não por cor; cada informação técnica tem lugar fixo; nada de enfeite que não seja costura.
- **Cor**: papel off-white `#F7F6F2` como superfície, tinta `#222725`, verde profundo `#24483D` para ações e títulos, sálvia `#ABB8A8` só em fundos e detalhes finos. Contraste AA em texto e botões.
- **Layout**: assimétrico, com coluna editorial larga e margens generosas; seções numeradas como instruções de molde; imagens 4:5 com moldura de 1px.
- **Elementos assinatura**: linha de costura tracejada que atravessa seções e o wordmark; etiquetas de ficha técnica com rótulo em caixa alta e valor em serifada; numeração `01 —`.
- **Interação**: filtros em drawer no celular, tabela de medidas com rolagem, botão de compra fixo no mobile, foco visível e navegação por teclado.
- **Animação**: entrada suave de 12–16px, 600–700ms, uma vez por seção; linha de costura desenhada no hero; sem parallax.
- **Tipografia**: Fraunces (títulos, preço, números) + Inter (UI e corpo). Títulos com `clamp`, entrelinha curta; corpo 16–17px com 1.65.
- **Marca**: FioForma — moldes digitais para quem costura de verdade. Personalidade: precisa, acolhedora, sóbria.
- **Voz**: "O molde certo, impresso na escala certa." / "Escolha o molde. O resto é linha, tecido e tempo."
- **Wordmark**: "fioforma" em minúsculas, serifada, com uma linha de costura tracejada sob o nome terminando em agulha.
- **Cor própria**: verde ateliê `#24483D`.

## Escopo

MVP completo do brief: catálogo com busca/filtros/ordenação/paginação, produto com ficha configurável, carrinho, checkout visitante ou conta, Pix e cartão via Mercado Pago (sandbox) com webhook idempotente, entrega automática, biblioteca com re-download ilimitado e limite de taxa, conta (cadastro, login, recuperação, dados, pedidos), páginas institucionais e blog editáveis, admin (produtos, arquivos, coleções, categorias, pedidos, cupons, clientes, páginas, relatórios, configurações), SEO técnico, LGPD e acessibilidade.

Fora do MVP: avaliações, favoritos, kits, assinatura, multiusuário, boleto, nota fiscal, PDF em camadas, arquivos A0/projetor (apenas campos opcionais), Stripe (só interface).
