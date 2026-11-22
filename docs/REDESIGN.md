# Redesign — "Ateliê suave"

Mudança **somente visual**. Nenhuma regra de negócio, pagamento, autenticação, download, banco de dados ou Server Action foi alterada.

## Direção
Saiu o editorial "papel e linha" (cantos retos, bordas finas) e entrou uma boutique contemporânea: cantos arredondados, botões em pílula, faixas de cor (verde, rosé, sálvia), imagens em arco, tipografia serifada maior e mais macia (Fraunces com eixo SOFT).

Paleta (a do briefing + dois apoios quentes): off-white `#F7F6F2`, carvão `#222725`, verde `#24483D`, sálvia (`sage-100/200/300`), rosé (`blush-100/200/300`), argila `#A8503A` (só detalhes e etiquetas), creme `#EFEBE1`.

## O que mudou
- `tailwind.config.ts`: novos tokens (`sage-*`, `blush-*`, `clay`, `cream`), `rounded-arch`, `shadow-soft`, animação `marquee`.
- `src/app/globals.css`: campos arredondados com foco em anel e seta no `select`, `.pill`, `.surface`, citações em bloco.
- `components/ui`: botões em pílula (novas variantes `paper` e `outline-light` para fundos escuros), badges em pílula, `SectionHeading` com etiqueta e botão de ação em pílula.
- `components/site`: cabeçalho com busca em pílula e carrinho em destaque, rodapé verde com newsletter em cartão, banner de cookies flutuante.
- `components/product`: cartão de produto com imagem arredondada, botão "Ver molde" no hover e selo de oferta; placeholder novo, colorido, com peça de molde desenhada; galeria arredondada.
- Home reescrita: hero verde com arcos, faixa de diferenciais em movimento, coleções coloridas, lançamentos, "Como funciona" em cartões, benefícios, chamada final.
- Catálogo (cabeçalho, barra de filtros, chips, paginação), página de produto (caixa de compra, ficha técnica, FAQ, barra de compra fixa no celular), carrinho, checkout, login/cadastro, conta e admin (menu lateral, tabelas, botões).
- Todas as caixas com borda (`border border-line`) ganharam raio de forma automática.

## Atenção ao continuar
- `cn()` é só `clsx`: não sobrescreva cores de uma variante de botão via `className`; crie uma variante em `components/ui/button.tsx`.
- Não foi possível rodar `pnpm build` ao gerar este redesign (sem instalação de pacotes). Rode `pnpm install && pnpm typecheck && pnpm build` e confira as telas no celular e no computador antes de publicar.
