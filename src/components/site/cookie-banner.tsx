'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ff_cookie_consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // navegador sem storage: não insiste
    }
  }, []);

  function decide(value: 'all' | 'essential') {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      window.dispatchEvent(new CustomEvent('ff:consent', { detail: value }));
    } catch {
      // ignora
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Preferências de cookies"
      className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-3xl rounded-3xl border border-line bg-paper/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-paper backdrop-blur sm:bottom-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <p className="max-w-2xl text-[11.5px] leading-snug text-ink/80 sm:text-[12.5px] sm:leading-relaxed">
          Usamos apenas cookies essenciais para carrinho, sessão e segurança. Métricas anônimas só entram
          com o seu consentimento.{' '}
          <Link href="/privacidade" className="underline decoration-line underline-offset-4 hover:text-wine">
            Política de privacidade
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => decide('essential')}
            className="rounded-full border border-ink/20 px-4 py-2.5 text-[12px] font-semibold text-ink transition-colors hover:border-wine hover:text-wine"
          >
            Só essenciais
          </button>
          <button
            type="button"
            onClick={() => decide('all')}
            className="rounded-full border border-wine bg-wine px-5 py-2.5 text-[12px] font-semibold text-paper transition-colors hover:bg-wine-800"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
