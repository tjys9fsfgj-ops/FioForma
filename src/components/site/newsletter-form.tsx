'use client';

import { useActionState } from 'react';
import { subscribeNewsletter, type NewsletterState } from '@/app/actions/newsletter';

const initialState: NewsletterState = { status: 'idle' };

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, initialState);

  if (state.status === 'success') {
    return (
      <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-[13px] text-wine-800">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-5 text-left">
      <label htmlFor="newsletter-email" className="sr-only">
        Seu e-mail
      </label>
      <div className="flex border-b border-linen/40 focus-within:border-linen">
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          placeholder="seu@email.com"
          autoComplete="email"
          className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-[14px] text-linen placeholder:text-linen/45 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-linen transition-colors hover:text-paper disabled:opacity-60"
        >
          {pending ? 'Enviando' : 'Assinar'}
        </button>
      </div>
      {state.status === 'error' ? (
        <p className="mt-2 text-[12px] font-medium text-rosewood" role="alert">
          {state.message}
        </p>
      ) : null}
      <p className="mt-3 text-center text-[11.5px] leading-relaxed text-linen/55">
        Um e-mail por mês, no máximo. Você pode sair quando quiser.
      </p>
    </form>
  );
}
