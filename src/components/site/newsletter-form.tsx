'use client';

import { useActionState } from 'react';
import { subscribeNewsletter, type NewsletterState } from '@/app/actions/newsletter';

const initialState: NewsletterState = { status: 'idle' };

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, initialState);

  if (state.status === 'success') {
    return (
      <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-[13px] text-forest-800">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-4">
      <label htmlFor="newsletter-email" className="sr-only">
        Seu e-mail
      </label>
      <div className="flex rounded-full bg-white p-1 ring-1 ring-line focus-within:ring-2 focus-within:ring-sage">
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          placeholder="seu@email.com"
          autoComplete="email"
          className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-[13.5px] text-ink placeholder:text-muted/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-forest px-5 text-[12.5px] font-semibold text-paper transition-colors hover:bg-forest-800 disabled:opacity-60"
        >
          {pending ? 'Enviando' : 'Assinar'}
        </button>
      </div>
      {state.status === 'error' ? (
        <p className="mt-2 text-[12px] font-medium text-blush-300" role="alert">
          {state.message}
        </p>
      ) : null}
      <p className="mt-3 text-[11.5px] leading-relaxed text-paper/60">
        Um e-mail por mês, no máximo. Você pode sair quando quiser.
      </p>
    </form>
  );
}
