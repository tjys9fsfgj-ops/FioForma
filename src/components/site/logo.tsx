import Link from 'next/link';
import { brand } from '@/config/brand';
import { cn } from '@/lib/utils';

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label={`${brand.name} — página inicial`}
      className={cn(
        'inline-block font-serif text-[26px] font-semibold uppercase leading-none tracking-[0.14em] text-ink transition-colors hover:text-wine sm:text-[32px]',
        className,
      )}
    >
      {brand.name}
    </Link>
  );
}
