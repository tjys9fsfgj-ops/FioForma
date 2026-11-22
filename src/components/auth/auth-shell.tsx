import type { ReactNode } from 'react';

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
        <div className="lg:pt-6">
          <p className="pill">{eyebrow}</p>
          <h1 className="mt-5 text-[clamp(2rem,4.2vw,3rem)] leading-[1.05]">{title}</h1>
          {description ? <div className="mt-4 max-w-sm text-[14px] leading-relaxed text-muted">{description}</div> : null}
          {aside ? <div className="mt-8">{aside}</div> : null}
        </div>
        <div className="rounded-[2rem] border border-line bg-white p-6 shadow-soft sm:p-9">{children}</div>
      </div>
    </div>
  );
}
