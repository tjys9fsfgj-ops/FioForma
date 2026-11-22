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
      style={{ bottom: 'var(--buybar-h, 0px)' }}
      className="fixed inset-x-0 z-50 border-t border-rule bg-paper px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-page flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-4 lg:px-8">
        <p className="text-[12px] leading-snug text-ink/80 sm:text-[13px]">
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
            className="border border-ink px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Só essenciais
          </button>
          <button
            type="button"
            onClick={() => decide('all')}
            className="border border-wine bg-wine px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-wine-800"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
