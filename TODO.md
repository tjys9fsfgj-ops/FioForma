# TODO — FioForma

## 1. Base, marca e banco
- [x] Next.js 15 + TypeScript com SSR, Prisma e banco gerenciado migrado.
- [x] Marca, suporte e dados legais configuráveis em `src/config/brand.ts` (placeholders `[WHATSAPP]`, `[EMAIL]`, `[RAZÃO SOCIAL]`, `[CNPJ — MEI]`, `[ENDEREÇO]`).
- [x] Modelo completo (users, products, imagens, ficha, medidas, arquivos, coleções, categorias, carrinho, pedidos, pagamentos/eventos, entitlements, downloads, cupons, páginas, settings, auditoria).
- [x] Migrações versionadas e seed idempotente.

## 2. Catálogo público e home
- [x] Home na ordem do brief, sem depoimentos nem números inventados.
- [x] Catálogo com busca, filtros (coleção, categoria, tamanho, nível, preço), ordenação, paginação, estado vazio e limpeza de filtros.
- [x] Cartões 4:5 com faixa PP–G, formato e preço; placeholders neutros quando não há foto.

## 3. Página de produto
- [x] Galeria, ficha técnica condicional (campos vazios não aparecem), tabela de medidas, FAQ, relacionados, compra fixa no celular, JSON-LD.

## 4. Carrinho e checkout
- [x] Carrinho com adição/remoção, subtotal recalculado no servidor e cupom.
- [x] Checkout com conta ou visitante, Pix e cartão via Mercado Pago, sem boleto.
- [x] Pedido só fica pago após confirmação verificada; webhook deduplicado; retorno do navegador não marca pago.
- [x] Página de pedido com status e downloads.

## 5. Entrega digital e biblioteca
- [x] Acesso criado apenas com pagamento confirmado; re-download ilimitado com rate limit.
- [x] Link assinado de 10 minutos e log de download; não autorizado recebe 403.
- [x] Biblioteca e pedidos na conta.

## 6. Conta e autenticação
- [x] Cadastro, login, recuperação, dados pessoais, troca de senha e exclusão de conta.
- [x] Cookie HttpOnly/Secure/SameSite=None, bcrypt, rate limit.
- [x] Acesso de visitante por link de uso único, com definição de senha depois.

## 7. Admin
- [x] Produtos completos (fotos, PDFs, ficha, medidas, SEO, publicação).
- [x] Coleções, categorias, pedidos/pagamentos, cupons, clientes, páginas/blog, relatórios, configurações.
- [x] Upload restrito a PDF/imagem com verificação de tipo e limite; auditoria.
- [x] Área protegida por papel ADMIN e fora da indexação.

## 8. Conteúdo, legal e LGPD
- [x] Guias, blog, sobre, contato, FAQ, termos, privacidade, licença e reembolso editáveis no admin.
- [x] Textos legais como rascunho com aviso "validar com advogado".
- [x] Banner de cookies, coleta mínima, IP anonimizado e exclusão de dados.

## 9. SEO, acessibilidade e segurança
- [x] Metadados, sitemap, robots, dados estruturados, conta/admin fora da indexação.
- [x] Navegação por teclado, foco visível, labels e texto alternativo.
- [x] Segredos só no servidor, validação, rate limit, cabeçalhos e recálculo de preço.

## 10. Entrega
- [x] README com instalação, variáveis, deploy, backup e checklist.
- [x] Lista de pendências (chaves, conteúdo, dados comerciais, textos legais) no README.
- [x] Testes unitários (`pnpm test`) e teste manual dos fluxos: catálogo, produto, carrinho, checkout, pagamento demo, pedido, link de acesso, biblioteca, admin e download.

## 11. Pendências do dono da loja
- [ ] Chaves do Mercado Pago (access token, public key, segredo do webhook).
- [ ] Chave do Resend e domínio verificado.
- [ ] WhatsApp, e-mail e Instagram reais.
- [ ] Razão social, CNPJ e endereço.
- [ ] Revisão jurídica dos textos.
- [ ] Fotos e PDFs reais dos moldes (substituir os 6 demos).
- [ ] Domínio e provedor de hospedagem definidos.
