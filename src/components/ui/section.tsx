import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  className,
}: {
  index?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {index || eyebrow ? (
          <p className="pill mb-4">
            {index ? <span className="font-serif text-[12px] text-wine">{index}</span> : null}
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[clamp(1.9rem,3.8vw,2.9rem)] leading-[1.05]">{title}</h2>
        {description ? (
          <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-wine/25 px-5 py-2.5 text-[13px] font-semibold text-wine transition-colors hover:border-wine hover:bg-wine hover:text-paper"
        >
          {action.label}
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      ) : null}
    </div>
  );
}

export function StitchDivider({ className }: { className?: string }) {
  return <div className={cn('stitch w-full opacity-70', className)} aria-hidden="true" />;
}
