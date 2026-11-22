import Link from 'next/link';
import { brand } from '@/config/brand';
import { cn } from '@/lib/utils';

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label={`${brand.name} — página inicial`}
      className={cn('group inline-flex flex-col items-start leading-none', className)}
    >
      <span className="font-serif text-[27px] font-normal leading-none tracking-[-0.035em] text-forest transition-colors group-hover:text-forest-700">
        {brand.wordmark}
      </span>
      <svg
        width="118"
        height="7"
        viewBox="0 0 118 7"
        fill="none"
        aria-hidden="true"
        className="mt-1 overflow-visible"
      >
        <path
          d="M0 3.5H96"
          stroke="#ABB8A8"
          strokeWidth="1"
          strokeDasharray="3.2 3.2"
          strokeLinecap="round"
          className="transition-[stroke] group-hover:stroke-forest-400"
        />
        <circle cx="101" cy="3.5" r="2.1" stroke="#24483D" strokeWidth="0.9" fill="none" />
        <path d="M105 3.5L117 2.2V4.8L105 3.5Z" fill="#24483D" />
      </svg>
    </Link>
  );
}
