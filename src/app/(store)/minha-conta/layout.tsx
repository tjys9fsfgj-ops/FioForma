import type { Metadata } from 'next';
import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Minha conta',
  robots: { index: false, follow: false },
};

const links = [
  { href: '/minha-conta', label: 'Visão geral' },
  { href: '/minha-conta/biblioteca', label: 'Meus moldes' },
  { href: '/minha-conta/pedidos', label: 'Pedidos' },
  { href: '/minha-conta/dados', label: 'Dados pessoais' },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[250px_1fr] lg:gap-12">
        <aside className="rounded-[2rem] border border-line bg-paper p-6 shadow-paper lg:self-start">
          <p className="pill">Minha conta</p>
          <p className="mt-2 font-serif text-[20px] leading-snug text-wine">
            {user.name ?? user.email.split('@')[0]}
          </p>
          <p className="mt-1 break-all text-[11.5px] text-muted">{user.email}</p>

          <nav aria-label="Área da conta" className="mt-6 border-t border-line pt-3">
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-xl px-3 py-2.5 text-[14px] font-medium text-ink/80 transition-colors hover:bg-sand hover:text-wine"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <form action={logoutAction} className="mt-5">
            <button type="submit" className="text-[11.5px] text-muted underline decoration-line underline-offset-4 hover:text-wine">
              Sair da conta
            </button>
          </form>
        </aside>

        <div>{children}</div>
      </div>
    </div>
  );
}
