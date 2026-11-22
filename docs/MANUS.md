# Fluxo com a Manus

O código é feito aqui (Claude Code) e enviado para a branch **`manus-sync`** do repositório
`tjys9fsfgj-ops/FioForma`. A Manus só puxa, testa, aplica banco e publica.

- Na Manus o remoto do GitHub se chama **`github`** (sem login: o repositório é público para leitura).
- A `main` da Manus tem um histórico próprio (veio de antes do GitHub). Por isso o **primeiro** envio
  precisa de `--allow-unrelated-histories`; os seguintes são merges normais.

## Prompt do primeiro envio

> git status; se houver alterações não commitadas, PARE e liste os arquivos. Senão: git fetch github && git merge --allow-unrelated-histories -X theirs --no-edit github/manus-sync. Confirme que o último commit da manus-sync é <HASH>. Depois rode: pnpm install && pnpm db:migrate && pnpm db:seed && pnpm typecheck && pnpm build. Se algo falhar, NÃO corrija: responda só com o comando e as primeiras linhas do erro. Se passar, publique o checkpoint. Resposta curta: hash, resultado do build e se publicou.

`-X theirs` faz valer a versão do GitHub nos arquivos que mudaram (o código da Manus era idêntico ao
GitHub quando este fluxo começou, conferido com `git diff --stat`).

## Prompt dos envios seguintes

> git status; se houver alterações não commitadas, PARE e liste os arquivos. Senão: git fetch github && git merge --no-edit github/manus-sync; se houver conflito, PARE e liste os arquivos. Confirme o hash <HASH>. Rode pnpm install && pnpm db:migrate && pnpm db:seed && pnpm typecheck && pnpm build. Se falhar, NÃO corrija: responda só com o comando e as primeiras linhas do erro. Se passar, publique o checkpoint. Resposta curta: hash, resultado do build e se publicou.

## O que o seed faz na Manus

- Cria/atualiza coleções, categorias, páginas e o admin (sem trocar a senha de um admin que já existe).
- Deixa os 6 moldes de exemplo como **rascunho** (somem da loja, não são apagados).
- Carrega os moldes reais de `prisma/moldes/` (PDFs e imagens). Rodar de novo não duplica nada:
  só troca arquivos cujo conteúdo mudou.
