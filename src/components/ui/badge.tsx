import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'forest' | 'sage' | 'rose';
  className?: string;
}) {
  const tones = {
    neutral: 'border-line bg-paper text-ink/70',
    forest: 'border-wine bg-wine text-paper',
    sage: 'border-sand bg-sand text-wine',
    rose: 'border-rosewood bg-rosewood text-[#7A3F2E]',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.04em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
