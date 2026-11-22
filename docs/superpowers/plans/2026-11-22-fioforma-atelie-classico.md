# FioForma — Ateliê clássico + primeiros moldes: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retematizar a loja inteira na direção "Ateliê clássico" e publicar 5 moldes geométricos reais (PDF A4/A0 + imagens), gerados por código, com o fluxo de compra grátis/pago funcionando.

**Architecture:** O Next.js 15 existente é mantido. O visual muda pelos tokens do Tailwind (renomeados), por alguns componentes-base (`Mat`, `Button`, `SectionHeading`, header e footer) e pela reescrita da home e da página de produto. Os moldes vêm de um gerador TypeScript em `scripts/moldes/`, com geometria pura testada, PDF via `pdf-lib` e PNG via `@resvg/resvg-js`. A saída fica versionada em `prisma/moldes/<slug>/`, e o `prisma/seed.ts` a carrega no banco (`STORAGE_DRIVER=db`).

**Tech Stack:** Next.js 15, React 19, Tailwind 3, Prisma 6 (MySQL/TiDB), node:test + tsx, pdf-lib, @pdf-lib/fontkit, @resvg/resvg-js, Playwright MCP para conferência visual.

**Spec:** `docs/superpowers/specs/2026-11-22-fioforma-atelie-classico-design.md`

## Global Constraints

- Paleta: `linen #F3EEE6`, `paper #FBF8F3`, `ink #3A2E2A`, `muted #6A5B54`, `muted-2 #8A7A70`, `wine #7A3B3B`, `rule #CDBFAF`, `sand #E6DCCE`, `rosewood #E8D3CF`. O vinho é a única cor de destaque.
- Fontes: Cormorant Garamond (títulos, nomes de peça, preço) e DM Sans (resto), via `next/font/google`.
- Cantos: raio máximo de 2px. Não usar pílulas, arcos, círculos decorativos, marquee nem sombra flutuante. Única sombra: `0 1px 2px rgba(58,46,42,.12)`.
- Imagem de produto sempre 3:4 dentro de `Mat`.
- Escala de espaçamento: só 4/8/12/16/24/32/48/64/96 px.
- Não mudar regras de negócio, pagamento, auth, entrega nem Server Actions, exceto nos pontos citados nas tarefas.
- A única mudança de schema é `Product.modelNumber`, via migração aditiva `0003_model_number`.
- Medidas do corpo (cm), na ordem PP/P/M/G/GG:
  - cintura 62/66/70/76/82
  - quadril 88/92/96/102/108
  - busto 82/86/90/96/102
- Margem de costura: 1 cm inclusa em todas as bordas. Metragem calculada para tecido de 1,50 m.
- Moldes, nesta ordem:
  - 001 Saia Godê, grátis, PP–GG
  - 002 Saia Franzida com Elástico, R$ 9, PP–GG
  - 003 Avental Retrô, R$ 9, único
  - 004 Bolsa Tote, R$ 7, único, 40×38×10
  - 005 Nécessaire Box, R$ 7, P/M
  - Todos nível Iniciante, coleção `basicos`.
- A ficha nunca promete o que não existe: `layersAvailable=false`, `projectorAvailable=false`, e a contagem de folhas vem de `ProductFile.pages`.
- Os 6 produtos `isDemo` passam a `DRAFT`, sem apagar.
- Repo público: nunca commitar `.env*` (exceto `.env.example`) nem chaves.
- Os commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Textos visíveis ao cliente em português do Brasil.

## Review Focus

1. **Contato placeholder** (`[EMAIL]`, `[WHATSAPP]` ou vazio, via env ou admin): nenhuma linha de contato aparece no rodapé nem em `/contato`. Ao preencher no admin, aparece sem deploy. (Task 3)
2. **Produto pago com Mercado Pago não configurado em produção:** o checkout mostra uma mensagem clara e **não cria pedido**. Um carrinho só com itens grátis passa normalmente. (Task 8)
3. **Godê GG, comprimento 70:** a peça cabe no A0 (841×1189 mm) e o mosaico A4 é numerado sem buracos. Toda folha A4 contém algum traço, ou é omitida. (Task 6)
4. **Coleção com produtos só em rascunho** (Verão, Alfaiataria após a Task 9): não aparece na home, em `/colecoes` nem nos filtros. (Task 9)
5. **Seed rodado duas vezes** (como acontece na Manus): não duplica arquivos, imagens nem linhas da tabela de medidas, e atualiza os PDFs se o checksum mudar. (Task 9)

---

### Task 1: Ambiente local, tokens e fontes

**Files:**
- Modify: `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `.env.example` (comentário do MySQL local), todos os `src/**/*.tsx` (renomear classes)
- Create: `.env.local` (não commitado), `scripts/dev-db.sh`

**Interfaces:**
- Produces:
  - Classes Tailwind `bg-linen`, `bg-paper`, `text-ink`, `text-muted`, `text-muted-2`, `*-wine`, `wine-50…900`, `border-rule`, `bg-sand`, `bg-rosewood`, `font-serif` (Cormorant), `font-sans` (DM Sans), `shadow-paper`
  - Utilitários CSS `.container-page` (mantido), `.eyebrow`, `.rule-y`
  - Script `scripts/dev-db.sh` que sobe TiDB local na porta 4000

- [ ] **Step 1: Subir o banco local.** Instale o pnpm com `corepack enable && corepack prepare pnpm@latest --activate`. Instale o tiup em espaço de usuário (`curl --proto '=https' --tlsv1.2 -sSf https://tiup-mirrors.pingcap.com/install.sh | sh`). O `scripts/dev-db.sh` roda `tiup playground --mode tidb --without-monitor --tag fioforma` em background.
- [ ] **Step 2: Configurar o `.env.local`.** Valores:
  - `DATABASE_URL="mysql://root@127.0.0.1:4000/fioforma"`
  - `PAYMENT_GATEWAY=simulator`
  - `EMAIL_PROVIDER=console`
  - `STORAGE_DRIVER=db`
  - `COOKIE_SECURE=false`
  - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
  - `AUTH_SECRET` aleatório
  - `SEED_DEMO_DATA=true`
  - `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` locais
- [ ] **Step 3: Validar o ponto de partida.** Rode `mysql -h127.0.0.1 -P4000 -uroot -e 'create database fioforma'` (ou via `npx prisma db execute`), depois `pnpm install && pnpm db:migrate && pnpm db:seed && pnpm typecheck && pnpm build`. Esperado: tudo passa. Esta é a linha de base: se algo falhar aqui, registre e corrija antes de seguir, porque a Manus nunca rodou o build.
- [ ] **Step 4: Trocar a paleta.** Em `tailwind.config.ts`:
  - Substituir `colors` pela paleta global. A escala `wine` vai de 50 a 900, com `DEFAULT #7A3B3B`, `700 #7A3B3B` e `800 #5E2C2C`.
  - Manter `line` como alias de `rule` e `muted` para não quebrar classes.
  - Remover `forest`, `sage`, `blush`, `clay`, `cream`, `rose`.
  - Em `borderRadius`, sobrescrever `sm`, `DEFAULT`, `md`, `lg`, `xl`, `2xl`, `3xl` e `full` para `2px`. Adicionar `dot: '9999px'` só para indicadores circulares.
  - Remover `arch`, `marquee`, `float` e `card`. Adicionar `boxShadow.paper`.
- [ ] **Step 5: Renomear as classes antigas.** Faça um sed mecânico em `src/**/*.tsx|ts`:
  - `forest` → `wine`
  - `sage-100|200|300` e `sage` → `sand`
  - `blush-*` → `rosewood`
  - `clay` → `wine`
  - `cream` → `paper`
  - `rose` → `rosewood`
  - `bg-paper` (fundo de página) → `bg-linen` **apenas** em `layout.tsx` e no `body`
  - `shadow-float|shadow-soft|shadow-card` → `shadow-paper`
  - `rounded-arch` → removido
  - `accent-[#24483D]` → `accent-[#7A3B3B]`

  Depois rode `grep -rnE "forest|sage|blush|clay|cream|marquee|#24483D" src` e confira que o resultado é vazio.
- [ ] **Step 6: Trocar as fontes.** Em `layout.tsx`, troque Inter/Fraunces por `DM_Sans` (`--font-sans`) e `Cormorant_Garamond` (pesos 400, 500, 600 com itálico, `--font-serif`). `themeColor` passa a `#F3EEE6`. Ajuste `fontFamily` no Tailwind.
- [ ] **Step 7: Limpar o CSS global.** Em `globals.css`:
  - remover keyframes e classes de marquee, arco e pílula
  - `.field-input` com borda `rule`, raio de 2px e foco com anel `wine`
  - `.eyebrow` = 11px, uppercase, tracking 0.24em, `text-wine`
- [ ] **Step 8: Verificar.** `pnpm typecheck && pnpm build` devem passar. Suba `pnpm dev` e capture `/` em 1366×850 com o Playwright MCP. Esperado: sem verde, sem cantos arredondados grandes, fontes novas.
- [ ] **Step 9: Commit.** `git commit -m "Tokens Ateliê clássico: paleta linho/vinho, Cormorant + DM Sans, cantos retos"`

### Task 2: Número de modelo (schema)

**Files:**
- Modify: `prisma/schema.prisma` (Product), `src/lib/products.ts` (`ProductCardData`, `toCard`), `src/components/admin/product-form.tsx`, `src/app/actions/admin-products.ts`
- Create: `prisma/migrations/0003_model_number/migration.sql`
- Test: `src/lib/__tests__/model-number.test.ts`

**Interfaces:**
- Produces:
  - `Product.modelNumber String? @db.VarChar(8)`
  - `ProductCardData.modelNumber: string | null`
  - `formatModelNumber(n: string | null): string | null` em `src/lib/format.ts`. Converte `"1"`/`"001"` em `"Modelo nº 001"` e `null`/`""` em `null`.

- [ ] **Step 1: Teste.**
  ```ts
  assert.equal(formatModelNumber('1'), 'Modelo nº 001');
  assert.equal(formatModelNumber('004'), 'Modelo nº 004');
  assert.equal(formatModelNumber(null), null);
  assert.equal(formatModelNumber('  '), null);
  ```
- [ ] **Step 2: Rodar e ver falhar.** Troque o script `test` do package.json para `node --import tsx --test "src/**/__tests__/*.test.ts" "scripts/**/__tests__/*.test.ts"` e rode `pnpm test`. Esperado: FAIL, `formatModelNumber` não existe.
- [ ] **Step 3: Implementar.** Crie `formatModelNumber`. Adicione o campo no schema e a migração `ALTER TABLE \`Product\` ADD COLUMN \`modelNumber\` VARCHAR(8) NULL;`. Inclua `modelNumber` em `toCard`. Adicione o input "Número do modelo" no form do admin e o parse na action (trim, máx. 8, vazio vira null).
- [ ] **Step 4: Verificar.** `pnpm db:migrate && pnpm test && pnpm typecheck` devem passar.
- [ ] **Step 5: Commit.**

### Task 3: Componentes-base, cabeçalho, rodapé e cookies

**Files:**
- Create: `src/components/ui/mat.tsx`, `src/lib/contact.ts`, `src/lib/__tests__/contact.test.ts`
- Modify: `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/section.tsx`, `src/components/site/header.tsx`, `src/components/site/footer.tsx`, `src/components/site/logo.tsx`, `src/components/site/cookie-banner.tsx`, `src/app/(store)/contato/page.tsx`

**Interfaces:**
- Produces:
  - `<Mat ratio?: '3/4' caption?: string tone?: 'sand'|'rosewood' className?>{children}</Mat>`: moldura `bg-paper p-3 shadow-paper`, área interna `aspect-[3/4] bg-{tone}`, legenda em Cormorant itálico 17px centralizada
  - `Button` variants: `primary` (vinho sólido, texto linho), `outline` (borda ink), `ghost`, `quiet`, `paper` (para fundo ink), `outline-light`. Todas retangulares, uppercase 12px, tracking 0.18em.
  - `SectionHeading({ eyebrow, title, description?, action?, align?: 'center'|'left' })`, com centro como padrão e sem a prop `index`. Remova `index` dos chamadores.
  - `contactChannels(settings: Pick<StoreSettings,'email'|'whatsapp'>): { email: {href,label} | null; whatsapp: {href,label} | null }`

- [ ] **Step 1: Teste de contato.**
  ```ts
  assert.deepEqual(contactChannels({ email: '[EMAIL]', whatsapp: '[WHATSAPP]' }), { email: null, whatsapp: null });
  assert.deepEqual(contactChannels({ email: '', whatsapp: '' }), { email: null, whatsapp: null });
  assert.equal(contactChannels({ email: 'oi@fioforma.com.br', whatsapp: '' }).email?.href, 'mailto:oi@fioforma.com.br');
  assert.equal(contactChannels({ email: '', whatsapp: '+55 27 99999-0000' }).whatsapp?.href, 'https://wa.me/5527999990000');
  assert.equal(contactChannels({ email: '', whatsapp: '1234' }).whatsapp, null);
  ```
- [ ] **Step 2: Ver falhar.** `pnpm test`: FAIL.
- [ ] **Step 3: Implementar.** `contactChannels` reusa `isPlaceholder` de `config/brand.ts`. O footer e `/contato` usam `contactChannels(await getSettings())` e **omitem** a linha inteira quando o canal é null. Se os dois forem null, mostre só "Fale com a gente pelo formulário de contato" com link para `/contato`.
- [ ] **Step 4: Rodar.** `pnpm test`: PASS.
- [ ] **Step 5: Cabeçalho, conforme mockup B.**
  - Linha 1: logo centralizado em caixa alta, Cormorant 600, tracking 0.14em. Busca à esquerda e "Entrar" e "Carrinho (n)" à direita, em texto.
  - Linha 2: nav centralizada (Moldes, Coleções, Guias, Blog, Sobre), uppercase 12px, tracking 0.16em, entre filetes `border-rule` em cima e embaixo.
  - Celular (<768px): logo central, botão de menu à esquerda, carrinho à direita. O menu abre uma gaveta de tela cheia `bg-linen`.
  - O `Logo` vira só o wordmark em texto, sem o SVG de agulha.
- [ ] **Step 6: Rodapé.** Fundo `bg-ink`, texto `text-linen/80`, mesma grade de `container-page`. As colunas Comprar/Ajuda/Institucional ficam, separadas por filete `border-linen/15`. A newsletter vira linha simples com input sublinhado, sem cartão.
- [ ] **Step 7: Banner de cookies.**
  - Barra fixa no rodapé da tela, largura total, `bg-paper border-t border-rule`, altura de no máximo 64px no desktop, texto 13px e dois botões `sm`.
  - Na página de produto no celular, fica **acima** da barra de compra fixa: `bottom` = altura da barra, via `data-has-buybar` no `body` ou variável CSS `--buybar-h`.
  - Some ao escolher.
- [ ] **Step 8: Verificar.** `pnpm typecheck && pnpm build`. Capture `/` e `/contato` em 1366×850 e 390×844. Esperado: nenhum `[EMAIL]` ou `[WHATSAPP]` visível (`browser_evaluate` com `document.body.innerText.includes('[')` → false) e o banner sem cobrir botões.
- [ ] **Step 9: Commit.**

### Task 4: Home

**Files:**
- Modify: `src/app/(store)/page.tsx` (reescrita)
- Delete: `src/components/product/pattern-placeholder.tsx`, quando não houver mais usos. Substituído por `Mat` com o desenho técnico do produto ou um fundo liso `sand` com o nome da categoria em itálico.

**Interfaces:**
- Consumes: `Mat`, `SectionHeading`, `Button`, `getLatestProducts`, `listCollections`, `formatModelNumber`

- [ ] **Step 1: Montar as seções, nesta ordem e com estes textos:**
  1. Hero centralizado: eyebrow "Moldes de costura em PDF", h1 "O molde certo, na *escala certa*" (itálico em vinho), parágrafo "Ficha técnica completa, tabela de medidas em centímetros e arquivos prontos para imprimir em casa, do PP ao GG.", botão outline "Conhecer os moldes" → `/catalogo`.
  2. Trio lookbook: os 3 produtos mais recentes em `Mat`, o do meio 1,3× mais largo, alinhados pela base. Legenda = nome curto.
  3. "Novidades / Saídos da mesa de corte": `ProductCard` ×4.
  4. Coleções: só as com `_count.products > 0`. Cartão = `Mat` + nome, exibido **uma vez**, e contagem.
  5. "Como funciona": 4 passos numerados 01–04 em grade de 4 colunas com filetes verticais. Manter os textos atuais.
  6. Diferenciais: 4 itens em linha, sem ícones coloridos. Textos atuais, **sem** citar A0 ou projetor.
  7. Ateliê: bloco centralizado de texto, com o mesmo texto atual.
- [ ] **Step 2: Verificar.** Capture `/` em 1366 e 390. Esperado: todos os blocos alinhados ao mesmo `container-page`, título de coleção sem repetição e nada "estourando" a grade. Confira com `browser_evaluate`: `[...document.querySelectorAll('main *')].some(e=>e.getBoundingClientRect().right>innerWidth+1)` → false.
- [ ] **Step 3: Commit.**

### Task 5: Catálogo, coleções e cartão de produto

**Files:**
- Modify: `src/components/product/product-card.tsx`, `src/components/catalog/*.tsx`, `src/app/(store)/catalogo/page.tsx`, `src/app/(store)/colecoes/page.tsx`, `src/app/(store)/colecoes/[slug]/page.tsx`, `src/app/(store)/categoria/[slug]/page.tsx`

**Interfaces:**
- Consumes: `Mat`, `ProductCardData.modelNumber`, `formatModelNumber`

- [ ] **Step 1: Cartão de produto.**
  - `Mat` com a imagem (`object-cover`).
  - Abaixo, centralizado: `formatModelNumber` em eyebrow, nome em Cormorant 19px, e "R$ X · PP–GG" em 12px uppercase `text-muted-2`.
  - Produto grátis mostra "Grátis" no lugar do preço.
  - Sem selo A4/A0 sobre a foto e sem botão no hover. O hover só sublinha o nome.
- [ ] **Step 2: Catálogo.** Cabeçalho centralizado. Os filtros viram uma barra de texto com filetes, com chips retangulares. Os filtros de coleção e categoria listam só itens com produto publicado: use `_count.products > 0`, já disponível em `listCollections` e `listCategories`. Grade de 4 colunas no desktop, 2 no celular, `gap-6`.
- [ ] **Step 3: Coleções.** Mesmo cartão `Mat`. A listagem esconde coleções vazias.
- [ ] **Step 4: Verificar.** Capture `/catalogo` em 1366 e 390. O filtro "Verão" não aparece quando Verão não tem produtos publicados (confira depois da Task 9). Rode `pnpm build`.
- [ ] **Step 5: Commit.**

### Task 6: Gerador de moldes: geometria e PDF

**Files:**
- Create:
  - `scripts/moldes/medidas.ts`
  - `scripts/moldes/geometria.ts`
  - `scripts/moldes/moldes/{saia-gode,saia-franzida,avental-retro,bolsa-tote,necessaire-box}.ts`
  - `scripts/moldes/pdf.ts`
  - `scripts/moldes/fonts/` (TTF de Cormorant Garamond e DM Sans, licença OFL, com `OFL.txt`)
- Test: `scripts/moldes/__tests__/geometria.test.ts`, `scripts/moldes/__tests__/pdf.test.ts`
- Modify: `package.json` (devDependencies `pdf-lib`, `@pdf-lib/fontkit`, `@resvg/resvg-js`)

**Interfaces:**
- Produces:
  ```ts
  // medidas.ts
  export const SIZES = ['PP','P','M','G','GG'] as const; export type Size = typeof SIZES[number];
  export const BODY: Record<Size, { waist: number; hip: number; bust: number }>; // cm, valores da Global Constraints
  export const SEAM_MM = 10; export const FABRIC_WIDTH_MM = 1500;
  // geometria.ts — tudo em milímetros, origem no canto superior esquerdo da peça
  export type Cmd = { op:'M'|'L'; x:number; y:number } | { op:'A'; cx:number; cy:number; r:number; a0:number; a1:number } | { op:'Z' };
  export type Outline = { label: string; cmds: Cmd[]; dash: number[] };   // um por tamanho/comprimento
  export type Piece = { id:string; name:string; cut:string; onFold:boolean; grain:'vertical'|'horizontal'; outlines: Outline[]; notches: {x:number;y:number}[]; seamMm:number };
  export type DirectCut = { name:string; cut:string; widthMm:number; heightMm:number; bySize?: Partial<Record<string,{widthMm:number;heightMm:number}>> };
  export type Step = { title:string; text:string };
  export type Molde = { number:string; slug:string; name:string; shortName:string; tagline:string; description:string; priceCents:number;
    category:'saia'|'acessorios'; sizes:string[]; variants: { id:string; label:string; pieces:Piece[]; directCuts:DirectCut[] }[];
    chart: { title:string; notes:string; rows:{ size:string; waistCm?:number; hipCm?:number; bustCm?:number; extra?:{label:string;value:string}[] }[] };
    fabric:string; notions:string; steps:Step[]; faq:{question:string;answer:string}[] };
  export function bbox(cmds: Cmd[]): { minX:number; minY:number; maxX:number; maxY:number };
  export function pathLength(cmds: Cmd[], from:number, to:number): number; // comprimento entre índices de comando
  export function yardageMm(pieces: Piece[], directCuts: DirectCut[], size: string, fabricWidthMm?: number): number;
  // pdf.ts
  export function renderA4(m: Molde, variantId: string): Promise<{ bytes: Uint8Array; pages: number; tiles: { col:number; row:number }[] }>;
  export function renderA0(m: Molde, variantId: string): Promise<{ bytes: Uint8Array; pages: number }>;
  export const A4 = { w: 210, h: 297, margin: 10, overlap: 10 }; export const A0 = { w: 841, h: 1189 };
  ```

- [ ] **Step 1: Testes de geometria.**
  ```ts
  // godê inteiro: raio interno r = (cintura+1cm folga)/(2π); quarto de círculo → arco interno = (cintura+10mm)/4
  const g = saiaGode.variants.find(v=>v.id==='inteira')!.pieces[0];
  const pp = g.outlines.find(o=>o.label==='PP · 50 cm')!;
  assert.ok(Math.abs(innerArcLength(pp) - (620+10)/4) < 0.5);          // helper de teste sobre o comando 'A' interno
  // meio-godê: r = (cintura+10)/π; peça = cunha de 45° em dobra, 2×
  const m = saiaGode.variants.find(v=>v.id==='meia')!.pieces[0];
  assert.equal(m.onFold, true);
  assert.ok(Math.abs(innerArcLength(m.outlines.find(o=>o.label==='GG · 70 cm')!) - (820+10)/4) < 0.5);
  // toda peça do godê GG/70 cabe no A0 (com rotação permitida)
  for (const v of saiaGode.variants) for (const p of v.pieces) { const b = bbox(p.outlines.flatMap(o=>o.cmds)); const w=b.maxX-b.minX+2*p.seamMm, h=b.maxY-b.minY+2*p.seamMm;
    assert.ok((w<=841-20 && h<=1189-20) || (h<=841-20 && w<=1189-20)); }
  // tote: corpo 400+2*SEAM de largura; alça e corpo costurados têm a mesma medida onde se unem
  assert.equal(bolsaTote.variants[0].directCuts.find(d=>d.name==='Corpo')!.widthMm, 420);
  // franzida: cada retângulo = (quadril × 1,5)/2 + 2 cm de margem, por tamanho
  assert.equal(saiaFranzida.variants[0].directCuts[0].bySize!.M!.widthMm, Math.round(960*1.5/2)+20);
  // metragem: dois retângulos 1000×500 em tecido de 1500 → 1 fileira de 500 mm
  assert.equal(yardageMm([], [{name:'a',cut:'2×',widthMm:700,heightMm:500},{name:'b',cut:'1×',widthMm:700,heightMm:500}], 'U', 1500), 500);
  ```
- [ ] **Step 2: Ver falhar.** `pnpm test`: FAIL.
- [ ] **Step 3: Implementar `geometria.ts` e os 5 moldes.**
  - Saia Godê:
    - Variante `inteira`: quarto de círculo de 90°, corte 4× (ou 2× em dobra dupla).
    - Variante `meia`: cunha de 45° em dobra, 2×.
    - Uma `Outline` por tamanho × comprimento (50/60/70). O dash de cada tamanho é PP `[]`, P `[6,3]`, M `[2,2]`, G `[8,2,2,2]`, GG `[12,4]`.
    - Cós como `DirectCut`: (cintura + 3 cm de transpasse + 2 cm de margem) × 8 cm.
  - Saia Franzida: 2 retângulos de (quadril×1,5)/2 + 2 cm × (comprimento 60 cm + 4 cm de canal + 1 cm). Elástico = cintura − 5 cm.
  - Avental Retrô: peitilho 26×28 cm com cantos superiores de raio 4 cm (`Piece`), saia 70×55 cm com cantos inferiores de raio 8 cm (`Piece`), bolso 20×18 cm de raio 3 cm (`Piece`), alça do pescoço 60×6 cm e tiras da cintura 2×(90×8) cm (`DirectCut`).
  - Bolsa Tote: corpo 40×(38+5) cm, 2× em dobra no fundo para o boxe de 10 cm; recorte do canto boxe 5×5 cm (`Piece`); alças 2×(65×10) cm; bolso interno 20×18 cm (`DirectCut`).
  - Nécessaire Box: P 22×14×8 e M 26×16×10 (comprimento × altura × fundo); corpo e forro como `Piece` com recortes de canto boxe; aba do zíper 2×(4×6) cm.
  - `yardageMm`: empacotamento em prateleiras ordenado por altura decrescente, largura útil = `fabricWidthMm`. Peça `onFold` usa metade da largura do tecido dobrado. Retorna a altura total em mm, arredondada para cima a cada 50 mm.
  - Passos (`steps`): 5 a 8 por molde, texto objetivo em português.
- [ ] **Step 4: Rodar.** `pnpm test`: PASS nos testes de geometria.
- [ ] **Step 5: Testes do PDF.**
  ```ts
  const a4 = await renderA4(saiaGode, 'inteira');
  const doc = await PDFDocument.load(a4.bytes);
  assert.equal(doc.getPageCount(), a4.pages);
  for (const p of doc.getPages()) { const {width,height}=p.getSize(); assert.ok(Math.abs(width-595.28)<0.5 && Math.abs(height-841.89)<0.5); }
  assert.equal(doc.getTitle(), 'FioForma — Modelo nº 001 · Saia Godê (godê inteiro)');
  // página do teste de escala tem o quadrado de 50 mm: renderA4 expõe TEST_SQUARE_PT = 50/25.4*72
  assert.ok(Math.abs(TEST_SQUARE_PT - 141.73) < 0.01);
  // mosaico: tiles contínuos e sem folhas vazias
  const cols = Math.max(...a4.tiles.map(t=>t.col))+1, rows = Math.max(...a4.tiles.map(t=>t.row))+1;
  assert.ok(a4.tiles.length <= cols*rows);
  const a0 = await renderA0(saiaGode, 'meia'); assert.equal((await PDFDocument.load(a0.bytes)).getPageCount(), 1);
  ```
- [ ] **Step 6: Ver falhar.** `pnpm test`: FAIL.
- [ ] **Step 7: Implementar `pdf.ts`.** Páginas A4, nesta ordem:
  1. **Capa-envelope:** moldura dupla, "FIOFORMA" e "Modelo nº 001", nome em Cormorant 40pt, tamanhos, nível e desenho técnico.
  2. **Ficha:** tecido, metragem por tamanho via `yardageMm` em "x,xx m", aviamentos e margem.
  3. **Tabela de medidas** da `chart`.
  4. **Plano de corte:** peças e `DirectCut` cotados em escala reduzida.
  5. **Passo a passo**, com 1 a 2 páginas.
  6. **Teste de escala:** quadrado de 50 mm, régua de 10 cm e instrução "Imprima em Tamanho real / 100%".
  7. **Mosaico.**

  Regras do mosaico:
  - Área útil 190×277 mm e sobreposição de 10 mm.
  - Rótulo de grade "A1", "A2"… (coluna = letra, linha = número) e marcas de canto.
  - **Omita** as folhas sem nenhum traço.
  - Mapa das folhas na página 6.
  - Contorno da linha de corte (contínuo) e da linha de costura (fina, cinza), fio do tecido, piques, "dobra" indicada e legenda de traços por tamanho.

  O `renderA0` é uma página 841×1189 mm com todas as peças da variante, posicionadas com rotação de 90° se necessário, legenda e quadrado de teste. As fontes ficam embutidas via fontkit.
- [ ] **Step 8: Rodar.** `pnpm test`: PASS.
- [ ] **Step 9: Commit.**

### Task 7: Gerador de moldes: imagens e build

**Files:**
- Create: `scripts/moldes/svg.ts`, `scripts/moldes/build.ts`, `prisma/moldes/<slug>/*` (saída versionada)
- Test: `scripts/moldes/__tests__/build.test.ts`
- Modify: `package.json` (script `"moldes:build": "tsx scripts/moldes/build.ts"`)

**Interfaces:**
- Consumes: `Molde`, `renderA4`, `renderA0`, `yardageMm`
- Produces:
  - `toSvg(kind: 'envelope'|'tecnico'|'corte', m: Molde): string` em 900×1200 (3:4)
  - `buildAll(outDir: string): Promise<Manifest[]>`
  - `prisma/moldes/<slug>/manifest.json`:
    ```ts
    type Manifest = { number:string; slug:string; name:string; tagline:string; description:string; priceCents:number; category:string; sizes:string[];
      fabric:string; notions:string; yardage:string; chart: Molde['chart']; faq: Molde['faq'];
      files: { fileName:string; format:'A4'|'A0'; pages:number; sizeBytes:number; sha256:string }[];
      images: { fileName:string; alt:string; kind:'PECA'|'DETALHE'|'MOLDE' }[] }; // envelope=PECA, tecnico=DETALHE, corte=MOLDE
    ```
  - `public/og.png` (1200×630, marca)

- [ ] **Step 1: Teste.**
  ```ts
  const out = await mkdtemp(join(tmpdir(),'moldes-'));
  const ms = await buildAll(out);
  assert.deepEqual(ms.map(m=>m.number), ['001','002','003','004','005']);
  for (const m of ms) {
    for (const f of m.files) { const b = await readFile(join(out,m.slug,f.fileName)); assert.equal(sha256(b), f.sha256); assert.ok(b.byteLength < 30*1024*1024); assert.ok(f.pages >= (f.format==='A0'?1:6)); }
    assert.equal(m.images.length, 3);
    for (const i of m.images) { const png = await readFile(join(out,m.slug,i.fileName)); assert.equal(png.readUInt32BE(16), 900); assert.equal(png.readUInt32BE(20), 1200); }
  }
  assert.equal(ms[0].files.length, 4); // godê: A4+A0 × inteira/meia
  assert.equal(ms[0].priceCents, 0);
  ```
- [ ] **Step 2: Ver falhar.** `pnpm test`: FAIL.
- [ ] **Step 3: Implementar.**
  - O envelope em SVG imita o mockup B: fundo `#FBF8F3`, moldura dupla `#7A3B3B`, "FIOFORMA · Modelo nº 00X", nome em Cormorant, desenho técnico central em traço `#3A2E2A` e faixa inferior "Tamanhos PP–GG · Molde em PDF".
  - `tecnico` = vista frente/costas da peça pronta.
  - `corte` = plano de corte.
  - O `resvg` rasteriza com as TTFs de `scripts/moldes/fonts`.
  - `build.ts` limpa `prisma/moldes/` e grava tudo.
  - Nomes de arquivo: `<slug>-a4.pdf`, `<slug>-a0.pdf`; no godê, `saia-gode-inteira-a4.pdf` etc.
- [ ] **Step 4: Gerar.** Rode `pnpm test` (PASS) e depois `pnpm moldes:build`.
- [ ] **Step 5: Conferir a escala na mão.** Converta a página do teste de escala de `prisma/moldes/saia-gode/saia-gode-inteira-a4.pdf` para PNG a 300 dpi (`pdftoppm -r 300 -f 6 -l 6`) e meça o quadrado em pixels. Esperado: 590 ± 3 px (50 mm a 300 dpi). Abra as 3 imagens de cada molde com Read e confira se estão legíveis e alinhadas.
- [ ] **Step 6: Commit.** Inclui a saída em `prisma/moldes`.

### Task 8: Página de produto e checkout sem gateway

**Files:**
- Modify: `src/app/(store)/produto/[slug]/page.tsx`, `src/components/product/gallery.tsx`, `src/lib/payments/index.ts`, `src/app/actions/checkout.ts`, `src/app/(store)/checkout/page.tsx`
- Test: `src/lib/__tests__/payments.test.ts`

**Interfaces:**
- Produces: `isPaymentReady(env?: NodeJS.ProcessEnv): boolean`. Retorna true se `PAYMENT_GATEWAY==='mercadopago'` e houver token, **ou** se `NODE_ENV!=='production'`, **ou** se `ALLOW_DEMO_GATEWAY==='true'`.

- [ ] **Step 1: Teste.**
  ```ts
  assert.equal(isPaymentReady({ NODE_ENV:'production' } as any), false);
  assert.equal(isPaymentReady({ NODE_ENV:'production', PAYMENT_GATEWAY:'mercadopago' } as any), false);
  assert.equal(isPaymentReady({ NODE_ENV:'production', PAYMENT_GATEWAY:'mercadopago', MERCADOPAGO_ACCESS_TOKEN:'APP_USR-x' } as any), true);
  assert.equal(isPaymentReady({ NODE_ENV:'development' } as any), true);
  ```
- [ ] **Step 2: Ver falhar.** FAIL.
- [ ] **Step 3: Implementar.** No `placeOrder` do checkout, **antes** de criar o pedido, retorne:
  `{ status:'error', message:'O pagamento online está sendo configurado. Os moldes gratuitos já podem ser baixados; os pagos voltam em breve.' }`
  sempre que `subtotal - desconto > 0 && !isPaymentReady()`. A página `/checkout` mostra esse aviso no topo quando o carrinho tem total > 0 e o pagamento não está pronto, e desabilita o botão.
- [ ] **Step 4: Rodar.** `pnpm test`: PASS.
- [ ] **Step 5: Redesenhar a página de produto.**
  - Bloco "envelope" no topo, em 2 colunas: à esquerda a galeria em `Mat` (miniaturas embaixo); à direita um cartão `bg-paper` com moldura dupla vinho de 1px.
  - O cartão traz: eyebrow `formatModelNumber`, nome em Cormorant 44px, tagline, linha "Tamanhos PP–GG · Iniciante", preço ("Grátis" quando 0), botão primário "Comprar molde" (ou "Baixar grátis" quando 0, que segue o mesmo fluxo de carrinho), 3 garantias e licença.
  - Ficha técnica:
    - remover a linha "Número de folhas" de `spec.pageCount`; a contagem vem só de `files[].pages`
    - "Camadas" e "Projetor" só aparecem se true (já é assim)
  - Tabela de medidas:
    - o título da seção é "Medidas do corpo" se alguma linha tem `waistCm`, `hipCm` ou `bustCm`; senão, "Medidas da peça pronta"
    - a frase "Meça o corpo…" só aparece no primeiro caso
  - A barra de compra fixa no celular define `--buybar-h` (Task 3).
- [ ] **Step 6: Verificar.** Rode `pnpm build`. Capture `/produto/saia-gode` em 1366 e 390, depois da Task 9. Esperado: ficha com 4 arquivos e folhas reais, sem "Projetor", sem "Camadas" e sem busto na tabela.
- [ ] **Step 7: Commit.**

### Task 9: Seed dos moldes reais

**Files:**
- Modify: `prisma/seed.ts`
- Create: `prisma/seed-moldes.ts`

**Interfaces:**
- Consumes: `prisma/moldes/*/manifest.json` (Task 7), `Product.modelNumber` (Task 2)
- Produces: `seedMoldes(prisma: PrismaClient, dir = 'prisma/moldes'): Promise<{ created:number; updated:number }>`

- [ ] **Step 1: Implementar `seedMoldes`.** Por manifest:
  - Upsert do `Product` por slug com `status:'PUBLISHED'`, `isDemo:false`, `modelNumber`, `priceCents`, `difficulty:'INICIANTE'`, coleção `basicos`, categoria `saia` ou `acessorios`, `sizesIncluded`, `seoTitle`/`seoDescription` e `publishedAt` (só ao criar).
  - Upsert de `ProductSpec` com `includedFormats` = formatos reais, `layersAvailable:false`, `projectorAvailable:false`, `pageCount:null` e o `faq`.
  - `SizeChart`: apaga e recria as linhas.
  - Arquivos e imagens: para cada um, se não existe `ProductFile` (ou `ProductImage`) com o mesmo `fileName` **e** o mesmo checksum, cria um `MediaAsset` novo (`driver:'db'`, `PRIVATE` para PDF e `PUBLIC` para imagem) e remove o antigo de mesmo `fileName`.

  No `seed.ts`:
  - adicionar a categoria `acessorios` ("Acessórios", sortOrder 7)
  - após os demos, `updateMany({ where:{ isDemo:true }, data:{ status:'DRAFT' } })`
  - chamar `seedMoldes`
  - o upsert dos demos **não** pode voltar o status para `PUBLISHED` no `update` (hoje não volta; manter)
  - espaçar o `publishedAt` dos 3 posts do blog em 7, 14 e 21 dias antes da data do seed, só no `create`
- [ ] **Step 2: Verificar a idempotência.** Rode `pnpm db:seed` duas vezes e depois:
  ```sql
  select count(*) from ProductFile f join Product p on p.id=f.productId where p.slug like 'saia-gode';   -- 4
  select count(*) from ProductImage i join Product p on p.id=i.productId where p.slug='bolsa-tote';     -- 3
  select count(*) from Product where status='PUBLISHED';                                              -- 5
  ```
  Esperado: os mesmos números nas duas rodadas. Confira as coleções da home (`/`): só aparece "Básicos".
- [ ] **Step 3: Commit.**

### Task 10: Telas restantes e admin

**Files:**
- Modify: `src/app/(store)/carrinho/page.tsx`, `checkout/page.tsx`, `pedido/[number]/page.tsx`, `pagamento/demo/[number]/page.tsx`, `minha-conta/**`, `entrar`, `criar-conta`, `recuperar-senha`, `redefinir-senha/[token]`, `acesso/**`, `[slug]/page.tsx`, `blog/**`, `not-found.tsx`, `src/components/auth/*`, `src/components/checkout/*`, `src/app/(admin)/admin/layout.tsx`, `src/components/admin/ui.tsx`
- Modify: `src/app/layout.tsx` (`openGraph.images: ['/og.png']`)

- [ ] **Step 1: Loja.** Passe por cada tela e aplique o padrão:
  - cabeçalho com `SectionHeading` centralizado
  - conteúdo em `container-page`
  - caixas `bg-paper border border-rule` sem sombra
  - tabelas com filetes
  - itens do carrinho e da biblioteca com miniatura em `Mat` pequena
  - "Grátis" para preço zero
  - nas páginas de conteúdo, "Atualizado em" só se `updatedAt` for diferente de `publishedAt` por mais de 1 dia
- [ ] **Step 2: Admin.** Menu lateral `bg-ink text-linen`, conteúdo `bg-linen`, tabelas densas com filetes, botões dos mesmos variants. Sem `Mat`.
- [ ] **Step 3: Verificar.** `pnpm build`. Capture em 390 e 1366: `/carrinho`, `/checkout`, `/entrar`, `/minha-conta/biblioteca`, `/faq`, `/blog`, `/admin`, `/admin/produtos/<id>`. Esperado: nenhum elemento passando da largura (mesmo `browser_evaluate` da Task 4) e nenhum `rounded-full` visível fora de indicadores.
- [ ] **Step 4: Commit.**

### Task 11: Verificação ponta a ponta, guia do Mercado Pago e envio para a Manus

**Files:**
- Create: `docs/MERCADOPAGO.md`, `docs/MANUS.md`
- Modify: `README.md` (seção "Moldes gerados": `pnpm moldes:build` e seed), `TODO.md`

- [ ] **Step 1: Fluxo grátis local** (`pnpm build && pnpm start` com `.env.local`, `ALLOW_DEMO_GATEWAY` vazio, `NODE_ENV=production`).
  - `/produto/saia-gode` → "Baixar grátis" → carrinho → checkout como visitante.
  - Esperado: pedido pago na hora, página do pedido com 4 downloads, cada um respondendo 200 com `application/pdf` e o checksum igual ao do manifest.
- [ ] **Step 2: Fluxo pago bloqueado em produção sem chave.**
  - Adicione `bolsa-tote` ao carrinho e vá ao checkout.
  - Esperado: o aviso da Task 8, botão desabilitado e nenhum pedido novo (`select count(*) from \`Order\``, igual antes e depois).
- [ ] **Step 3: Fluxo pago no simulador** (`pnpm dev`).
  - Compre `bolsa-tote` e conclua na página de pagamento demo.
  - Esperado: download liberado e o pedido aparece na biblioteca da conta.
- [ ] **Step 4: Conferência visual final.** Capturas de `/`, `/catalogo`, `/produto/saia-gode`, `/produto/bolsa-tote` e `/carrinho` em 390 e 1366. Ao compartilhar, `og:image` deve estar presente em `/` e no produto.
- [ ] **Step 5: `docs/MERCADOPAGO.md`.** Passos curtos para o dono fazer pelo celular:
  - criar a aplicação em mercadopago.com.br/developers
  - copiar as credenciais de **produção** (Public Key e Access Token)
  - em Webhooks, cadastrar `https://<domínio>/api/webhooks/mercadopago` com o evento "Pagamentos" e copiar a assinatura secreta
  - texto pronto para colar na Manus definindo `PAYMENT_GATEWAY=mercadopago`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY` e `MERCADOPAGO_WEBHOOK_SECRET`
  - teste final: comprar a Bolsa Tote (R$ 7), conferir o download e estornar no painel do Mercado Pago
- [ ] **Step 6: `docs/MANUS.md`.** O fluxo `manus-sync` e o prompt padrão. No primeiro envio, a Manus deve:
  1. `git fetch github && git merge --allow-unrelated-histories -X theirs github/manus-sync`
  2. `pnpm install && pnpm db:migrate && pnpm db:seed && pnpm typecheck && pnpm build`
  3. publicar
  4. responder só com hash, resultado do build e se publicou
- [ ] **Step 7: Enviar.** `git push origin HEAD:manus-sync` e `git push origin main`. Entregue o prompt ao dono.
- [ ] **Step 8: Depois que a Manus publicar,** confira o site no ar (home, produto, download grátis) com o Playwright MCP e reporte ao dono.
