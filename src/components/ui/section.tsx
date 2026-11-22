import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'center',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  align?: 'left' | 'center';
  className?: string;
}) {
  const centered = align === 'center';
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        centered ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', centered && 'mx-auto')}>
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h2 className="text-[clamp(1.9rem,3.6vw,2.6rem)] leading-[1.1]">{title}</h2>
        {description ? (
          <p className={cn('mt-3 max-w-xl text-[15px] leading-relaxed text-muted', centered && 'mx-auto')}>{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="shrink-0 border-b border-ink pb-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-wine hover:text-wine"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function StitchDivider({ className }: { className?: string }) {
  return <div className={cn('stitch w-full opacity-70', className)} aria-hidden="true" />;
}
