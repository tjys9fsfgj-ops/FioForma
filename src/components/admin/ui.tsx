import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AdminHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="eyebrow text-[10px]">{eyebrow}</p> : null}
        <h1 className="mt-1 font-serif text-[clamp(1.6rem,2.6vw,2.1rem)] leading-tight text-wine">{title}</h1>
        {description ? <div className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-muted">{description}</div> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </header>
  );
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('border border-line bg-paper', className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 font-serif text-[27px] leading-none text-wine">{value}</p>
      {hint ? <p className="mt-2 text-[11px] text-muted">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block border border-line bg-paper p-5 transition-colors hover:border-wine/40">
        {content}
      </Link>
    );
  }

  return <div className="border border-line bg-paper p-5">{content}</div>;
}

export function AdminTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto border border-line bg-paper">
      <table className="w-full min-w-[640px] border-collapse text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-line bg-[#FAF9F6]">
            {head.map((cell) => (
              <th key={cell} scope="col" className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: 'green' | 'amber' | 'gray' | 'red'; children: ReactNode }) {
  const tones = {
    green: 'border-wine-200 bg-wine-50 text-wine-800',
    amber: 'border-[#E3D3AE] bg-[#FBF6E8] text-[#6B5320]',
    gray: 'border-line bg-[#F7F6F2] text-muted',
    red: 'border-[#E4C4BE] bg-[#FBF1EF] text-[#8A342A]',
  } as const;
  return (
    <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', tones[tone])}>{children}</span>
  );
}

export function AdminEmpty({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="border border-line bg-paper px-6 py-12 text-center">
      <p className="font-serif text-[19px] text-wine">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center gap-2">{action}</div> : null}
    </div>
  );
}
