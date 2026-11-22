# Operação do dia a dia

Runbook curto para quem cuida da loja depois do lançamento.

## Rotina semanal

1. Abrir **Painel → Pedidos** e conferir se há pedidos pendentes antigos (mais de 1 hora). Pix expirado deve ser cancelado.
2. Conferir **Relatórios**: receita, ticket médio, pedidos pagos e downloads.
3. Ler o e-mail de suporte e responder em até 1 dia útil.
4. Verificar se o backup automático rodou.
5. Conferir se os arquivos mais vendidos continuam abrindo (baixar um PDF de teste).

## Pedido pago fora do gateway (Pix manual, cortesia)

1. **Pedidos → abrir o pedido**.
2. Em **Ações**, preencher a nota (ex.: "Pix recebido em 12/03, comprovante no WhatsApp").
3. Clicar em **Marcar como pago e liberar arquivos**.
4. O cliente recebe o e-mail com o link da biblioteca; o acesso é criado automaticamente.

Use só quando o dinheiro já estiver na conta.

## Pedido pago que não liberou

1. Verificar em **Pedidos → Pagamentos e eventos** se o webhook chegou.
2. Se o pagamento aparece no Mercado Pago mas não no painel, confirmar manualmente com a referência do pagamento na nota.
3. Se o webhook estiver falhando, conferir `MERCADOPAGO_WEBHOOK_SECRET` e a URL cadastrada no Mercado Pago.

## Reembolso

1. Fazer o estorno no painel do Mercado Pago (o dinheiro só volta por lá).
2. No admin, **Pedidos → Registrar reembolso**, informando o motivo e o ID do estorno.
3. Isso marca o pedido como reembolsado e revoga o acesso aos arquivos. O cliente continua com os arquivos já baixados — deixe isso claro na política.

## Cliente não recebeu o e-mail

1. **Pedidos → Reenviar e-mail do pedido**.
2. Se o cliente comprou como visitante e perdeu o link, ele pode pedir um novo em `/acesso` informando o e-mail.
3. Verifique a pasta de spam e se o domínio do remetente está verificado no Resend.

## Cliente pediu exclusão de dados (LGPD)

1. Responder confirmando o prazo (até 15 dias).
2. Em **Minha conta → Dados pessoais**, o próprio cliente pode excluir a conta.
3. Se precisar fazer manualmente: apagar/anonimizar o usuário, mantendo apenas os registros fiscais obrigatórios (pedidos) sem dados pessoais desnecessários.
4. Registrar a solicitação e a data.

## Trocar a senha do administrador

1. Sair e usar **Recuperar senha** com o e-mail do admin.
2. O link chega pelo provedor de e-mail configurado.
3. Se o e-mail não estiver funcionando, gerar um novo hash com:

   ```bash
   node -e "console.log(require('bcryptjs').hashSync('NovaSenhaForte', 12))"
   ```

   e atualizar `User.passwordHash` no banco.

## Rotação de chaves

- **AUTH_SECRET**: trocar invalida todas as sessões (todos precisam entrar de novo). Faça em janela de baixo movimento.
- **Mercado Pago**: gerar novo access token no painel, atualizar a variável e reiniciar. O token antigo deve ser revogado.
- **Resend**: criar nova chave, atualizar, revogar a antiga.
- **Banco**: trocar senha no provedor, atualizar `DATABASE_URL` e reiniciar.

## Aumentar capacidade de arquivos

Se o banco crescer muito por causa dos PDFs:

1. Criar bucket privado no R2/S3.
2. Configurar `STORAGE_DRIVER=s3` e as cinco variáveis `S3_*`.
3. Reenviar os PDFs pelo admin (o novo upload vai para o bucket).
4. Manter os arquivos antigos no banco até confirmar que todos foram migrados.

## Monitoramento mínimo

- Uptime: monitorar `https://SEU-DOMINIO/api/health` a cada 5 minutos.
- Erros: configurar alerta no provedor (Vercel/container) para 5xx.
- Banco: alerta de conexões e espaço em disco.
- Pagamentos: revisar semanalmente se todos os pagamentos do Mercado Pago têm pedido correspondente.

## Quando algo quebrar

1. Conferir `/api/health`.
2. Ler os logs do provedor (Vercel ou container).
3. Verificar se as migrações foram aplicadas (`pnpm db:migrate`).
4. Se for pagamento, comparar o pedido no admin com o pagamento no Mercado Pago.
5. Se for download, testar com uma conta de teste e conferir o `DownloadLog`.
