# FioForma — redesign "Ateliê clássico" + primeiros moldes reais

Data: 22/11/2026 · Status: rascunho para aprovação do dono

## 1. Intenção e porquê

A FioForma é uma loja de moldes de costura em PDF (Next.js 15 + Prisma/MySQL, gerada pela Manus, hospedada na Manus). O dono quer deixá-la **pronta para divulgar**: bonita, coerente e funcionando de ponta a ponta, para que as peças futuras sejam só cadastradas no painel e postadas.

Dois problemas impedem isso hoje:

1. **Visual sem harmonia e sem enquadramento** (palavras do dono). O estilo atual "Ateliê suave" (verde, rosé, arcos, pílulas, círculos decorativos, marquee) não agradou "de forma geral".
2. **Loja vazia de conteúdo real.** Os 6 moldes atuais são demonstrativos: o PDF tem 1 KB e 1 página, a ficha promete A0, projetor, camadas e "32 folhas", que não existem, e a tabela de medidas da calça traz busto. Contato aparece como `[EMAIL]`/`[WHATSAPP]`.

O dono escolheu, entre três mockups, a direção **B · Ateliê clássico** e reconheceu nela uma "pegada retrô". Ele quer moldes para "não ficar vazio por hora", criados por nós (moldes gratuitos da web foram descartados por licença).

## 2. Objetivos

- G1. Aplicar a direção Ateliê clássico em **todas** as telas: loja, conta, carrinho, checkout, pedido, páginas de conteúdo e, numa versão sóbria, o admin.
- G2. Dar enquadramento rígido: uma grade única, fotos sempre em 3:4 dentro de "moldura de papel", espaçamentos de uma escala fixa e alinhamentos consistentes.
- G3. Publicar **5 moldes reais**, gerados por código, de modelagem geométrica (exatos por cálculo, sem precisar de prova em tecido), com PDFs completos e imagens de produto.
- G4. A ficha técnica de cada produto deve bater com os arquivos entregues. Nada prometido que não existe.
- G5. O fluxo de compra (grátis e pago) precisa funcionar de verdade no site da Manus, com download ao final.
- G6. Corrigir os defeitos apontados na auditoria (seção 8).

## 3. Não-objetivos

- Não mudar regra de negócio, pagamento, autenticação, entrega, schema nem Server Actions, a não ser o estritamente necessário para G4–G6.
- Não migrar de hospedagem (fica na Manus por decisão do dono; Railway é opção futura).
- Não criar moldes de roupa ajustada ao corpo (calça, blusa, vestido com pence). Esses são autorais e virão do dono depois.
- Não implementar PDF com camadas (OCG) nem arquivo de projetor nesta etapa.

## 4. Anti-objetivos (seria fracasso mesmo "funcionando")

- Um molde que, impresso a 100%, não bata a escala, ou cujas peças não fechem na costura.
- Texto ou ficha que prometa algo que o arquivo não entrega.
- Visual "retrô fantasia" carregado (texturas de papel envelhecido, fontes script, ornamentos). O retrô aqui é **sóbrio e editorial**.
- Quebrar o sincronismo com a Manus (ver seção 7).

## 5. Abordagens consideradas

| | Abordagem | Troca | Decisão |
|---|---|---|---|
| Hospedagem | **Manus** (sync via GitHub) | O dono já conhece. Testes finais rodam lá. Nós não testamos o ambiente publicado diretamente. | **Escolhida pelo dono** |
| | Railway | Já usado no FarmOS e com Dockerfile pronto. Testamos tudo. ~US$5/mês. | Futuro |
| | Vercel + DB externo | Grátis, mas são três serviços separados. | Descartada |
| Visual | A Editorial em grade / **B Ateliê clássico** / C Moderno minimalista | Mockups lado a lado no navegador. | **B, escolhida pelo dono** |
| Moldes | Baixar moldes grátis da web | Licença proíbe redistribuição. Risco de denúncia e bloqueio no Mercado Pago. | Descartada |
| | **Gerar por código, modelagem geométrica** | Exatos e reprodutíveis, mas só para peças simples. | **Escolhida** |
| Base de código | **Evoluir o projeto existente** | Mantém o admin, o checkout e a entrega já prontos. | Única sensata |
| | Refazer do zero | Joga fora um backend completo. | Descartada |

## 6. Design

### 6.1 Sistema visual "Ateliê clássico"

Referência: mockup B (`.superpowers/brainstorm/.../direcao-visual-v3.html`).

- **Paleta (tokens Tailwind, substituem forest/sage/blush/clay):**
  - `linen` #F3EEE6 (fundo)
  - `paper` #FBF8F3 (molduras e cartões)
  - `ink` #3A2E2A (texto)
  - `muted` #6A5B54 / #8A7A70
  - `wine` #7A3B3B (único destaque: links, itálicos de título, etiquetas, botão primário)
  - `rule` #CDBFAF (linhas finas)
  - `sand` #E6DCCE e `rosewood` #E8D3CF (fundos de imagem alternados)
- **Tipografia:** Cormorant Garamond (títulos, nomes de peça, preço) e DM Sans (texto e interface), via `next/font`. Rótulos ("eyebrow") em caixa alta com tracking largo.
- **Formas:** cantos retos ou raio máximo de 2px. Botões retangulares: primário em vinho sólido; secundário com borda fina `ink`. Saem `rounded-arch`, pílulas, círculos decorativos, marquee e sombras flutuantes. A única sombra é a 1px "papel".
- **Enquadramento:**
  - Container único com o mesmo `max-w` e o mesmo padding lateral em todas as páginas.
  - Grade de 12 colunas.
  - Escala de espaçamento restrita (4/8/12/16/24/32/48/64/96).
  - Toda imagem de produto em 3:4 dentro de `.mat` (moldura `paper` com padding fixo e legenda em itálico).
  - Seções separadas por filete `rule`.
- **Cabeçalho:** logo centralizado em caixa alta espaçada; nav centralizada entre dois filetes. No celular: logo central, menu e carrinho nas laterais.
- **Rodapé:** fundo `ink`, texto linho, mesma grade e filetes.
- **Toque retrô, "envelope de molde":**
  - Cada produto ganha um número de modelo ("Modelo nº 001"), campo novo exibido no cartão e na página.
  - A página de produto tem um bloco de cabeçalho que imita a frente de um envelope de molde antigo: número, nome, tamanhos, nível e desenho técnico de frente.
  - A imagem principal de cada molde novo é um "envelope" gerado (ver 6.3).
- **Admin:** os mesmos tokens e fontes, mas denso e funcional: sem molduras, tabelas com filetes.
- **Acessibilidade:** manter o contraste AA (`wine` sobre `linen` e `ink` sobre `linen` passam), o foco visível e o "pular para o conteúdo".

### 6.2 Telas

A home segue o mockup B:

1. topo centralizado
2. hero centralizado com CTA
3. trio "lookbook" com o destaque no meio, maior
4. "Saídos da mesa de corte" em grade de 4
5. coleções
6. "Como funciona" em 4 passos numerados com filetes
7. diferenciais
8. ateliê
9. newsletter

As demais telas reaproveitam os mesmos componentes (`SectionHeading`, `ProductCard`, `Mat`, `Button`, `Field`), de modo que a harmonia venha do sistema, não de ajustes página a página.

### 6.3 Moldes gerados

Script reprodutível versionado em `scripts/moldes/`. Ele gera PDFs e imagens a partir de uma tabela de medidas única. Saída: arquivos estáticos carregados pelo seed.

**Tabela de medidas (cm), padrão da loja, PP–GG:**
- cintura 62/66/70/76/82
- quadril 88/92/96/102/108
- busto 82/86/90/96/102

O GG é novo.

| nº | Molde | Peças (geométricas) | Tamanhos | Nível | Preço |
|---|---|---|---|---|---|
| 001 | Saia Godê (inteira e meio-godê) | quarto de círculo por tamanho (raio = cintura/2π ou cintura/π), cós retangular | PP–GG, comprimentos 50/60/70 | Iniciante | grátis |
| 002 | Saia Franzida com Elástico | 2 retângulos, canal de elástico | PP–GG | Iniciante | R$ 9 |
| 003 | Avental Retrô | peitilho e saia retangulares com cantos arredondados de raio fixo, bolso, alças | único | Iniciante | R$ 9 |
| 004 | Bolsa Tote | corpo, fundo com canto boxe, alças, bolso interno | único (40×38×10) | Iniciante | R$ 7 |
| 005 | Nécessaire Box | corpo com cantos boxe, aba de zíper | P/M | Iniciante | R$ 7 |

**Conteúdo de cada PDF A4:**
1. Capa estilo envelope.
2. Ficha: tecido, metragem por tamanho calculada do plano de corte, aviamentos, margem de 1 cm inclusa.
3. Tabela de medidas certa para o tipo de peça: saia mostra cintura, quadril e comprimento; bolsa mostra as medidas finais.
4. Plano de corte.
5. Passo a passo de montagem com diagramas simples.
6. Página de teste de escala com quadrado de 5 cm (2 polegadas não é necessário).
7. Folhas de molde em mosaico A4 com 1 cm de sobreposição, grade de referência A1, A2… e marcas de encaixe.

Detalhes:
- Cada tamanho tem traço diferente (contínuo, tracejado, pontilhado…) com legenda.
- Peças retangulares grandes (>A4×2) vêm como "corte direto pelas medidas", com diagrama cotado, em vez de dezenas de folhas.

**Saia Godê (001) em detalhe (call nossa):** um único produto, um download gratuito com as duas variantes (godê inteiro e meio-godê), cada uma em seu PDF A4 e A0. A peça é o quarto de círculo por tamanho; os comprimentos 50/60/70 são linhas de barra concêntricas na mesma peça. Corte: godê inteiro = tecido dobrado em quatro (duas dobras) ou 2× em dobra dupla; meio-godê = quarto de círculo em dobra, 2×. Metragem calculada para tecido de **1,50 m** de largura (padrão já usado na loja), indicada na ficha.

**PDF A0:** as mesmas peças em uma folha 841×1189 mm para gráfica.

**Imagens por produto (PNG, 3:4):**
- envelope (capa)
- desenho técnico frente/costas
- plano de corte

Tudo é gerado do mesmo desenho vetorial, para não haver divergência.

**Verificações automáticas no script:**
- o quadrado de teste mede 50,0 mm no PDF
- as dimensões geométricas batem com a fórmula (ex.: perímetro interno do godê = cintura + folga)
- costuras que se unem têm o mesmo comprimento
- o número de páginas declarado na ficha = o número real de páginas

### 6.4 Dados

- Os 6 produtos demonstrativos atuais passam a **rascunho** (não publicados, não apagados, `isDemo` mantido).
- Os 5 moldes novos entram via seed idempotente, com:
  - `ProductFile` A4 + A0 com `pages`, `sizeBytes` e `checksum` reais
  - `ProductSpec` coerente (`layersAvailable=false`, `projectorAvailable=false`)
  - `SizeChart` com as colunas certas por tipo
  - imagens
  - `isDemo=false`
- Campo novo `Product.modelNumber` (string curta). É a única mudança de schema, com migração aditiva.
- Coleção: os 5 moldes entram na coleção existente **"Básicos"** (call nossa; produto tem uma só coleção, sem mudança de schema). Verão e Alfaiataria ficam ocultas enquanto não tiverem produto publicado (coleção sem produto publicado não aparece na home nem em /colecoes).

## 7. Restrições

- **Fluxo Manus:**
  - Desenvolvemos aqui, fazemos push para `manus-sync` no repo público `tjys9fsfgj-ops/FioForma`.
  - O dono cola um prompt curto na Manus, que faz fetch, roda typecheck e build, aplica a migração e o seed, e publica.
  - O primeiro merge na Manus precisa de `--allow-unrelated-histories`. Os históricos não têm commit em comum, mas as árvores são idênticas (verificado).
  - Os prompts para a Manus devem ser curtos (pontos limitados) e pedir resposta curta.
- **Teste local:** não há MySQL no computador. O builder sobe um MySQL portátil em espaço do usuário (sem sudo) para rodar migração, seed, build e o fluxo de compra no navegador com `PAYMENT_GATEWAY=simulator`. A verificação final é no site publicado.
- O repositório é **público**. Nunca commitar `.env` nem chaves. A senha de admin padrão já foi trocada no ar.
- Os PDFs ficam no banco (`STORAGE_DRIVER=db`). Manter cada arquivo bem abaixo do limite de upload do admin.

## 8. Correções da auditoria incluídas

1. Rodapé com `[EMAIL]`/`[WHATSAPP]`: **ocultar** (decisão do dono) — linha de contato e links de WhatsApp só aparecem quando a variável estiver preenchida e não for placeholder. O dono passará e-mail e número depois.
2. A lista de arquivos e a contagem de folhas na ficha vêm dos `ProductFile` reais, não de texto livre.
3. Tabela de medidas por tipo de peça (sem busto em saia ou bolsa).
4. O banner de cookies não pode cobrir o botão de compra: banner compacto no rodapé da tela, sem sobrepor a barra de compra no celular.
5. Rótulo duplicado nos cartões de coleção ("Verão Verão").
6. `og:image` padrão (imagem da marca) e por produto (o envelope).
7. Datas do blog e das páginas espaçadas ou ocultas.
8. A seção de diferenciais não promete "A0" ou "projetor" que o produto não tem.

## 9. Decidido pelo dono

- Direção visual B · Ateliê clássico.
- Moldes criados por nós, não baixados da web.
- Hospedagem na Manus, com o repo público por enquanto.

- Contato oculto por enquanto.

## 10. Pagamento real (pendente do dono)

Não confirmado se o Mercado Pago está configurado na Manus. Assumimos que **não**. Moldes grátis funcionam sem chaves; os pagos só vendem quando o dono configurar. O plano inclui: guia curto para o dono (celular) criar as credenciais de produção e cadastrar a URL do webhook (`/api/webhooks/mercadopago`), prompt curto para a Manus definir `PAYMENT_GATEWAY=mercadopago`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET`, e teste final: compra de R$ 7 pelo dono + estorno. Enquanto não configurado, produtos pagos mostram o botão normalmente e o checkout exibe mensagem clara em vez de erro genérico.

## 11. Calls nossas (o dono pode corrigir)

- Os 5 moldes, os preços (1 grátis + 4 entre R$ 7 e 9) e a inclusão do GG.
- Envelope retrô e número de modelo.
- Produtos demonstrativos viram rascunho em vez de serem apagados.
- Sem camadas e sem projetor nesta etapa.

## 12. Deixado ao builder

- A ferramenta de geração dos PDFs (Python/reportlab ou Node/pdf-lib) e do PNG.
- A organização interna dos componentes.
- A ordem das telas no redesign.
- Como subir o MySQL local.
