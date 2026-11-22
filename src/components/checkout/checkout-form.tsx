'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { startCheckoutAction, type CheckoutState } from '@/app/actions/checkout';
import { Button } from '@/components/ui/button';
import { Field, FormMessage } from '@/components/ui/field';

const initialState: CheckoutState = { status: 'idle' };

export function CheckoutForm({
  defaultName,
  defaultEmail,
  defaultPhone,
  isLoggedIn,
  demo,
  free = false,
  blockedMessage,
}: {
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
  isLoggedIn: boolean;
  demo: boolean;
  /** Pedido de valor zero: não mostra forma de pagamento. */
  free?: boolean;
  /** Pagamento indisponível: mostra o aviso e desabilita o envio. */
  blockedMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(startCheckoutAction, initialState);

  return (
    <form action={formAction} className="space-y-8">
      {blockedMessage ? <FormMessage>{blockedMessage}</FormMessage> : null}
      {state.status === 'error' && state.message ? <FormMessage>{state.message}</FormMessage> : null}

      <section>
        <h2 className="font-serif text-[22px] text-wine">Seus dados</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          {isLoggedIn
            ? 'Você está comprando com sua conta. Os moldes entram direto na sua biblioteca.'
            : 'Compra como visitante: enviamos um link de acesso por e-mail e você pode criar uma senha depois.'}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" name="name" required error={state.fieldErrors?.name} className="sm:col-span-2">
            <input
              id="name"
              name="name"
              required
              autoComplete="name"
              defaultValue={defaultName}
              className="field-input"
            />
          </Field>
          <Field
            label="E-mail"
            name="email"
            required
            hint="É para este e-mail que enviamos o acesso aos arquivos."
            error={state.fieldErrors?.email}
          >
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={defaultEmail}
              readOnly={isLoggedIn}
              className="field-input read-only:bg-paper"
            />
          </Field>
          <Field label="Telefone (opcional)" name="phone" hint="Só para contato sobre o pedido." error={state.fieldErrors?.phone}>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={defaultPhone}
              placeholder="(11) 90000-0000"
              className="field-input"
            />
          </Field>
        </div>
      </section>

      {free ? (
        <input type="hidden" name="method" value="PIX" />
      ) : (
      <section className="border-t border-line pt-8">
        <h2 className="font-serif text-[22px] text-wine">Pagamento</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          Pix ou cartão de crédito, processados pelo Mercado Pago. Sem boleto.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 border border-rule bg-paper p-4 transition-colors has-[:checked]:border-wine has-[:checked]:bg-sand">
            <input type="radio" name="method" value="PIX" defaultChecked className="mt-1 accent-[#7A3B3B]" />
            <span>
              <span className="block text-[14px] font-medium text-ink">Pix</span>
              <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
                Aprovação em segundos. QR Code na tela.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 border border-rule bg-paper p-4 transition-colors has-[:checked]:border-wine has-[:checked]:bg-sand">
            <input type="radio" name="method" value="CARD" className="mt-1 accent-[#7A3B3B]" />
            <span>
              <span className="block text-[14px] font-medium text-ink">Cartão de crédito</span>
              <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
                Em até 12x, direto no ambiente do Mercado Pago.
              </span>
            </span>
          </label>
        </div>

        {demo ? (
          <div className="mt-4 border-l-2 border-wine bg-linen px-4 py-3 text-[12px] leading-relaxed text-muted">
            <strong className="font-medium">Modo demonstração ativo.</strong> Nenhum valor será cobrado. Ao
            continuar, você verá uma tela para simular a aprovação do pagamento e testar a entrega dos
            arquivos.
          </div>
        ) : null}
      </section>
      )}

      <section className="border-t border-line pt-6">
        <label className="flex items-start gap-3 text-[12.5px] leading-relaxed text-muted">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#7A3B3B]"
          />
          <span>
            Li e aceito os{' '}
            <Link href="/termos" target="_blank" className="text-wine underline underline-offset-4">
              termos de uso
            </Link>
            , a{' '}
            <Link href="/licenca" target="_blank" className="text-wine underline underline-offset-4">
              licença do molde
            </Link>{' '}
            e a{' '}
            <Link href="/privacidade" target="_blank" className="text-wine underline underline-offset-4">
              política de privacidade
            </Link>
            .
          </span>
        </label>
        {state.fieldErrors?.terms ? (
          <p className="mt-2 text-[12px] font-medium text-[#9B3A2E]">{state.fieldErrors.terms}</p>
        ) : null}
      </section>

      <Button type="submit" size="lg" className="w-full" disabled={pending || Boolean(blockedMessage)}>
        {free
          ? pending
            ? 'Liberando seus moldes…'
            : 'Receber meus moldes'
          : pending
            ? 'Preparando pagamento…'
            : 'Continuar para o pagamento'}
      </Button>
      <p className="text-center text-[11px] text-muted">
        {free
          ? 'Os arquivos ficam disponíveis na hora, na página do pedido e na sua biblioteca.'
          : 'Você será levado ao ambiente seguro do Mercado Pago para concluir.'}
      </p>
    </form>
  );
}
