'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { sendContactMessage, type ContactState } from '@/app/actions/contact';
import { Button } from '@/components/ui/button';
import { Field, FormMessage } from '@/components/ui/field';

const initial: ContactState = { status: 'idle' };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, initial);

  if (state.status === 'success') {
    return <FormMessage tone="success">{state.message}</FormMessage>;
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' ? <FormMessage>{state.message}</FormMessage> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" name="name" required error={state.fieldErrors?.name}>
          <input id="name" name="name" required autoComplete="name" className="field-input" />
        </Field>
        <Field label="E-mail" name="email" required error={state.fieldErrors?.email}>
          <input id="email" name="email" type="email" required autoComplete="email" className="field-input" />
        </Field>
      </div>
      <Field label="Assunto" name="subject" error={state.fieldErrors?.subject}>
        <input id="subject" name="subject" className="field-input" placeholder="Dúvida sobre um molde" />
      </Field>
      <Field label="Mensagem" name="message" required error={state.fieldErrors?.message}>
        <textarea id="message" name="message" required rows={6} className="field-input min-h-32" />
      </Field>
      <label className="flex items-start gap-2 text-[11.5px] leading-relaxed text-muted">
        <input type="checkbox" name="privacy" required className="mt-0.5 h-4 w-4 accent-[#24483D]" />
        <span>
          Autorizo o uso dos meus dados para responder esta mensagem, conforme a{' '}
          <Link href="/privacidade" className="text-forest underline underline-offset-4">
            política de privacidade
          </Link>
          .
        </span>
      </label>
      {state.fieldErrors?.privacy ? (
        <p className="text-[12px] text-[#9B3A2E]">{state.fieldErrors.privacy}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Enviando…' : 'Enviar mensagem'}
      </Button>
    </form>
  );
}
