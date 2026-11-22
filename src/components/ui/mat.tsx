import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Moldura de papel do Ateliê clássico: toda imagem de produto entra aqui,
 * sempre em 3:4, com legenda opcional em itálico.
 */
export function Mat({
  children,
  caption,
  tone = 'sand',
  className,
  innerClassName,
}: {
  children?: ReactNode;
  caption?: ReactNode;
  tone?: 'sand' | 'rosewood';
  className?: string;
  innerClassName?: string;
}) {
  return (
    <figure className={cn('bg-paper p-3 shadow-paper', caption ? 'pb-0' : '', className)}>
      <div
        className={cn(
          'relative aspect-[3/4] overflow-hidden',
          tone === 'sand' ? 'bg-sand' : 'bg-rosewood',
          innerClassName,
        )}
      >
        {children}
      </div>
      {caption ? (
        <figcaption className="py-2.5 text-center font-serif text-[17px] italic leading-snug text-ink">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
