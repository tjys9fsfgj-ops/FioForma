import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'ghost' | 'quiet' | 'paper' | 'outline-light';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full border font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary:
    'border-forest bg-forest text-paper shadow-[0_8px_20px_-12px_rgba(36,72,61,0.9)] hover:-translate-y-px hover:bg-forest-800 hover:border-forest-800',
  outline: 'border-forest/30 bg-white/60 text-forest hover:border-forest hover:bg-white',
  ghost: 'border-transparent bg-transparent text-forest hover:bg-forest/5',
  quiet: 'border-line bg-white text-ink hover:border-forest/40',
  paper: 'border-paper bg-paper text-forest hover:border-white hover:bg-white',
  'outline-light': 'border-paper/40 bg-transparent text-paper hover:border-paper hover:bg-paper/10',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-[13px]',
  md: 'px-6 py-3 text-[14px]',
  lg: 'px-8 py-4 text-[15px]',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function ButtonLink({ variant = 'primary', size = 'md', className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
