import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'wine' | 'sand' | 'rosewood';
  className?: string;
}) {
  const tones = {
    neutral: 'border-rule bg-transparent text-ink/80',
    wine: 'border-wine bg-wine text-paper',
    sand: 'border-sand bg-sand text-ink',
    rosewood: 'border-rosewood bg-rosewood text-wine-800',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center border px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.14em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
