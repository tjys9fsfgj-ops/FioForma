'use client';

import { useActionState } from 'react';
import { applyCouponAction, removeCouponAction, type CouponState } from '@/app/actions/checkout';

const initial: CouponState = { status: 'idle' };

export function CouponForm({ appliedCode }: { appliedCode?: string }) {
  const [state, formAction, pending] = useActionState(applyCouponAction, initial);

  if (appliedCode) {
    return (
      <div className="rounded-2xl flex items-center justify-between gap-3 border border-forest-200 bg-forest-50 px-3 py-2.5 text-[12.5px] text-forest-800">
        <span>
          Cupom <strong className="font-semibold">{appliedCode}</strong> aplicado
        </span>
        <form action={removeCouponAction}>
          <button type="submit" className="underline decoration-forest-300 underline-offset-4">
            Remover
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <label htmlFor="coupon" className="field-label">
        Cupom de desconto
      </label>
      <div className="flex">
        <input
          id="coupon"
          name="coupon"
          placeholder="CÓDIGO"
          autoComplete="off"
          className="field-input min-w-0 flex-1 uppercase"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl border border-l-0 border-line bg-white px-4 text-[11.5px] font-medium uppercase tracking-[0.08em] text-forest hover:bg-forest hover:text-paper disabled:opacity-60"
        >
          {pending ? '…' : 'Aplicar'}
        </button>
      </div>
      {state.status === 'error' ? <p className="text-[12px] text-[#9B3A2E]">{state.message}</p> : null}
      {state.status === 'success' ? <p className="text-[12px] text-forest">{state.message}</p> : null}
    </form>
  );
}
