# FioForma — loja de moldes de costura em PDF

Loja digital de moldes de costura em PDF, venda avulsa, com entrega automática de arquivos privados, biblioteca de re-download, painel administrativo completo e checkout Pix/cartão via Mercado Pago.

Este documento cobre instalação, variáveis, deploy, backup, checklist de lançamento e a lista do que ainda depende de você (dados comerciais, chaves e textos jurídicos).

---

## 1. O que está pronto

- **Loja**: home editorial, catálogo com busca, filtros (coleção, categoria, tamanho, nível, faixa de preço), ordenação e paginação; páginas de coleção e categoria; página de produto com galeria, ficha técnica condicional, tabela de medidas, FAQ e botão de compra fixo no celular.
- **Carrinho e checkout**: carrinho por cookie, cupom de desconto, compra como visitante ou com conta, aceite de termos, escolha de Pix ou cartão.
- **Pedidos**: criação no servidor com preços recalculados, status pendente até confirmação do gateway, página de pedido com downloads, página de pagamento de demonstração (modo demo).
- **Entrega**: arquivos privados, links assinados de 10 minutos, limite de downloads por minuto, registro de cada download, re-download ilimitado na biblioteca.
- **Conta**: login, cadastro, recuperação de senha, acesso por link de uso único para quem comprou como visitante, biblioteca, pedidos, dados pessoais e troca de senha.
- **Conteúdo**: páginas institucionais dinâmicas, blog, guias, FAQ, contato, 404, sitemap e robots.
- **Admin**: dashboard, produtos (fotos, PDFs, ficha técnica, medidas, SEO), coleções, categorias, pedidos (marcar pago manualmente, reenviar e-mail, cancelar, reembolsar, nota interna), cupons, clientes, páginas/blog, relatórios com exportação CSV e configurações da loja.
- **Infra de qualidade**: SEO por página, JSON-LD de produto, Open Graph, acessibilidade (foco visível, rótulos, contraste, navegação por teclado), LGPD (consentimento de cookies, IP anonimizado, exclusão de conta), auditoria de ações administrativas.

O conteúdo de exemplo (moldes, textos, posts) é **demonstrativo** e está marcado no banco com `isDemo`. Substitua pelos seus arquivos e textos antes de vender.

---

## 2. Stack e decisões

| Camada | Escolha | Por quê |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript | SSR para SEO, server actions para formulários, um só deploy |
| Estilo | Tailwind CSS 3 + Fraunces/Inter | Direção editorial de moda, mobile-first |
| Banco | MySQL 8 / TiDB (Prisma ORM) | Banco gerenciado da plataforma, sem VPS; Prisma mantém portabilidade para Postgres |
| Autenticação | Auth.js v5 (credenciais + link de acesso) | Sessão própria, cookies httpOnly, senha com bcrypt |
| Pagamento | Mercado Pago Checkout Pro (Pix + cartão) | Pix e cartão no mesmo contrato, webhook assinado; Stripe apenas como interface futura |
| E-mail | Resend (ou console em desenvolvimento) | Simples, com domínio próprio |
| Arquivos | Banco (LongBlob) por padrão; S3/R2 opcional | Entrega privada sem depender de CDN público; troca por S3 quando o volume crescer |
| Markdown | marked | Conteúdo do blog e páginas editável pelo painel |

O plano detalhado e os desvios de stack justificados estão em [`plan.md`](./plan.md).

---

## 3. Requisitos

- Node.js 22+
- pnpm 10+
- Um banco MySQL 8 ou TiDB acessível (o DSN precisa aceitar TLS)
- Conta no Mercado Pago (produção e/ou sandbox) para vender de verdade
- Conta no Resend (ou outro provedor SMTP/API) para e-mails transacionais

---

## 4. Instalação local

```bash
# 1. dependências
pnpm install

# 2. variáveis de ambiente
cp .env.example .env.local
# edite .env.local com o DSN do banco, AUTH_SECRET etc.

# 3. banco
pnpm db:migrate        # aplica as migrações
pnpm db:seed           # cria admin, catálogo demo, páginas e cupom

# 4. desenvolvimento
pnpm dev               # http://localhost:3000
```

Comandos úteis:

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | servidor de desenvolvimento |
| `pnpm build` | build de produção (gera Prisma Client + Next) |
| `pnpm start` | sobe o build na porta `PORT` (padrão 3000) |
| `pnpm typecheck` | checagem de tipos |
| `pnpm db:migrate` | aplica migrações pendentes |
| `pnpm db:seed` | popula dados iniciais (idempotente) |
| `pnpm db:studio` | abre o Prisma Studio |

O seed cria o administrador `admin@fioforma.com.br` com a senha `FioForma@2026` (ou o que estiver em `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). **Troque a senha no primeiro acesso.**

---

## 5. Variáveis de ambiente

Nenhum segredo vai para o navegador. Apenas variáveis com prefixo `NEXT_PUBLIC_` chegam ao frontend.

| Variável | Obrigatória | Para que serve |
| --- | --- | --- |
| `DATABASE_URL` | sim | DSN MySQL/TiDB. O app normaliza `ssl={"rejectUnauthorized":true}` para `sslaccept=strict`. |
| `AUTH_SECRET` | sim | Assinatura de sessão e tokens. Gere com `openssl rand -base64 32`. |
| `NEXT_PUBLIC_SITE_URL` | produção | URL pública (ex.: `https://fioforma.com.br`). Usada em e-mails, links de download e metadados. |
| `COOKIE_SECURE` | recomendado | `true` em HTTPS/Preview; `false` só em HTTP local. |
| `NEXT_PUBLIC_BRAND_NAME` | não | Nome exibido da loja (padrão FioForma). |
| `NEXT_PUBLIC_BRAND_TAGLINE` | não | Assinatura curta usada no rodapé e metadados. |
| `NEXT_PUBLIC_STORE_WHATSAPP` | não | WhatsApp de suporte. Enquanto for `[WHATSAPP]`, os botões de contato ficam ocultos. |
| `NEXT_PUBLIC_STORE_EMAIL` | não | E-mail de suporte. Enquanto for `[EMAIL]`, aparece como pendência. |
| `NEXT_PUBLIC_INSTAGRAM` | não | Instagram no rodapé. |
| `PAYMENT_GATEWAY` | sim | `mercadopago` para vender; `simulator` apenas demonstração. |
| `MERCADOPAGO_ACCESS_TOKEN` | produção | Access token da conta (produção ou sandbox). |
| `MERCADOPAGO_PUBLIC_KEY` | produção | Chave pública (usada pelo Checkout Pro). |
| `MERCADOPAGO_WEBHOOK_SECRET` | produção | Segredo para validar a assinatura `x-signature` do webhook. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | não | Interface pronta, não usada no MVP. |
| `EMAIL_PROVIDER` | sim | `console` (loga no servidor) ou `resend`. |
| `RESEND_API_KEY` | produção | Chave do Resend. |
| `EMAIL_FROM` | produção | Remetente verificado (ex.: `FioForma <oi@fioforma.com.br>`). |
| `STORAGE_DRIVER` | não | `db` (padrão) ou `s3`. |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | se `s3` | Armazenamento privado compatível com S3/R2. |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | não | Credenciais criadas pelo seed. |
| `ALLOW_DEMO_GATEWAY` | não | `true` permite o gateway de demonstração em produção (não recomendado). |

> **Nunca** comite `.env.local` nem coloque segredos em variáveis `NEXT_PUBLIC_`.

---

## 6. Banco de dados

As migrações ficam em `prisma/migrations` e são aplicadas com `pnpm db:migrate` (usa `scripts/prisma.mjs`, que normaliza o SSL do DSN).

Para criar uma nova migração durante o desenvolvimento:

```bash
node scripts/prisma.mjs migrate dev --name nome_da_migracao
```

O seed é idempotente: pode rodar de novo sem duplicar registros. Ele cria:

- administrador;
- 3 coleções e 6 categorias;
- 6 moldes de demonstração com ficha técnica, tabela de medidas, FAQ e um PDF provisório;
- páginas: sobre, guias, FAQ, licença, termos, privacidade, reembolso;
- 3 posts de blog;
- cupom `BEMVINDA10` (10%, até 50 usos).

---

## 7. Pagamento com Mercado Pago

### 7.1 Como o fluxo funciona

1. O checkout cria o pedido no banco com status `PENDING` e recalcula todos os preços no servidor.
2. O gateway gera uma preferência de pagamento (Checkout Pro) e o cliente é redirecionado.
3. O Mercado Pago envia um **webhook** para `/api/webhooks/mercadopago`.
4. O webhook valida a assinatura HMAC, consulta o pagamento na API do Mercado Pago e só então marca o pedido como pago, cria os acessos e envia o e-mail.
5. O retorno do navegador **nunca** marca o pedido como pago: ele apenas mostra o status atual.

### 7.2 Configuração

1. Crie a aplicação em <https://www.mercadopago.com.br/developers/panel>.
2. Copie o **Access Token** de produção (ou de teste) para `MERCADOPAGO_ACCESS_TOKEN`.
3. Copie a **Public Key** para `MERCADOPAGO_PUBLIC_KEY`.
4. Em **Webhooks**, cadastre a URL `https://SEU-DOMINIO/api/webhooks/mercadopago` e o evento `payment`.
5. Copie o **segredo de assinatura** para `MERCADOPAGO_WEBHOOK_SECRET`.
6. Defina `PAYMENT_GATEWAY=mercadopago` e reinicie o serviço.
7. Faça uma compra de teste (sandbox) e confira se o pedido muda para `PAID` apenas depois do webhook.

### 7.3 Modo demonstração

Com `PAYMENT_GATEWAY=simulator`, o checkout leva para `/pagamento/demo/[numero]`, onde é possível aprovar ou recusar o pagamento sem cobrar nada. Esse modo é **bloqueado em produção** (`NODE_ENV=production`) a menos que `ALLOW_DEMO_GATEWAY=true`.

### 7.4 Reembolso

O estorno financeiro é feito no painel do Mercado Pago. No admin, use **Pedidos → Registrar reembolso**: isso marca o pedido como reembolsado, registra o evento e revoga os acessos aos arquivos.

---

## 8. E-mails

- `EMAIL_PROVIDER=console`: os e-mails são impressos no log do servidor (útil em desenvolvimento).
- `EMAIL_PROVIDER=resend`: envio real via API do Resend. Verifique o domínio e configure `EMAIL_FROM`.

E-mails enviados hoje: confirmação de pedido pago (com link da biblioteca e link de acesso para visitantes), link de redefinição de senha e link de acesso.

Se o envio falhar, o pedido continua pago e o link pode ser reenviado pelo admin em **Pedidos → Reenviar e-mail**.

---

## 9. Arquivos e armazenamento

- Por padrão, PDFs e imagens ficam no banco (`STORAGE_DRIVER=db`), em tabela separada e com visibilidade privada.
- Para volume maior, use `STORAGE_DRIVER=s3` com R2/S3 privado. O download continua saindo pela rota `/api/download/[fileId]`, com link assinado de 10 minutos.
- Limites: PDF até 30 MB por arquivo (o limite de upload do servidor é 32 MB); fotos até 8 MB, proporção 4:5.
- Todo download é registrado (`DownloadLog`) com data, arquivo e IP anonimizado.

---

## 10. Painel administrativo

Acesse `/admin` com uma conta `ADMIN`.

| Área | O que faz |
| --- | --- |
| Visão geral | receita, pedidos pagos, pendentes, mais vendidos, catálogo e últimas ações |
| Produtos | cadastro completo: fotos, PDFs, ficha técnica, medidas, FAQ, SEO, publicação |
| Coleções / Categorias | organização do catálogo, com ordem e descrição |
| Pedidos | detalhe, confirmação manual, cancelamento, reembolso, reenvio de e-mail, nota interna |
| Cupons | percentual ou valor fixo, mínimo de compra, limite de usos, validade |
| Clientes | histórico de compras, total gasto, moldes liberados, opt-in de newsletter |
| Páginas e blog | editor Markdown, rascunho/publicado, SEO por página |
| Relatórios | receita por mês, ticket médio, conversão, mais vendidos, downloads, novos clientes, exportação CSV |
| Configurações | nome, tagline, WhatsApp, e-mail, Instagram, aviso do topo e status das integrações |

Cada ação administrativa relevante é registrada em `AuditLog`.

---

## 11. Deploy

### 11.1 Vercel (recomendado para começar)

1. Suba o repositório no GitHub e importe na Vercel.
2. Configure as variáveis de ambiente da seção 5 (produção).
3. Build command: `pnpm build`. Install: `pnpm install`.
4. Após o primeiro deploy, rode as migrações uma vez:

   ```bash
   DATABASE_URL="..." pnpm db:migrate
   ```

   (ou configure um job de release que rode `node scripts/prisma.mjs migrate deploy`).
5. Cadastre o domínio e ajuste `NEXT_PUBLIC_SITE_URL`.
6. Atualize a URL do webhook no Mercado Pago para o domínio final.

### 11.2 Container (Docker)

O repositório inclui `Dockerfile` com build multi-stage, migração no start e health check em `/api/health`.

```bash
docker build -t fioforma .
docker run -p 3000:3000 --env-file .env.production fioforma
```

Em qualquer provedor de containers (Railway, Render, Fly.io, ECS, Cloud Run), configure as variáveis de ambiente e aponte o health check para `/api/health`. Não é necessário VPS.

### 11.3 Checklist técnico de deploy

- [ ] `pnpm build` passa sem erros
- [ ] migrações aplicadas no banco de produção
- [ ] `AUTH_SECRET` novo e exclusivo de produção
- [ ] `NEXT_PUBLIC_SITE_URL` com o domínio final
- [ ] `PAYMENT_GATEWAY=mercadopago` e chaves válidas
- [ ] webhook do Mercado Pago apontando para o domínio final
- [ ] `EMAIL_PROVIDER=resend` com domínio verificado
- [ ] backup automático do banco ativo
- [ ] `/api/health` respondendo 200

---

## 12. Backup e restauração

### Banco de dados

- Ative o backup automático do provedor (TiDB/MySQL gerenciado) com retenção mínima de 7 dias.
- Faça um dump semanal independente:

  ```bash
  mysqldump --single-transaction --routines --triggers \
    --set-gtid-purged=OFF \
    -h HOST -P 4000 -u USER -p BANCO > backup-$(date +%F).sql
  ```

- Guarde o dump em local diferente do banco (storage privado), com criptografia e acesso restrito.
- Se os PDFs estiverem no banco (`STORAGE_DRIVER=db`), o dump já contém os arquivos — o que aumenta o tamanho. Ao migrar para S3/R2, faça backup do bucket separadamente (versionamento + replicação).

### Restauração

1. Crie um banco vazio.
2. Restaure o dump: `mysql -h HOST -u USER -p BANCO < backup.sql`.
3. Aponte `DATABASE_URL` para o banco restaurado.
4. Rode `pnpm db:migrate` para conferir o estado das migrações.
5. Teste login, catálogo, um download e o admin.

### Teste de restauração

Faça um ensaio trimestral em banco separado e registre data, tempo de restauração e responsável. Backup que nunca foi restaurado não é backup.

---

## 13. Segurança e LGPD

- Senhas com bcrypt (custo 12); sessões em cookie httpOnly, SameSite=None + Secure em HTTPS.
- Downloads exigem sessão ou token assinado de curta duração; pedido não pago não libera arquivo.
- Rate limit em login, recuperação de senha, contato, newsletter e downloads.
- IP armazenado apenas como hash com sal.
- Banner de cookies com opção "só essenciais"; métricas só com consentimento.
- Exclusão de conta disponível em **Minha conta → Dados pessoais** (mantém registros fiscais obrigatórios, conforme a política).
- Textos legais são rascunhos e precisam de revisão jurídica antes da publicação.

---

## 14. Checklist de lançamento

**Conteúdo e marca**

- [ ] Substituir os 6 moldes demo por moldes reais (fotos 4:5, PDFs conferidos, ficha técnica, medidas)
- [ ] Revisar preços (R$ 10 a R$ 20) e nomes
- [ ] Criar as coleções e categorias reais
- [ ] Trocar nome/wordmark da marca se não for FioForma
- [ ] Revisar textos de sobre, guias e FAQ
- [ ] Publicar posts reais no blog

**Legal e dados da empresa**

- [ ] Razão social, CNPJ e endereço em `src/config/brand.ts`
- [ ] Revisão jurídica de termos, privacidade, licença e reembolso
- [ ] Definir prazo e condições de reembolso
- [ ] Confirmar enquadramento fiscal e emissão de nota

**Operação**

- [ ] WhatsApp e e-mail reais configurados
- [ ] Conta Mercado Pago verificada e chaves de produção
- [ ] Webhook testado com pagamento real de baixo valor
- [ ] Domínio de e-mail verificado no Resend
- [ ] Backup automático ativo e teste de restauração feito
- [ ] Senha do admin trocada
- [ ] `AUTH_SECRET` de produção gerado

**Antes de divulgar**

- [ ] Testar compra Pix e cartão em produção (valor baixo)
- [ ] Testar compra como visitante e acesso por link
- [ ] Testar re-download e link expirado
- [ ] Testar celular (iPhone e Android)
- [ ] Conferir sitemap, robots e metadados no Google Search Console
- [ ] Configurar monitoramento de erros e alerta de banco

---

## 15. Pendências (o que depende de você)

| Item | Por que falta | Como resolver |
| --- | --- | --- |
| Chaves do Mercado Pago | Não foram fornecidas | Criar aplicação e colar `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET` |
| Chave do Resend | Não foi fornecida | Criar conta, verificar domínio e configurar `RESEND_API_KEY` e `EMAIL_FROM` |
| WhatsApp e e-mail de suporte | Placeholders `[WHATSAPP]` e `[EMAIL]` | Preencher em Configurações ou nas variáveis |
| Razão social, CNPJ e endereço | Placeholders | Editar `src/config/brand.ts` |
| Textos jurídicos | Rascunhos marcados | Revisão com advogado |
| Fotos e PDFs reais | Conteúdo demo | Cadastrar no admin e remover os demos |
| Dados comerciais (prazos, condições) | Não inventados | Definir e atualizar páginas |
| Domínio e hospedagem | Não definidos | Escolher provedor e apontar DNS |

---

## 16. Estrutura do projeto

```
prisma/
  schema.prisma          modelo de dados
  migrations/            migrações versionadas
  seed.ts                dados iniciais e demo
scripts/
  prisma.mjs             wrapper do Prisma com normalização de SSL
src/
  app/
    (store)/             loja: home, catálogo, produto, checkout, conta, conteúdo
    (admin)/admin/       painel administrativo
    actions/             server actions (carrinho, checkout, admin, auth)
    api/                 auth, mídia, download, webhook, health, export CSV
  components/            UI da loja, produto, checkout, admin
  config/brand.ts        marca e canais de suporte
  lib/                   domínio: pedidos, pagamentos, downloads, cupons, e-mail
public/                  ícones, manifesto de rotas
Dockerfile               imagem de produção
plan.md                  plano e decisões
```

---

## 17. Limitações conhecidas

- O gateway Stripe está apenas como interface, sem implementação.
- Não há emissão de nota fiscal nem integração fiscal.
- Não há cupom de uso único por cliente (o limite é global).
- O blog não tem categorias nem comentários.
- Imagens de produto não passam por otimização/CDN; use arquivos já redimensionados.
- O envio de e-mail depende de provedor externo; em `console` nada é entregue de verdade.

---

Dúvidas de operação do dia a dia estão em [`docs/OPERACAO.md`](./docs/OPERACAO.md).
