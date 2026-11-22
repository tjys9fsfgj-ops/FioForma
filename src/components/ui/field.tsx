import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type FieldProps = {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children?: ReactNode;
  className?: string;
};

export function Field({ label, name, hint, error, required, children, className }: FieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className={cn('w-full', className)}>
      <label htmlFor={name} className="field-label">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children ?? (
        <input
          id={name}
          name={name}
          required={required}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? true : undefined}
          className={cn('field-input', error && 'border-rose')}
        />
      )}
      {hint ? (
        <p id={hintId} className="mt-1.5 text-[12px] leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-[12px] font-medium text-[#9B3A2E]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = ComponentProps<'input'> & { invalid?: boolean };

export function Input({ className, invalid, ...props }: InputProps) {
  return <input className={cn('field-input', invalid && 'border-rose', className)} {...props} />;
}

type TextareaProps = ComponentProps<'textarea'> & { invalid?: boolean };

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return <textarea className={cn('field-input min-h-28', invalid && 'border-rose', className)} {...props} />;
}

type SelectProps = ComponentProps<'select'>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select className={cn('field-input appearance-none pr-9', className)} {...props}>
      {children}
    </select>
  );
}

export function FormMessage({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const tones = {
    error: 'border-[#E4C4BE] bg-[#FBF1EF] text-[#8A342A]',
    success: 'border-forest-200 bg-forest-50 text-forest-800',
    info: 'border-line bg-white text-muted',
  } as const;
  return <div className={cn('rounded-2xl border px-4 py-3 text-[13.5px] leading-relaxed', tones[tone])}>{children}</div>;
}
