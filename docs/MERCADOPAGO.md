# Ligar o Mercado Pago (pelo celular)

Enquanto isto não for feito, a loja funciona assim:

- **Moldes grátis**: funcionam normalmente (não passam pelo Mercado Pago).
- **Moldes pagos**: o checkout mostra "O pagamento online está sendo configurado" e **não cria pedido**.

## 1. Criar as credenciais

1. Entre em **mercadopago.com.br/developers** com a conta que vai receber o dinheiro.
2. **Suas integrações → Criar aplicação**.
   - Nome: `FioForma`
   - Tipo de pagamento: **Pagamentos online**
   - Produto: **Checkout Pro**
3. Abra a aplicação → **Credenciais de produção** → ative (o Mercado Pago pede alguns dados do negócio).
4. Copie e guarde num lugar seguro:
   - **Public Key** (começa com `APP_USR-`)
   - **Access Token** (começa com `APP_USR-`; é secreto, não mande para ninguém)

## 2. Cadastrar o aviso de pagamento (webhook)

1. Na mesma aplicação → **Webhooks → Configurar notificações** → **Modo produção**.
2. URL: `https://SEU-DOMINIO/api/webhooks/mercadopago`
   (hoje: `https://fioforma-mcuwzwf5.manus.space/api/webhooks/mercadopago`)
3. Evento: marque **Pagamentos**.
4. Salve e copie a **Assinatura secreta** que aparece.

## 3. Colar na Manus

Mande para a Manus (troque os três valores entre colchetes):

> Configure estas variáveis de ambiente do projeto e publique de novo. Não mostre os valores na resposta.
> PAYMENT_GATEWAY=mercadopago
> MERCADOPAGO_ACCESS_TOKEN=[seu Access Token]
> MERCADOPAGO_PUBLIC_KEY=[sua Public Key]
> MERCADOPAGO_WEBHOOK_SECRET=[sua assinatura secreta]
> NEXT_PUBLIC_SITE_URL=https://fioforma-mcuwzwf5.manus.space
> Resposta curta: só "configurado e publicado" ou o erro.

`NEXT_PUBLIC_SITE_URL` precisa ser o endereço real do site: é para lá que o Mercado Pago manda o aviso de pagamento e devolve a cliente depois de pagar. Se mudar para domínio próprio, troque aqui e no passo 2.

## 4. Teste final (R$ 7)

1. No site, compre a **Bolsa Tote** com o seu Pix ou cartão.
2. Depois de pagar, a página do pedido deve mostrar **Pago** e o botão **Baixar PDF**.
3. Baixe o PDF e abra.
4. Estorne no app do Mercado Pago (**Atividade → o pagamento → Devolver**).
5. No painel da loja: **Pedidos → o pedido → Registrar reembolso**.

Se o pedido ficar parado em "aguardando pagamento" mais de alguns minutos, veja `docs/OPERACAO.md` → "Pedido pago que não liberou".
