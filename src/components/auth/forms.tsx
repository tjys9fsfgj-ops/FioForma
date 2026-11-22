'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  loginAction,
  registerAction,
  requestAccessLinkAction,
  requestPasswordResetAction,
  resetPasswordAction,
  setPasswordAction,
  updateProfileAction,
  type AuthState,
} from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/field';

const initial: AuthState = { status: 'idle' };

function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <FormMessage>{message}</FormMessage>;
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' ? <ErrorMessage message={state.message} /> : null}
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="field-label">
          E-mail
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field-input" />
      </div>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor="password" className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
            Senha
          </label>
          <Link href="/recuperar-senha" className="text-[11.5px] text-wine underline underline-offset-4">
            Esqueci
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="field-input"
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' ? <ErrorMessage message={state.message} /> : null}
      <div>
        <label htmlFor="name" className="field-label">
          Nome
        </label>
        <input id="name" name="name" required autoComplete="name" className="field-input" />
        {state.fieldErrors?.name ? <p className="mt-1 text-[12px] text-[#9B3A2E]">{state.fieldErrors.name}</p> : null}
      </div>
      <div>
        <label htmlFor="email" className="field-label">
          E-mail
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field-input" />
        {state.fieldErrors?.email ? <p className="mt-1 text-[12px] text-[#9B3A2E]">{state.fieldErrors.email}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className="field-label">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="field-input"
          />
          {state.fieldErrors?.password ? (
            <p className="mt-1 text-[12px] text-[#9B3A2E]">{state.fieldErrors.password}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="confirm" className="field-label">
            Repetir senha
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="field-input"
          />
          {state.fieldErrors?.confirm ? (
            <p className="mt-1 text-[12px] text-[#9B3A2E]">{state.fieldErrors.confirm}</p>
          ) : null}
        </div>
      </div>
      <label className="flex items-start gap-2 text-[11.5px] leading-relaxed text-muted">
        <input type="checkbox" name="terms" required className="mt-0.5 h-4 w-4 accent-[#7A3B3B]" />
        <span>
          Aceito os{' '}
          <Link href="/termos" className="text-wine underline underline-offset-4">
            termos
          </Link>{' '}
          e a{' '}
          <Link href="/privacidade" className="text-wine underline underline-offset-4">
            política de privacidade
          </Link>
          .
        </span>
      </label>
      {state.fieldErrors?.terms ? <p className="text-[12px] text-[#9B3A2E]">{state.fieldErrors.terms}</p> : null}
      <label className="flex items-start gap-2 text-[11.5px] leading-relaxed text-muted">
        <input type="checkbox" name="newsletter" className="mt-0.5 h-4 w-4 accent-[#7A3B3B]" />
        <span>Quero receber lançamentos e notas de ateliê (opcional).</span>
      </label>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initial);

  if (state.status === 'success') {
    return <FormMessage tone="success">{state.message}</FormMessage>;
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' ? <ErrorMessage message={state.message} /> : null}
      <div>
        <label htmlFor="email" className="field-label">
          E-mail da conta
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field-input" />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Enviando…' : 'Enviar link de redefinição'}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const action = async (_prev: AuthState, formData: FormData) => resetPasswordAction(token, formData);
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' ? <ErrorMessage message={state.message} /> : null}
      <div>
        <label htmlFor="password" className="field-label">
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="field-label">
          Repetir nova senha
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field-input"
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar nova senha'}
      </Button>
    </form>
  );
}

export function AccessLinkForm() {
  const [state, formAction, pending] = useActionState(requestAccessLinkAction, initial);

  if (state.status === 'success') {
    return <FormMessage tone="success">{state.message}</FormMessage>;
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' ? <ErrorMessage message={state.message} /> : null}
      <div>
        <label htmlFor="email" className="field-label">
          E-mail usado na compra
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field-input" />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Enviando…' : 'Receber link de acesso'}
      </Button>
    </form>
  );
}

export function SetPasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, pending] = useActionState(setPasswordAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' ? <ErrorMessage message={state.message} /> : null}
      {state.status === 'success' ? <FormMessage tone="success">{state.message}</FormMessage> : null}
      {hasPassword ? (
        <div>
          <label htmlFor="current" className="field-label">
            Senha atual
          </label>
          <input id="current" name="current" type="password" required className="field-input" />
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="new-password" className="field-label">
            {hasPassword ? 'Nova senha' : 'Criar senha'}
          </label>
          <input
            id="new-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="field-label">
            Repetir senha
          </label>
          <input
            id="confirm-password"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="field-input"
          />
        </div>
      </div>
      <Button type="submit" size="md" disabled={pending}>
        {pending ? 'Salvando…' : hasPassword ? 'Alterar senha' : 'Definir senha'}
      </Button>
    </form>
  );
}

export function ProfileForm({
  name,
  phone,
  marketingOptIn,
}: {
  name: string;
  phone: string;
  marketingOptIn: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' ? <ErrorMessage message={state.message} /> : null}
      {state.status === 'success' ? <FormMessage tone="success">{state.message}</FormMessage> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="field-label">
            Nome
          </label>
          <input id="name" name="name" defaultValue={name} required className="field-input" />
        </div>
        <div>
          <label htmlFor="phone" className="field-label">
            Telefone
          </label>
          <input id="phone" name="phone" defaultValue={phone} className="field-input" />
        </div>
      </div>
      <label className="flex items-start gap-2 text-[12px] text-muted">
        <input
          type="checkbox"
          name="newsletter"
          defaultChecked={marketingOptIn}
          className="mt-0.5 h-4 w-4 accent-[#7A3B3B]"
        />
        Quero receber lançamentos e notas de ateliê.
      </label>
      <Button type="submit" size="md" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar dados'}
      </Button>
    </form>
  );
}
