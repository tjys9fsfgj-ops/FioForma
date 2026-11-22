import type { Metadata } from 'next';
import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import { Logo } from '@/components/site/logo';
import { requireAdmin } from '@/lib/session';

export const metadata: Metadata = {
  title: { absolute: 'Painel · FioForma' },
  robots: { index: false, follow: false, nocache: true },
};

const nav = [
  { href: '/admin', label: 'Visão geral' },
  { href: '/admin/produtos', label: 'Produtos' },
  { href: '/admin/colecoes', label: 'Coleções' },
  { href: '/admin/categorias', label: 'Categorias' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/cupons', label: 'Cupons' },
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/paginas', label: 'Páginas e blog' },
  { href: '/admin/relatorios', label: 'Relatórios' },
  { href: '/admin/configuracoes', label: 'Configurações' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-[#F3F1EC]">
      <div className="mx-auto flex max-w-[1440px] flex-col lg:flex-row">
        <aside className="bg-wine text-paper lg:min-h-screen lg:w-[256px] lg:shrink-0 lg:rounded-r-[2rem]">
          <div className="px-5 py-5 lg:py-7">
            <div className="[&_span]:text-paper [&_svg_path:first-of-type]:stroke-sand/70 [&_svg_path:last-of-type]:fill-paper">
              <Logo />
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-paper/60">Painel da loja</p>
          </div>

          <nav aria-label="Administração" className="px-3 pb-5">
            <ul className="grid grid-cols-2 gap-0.5 sm:grid-cols-3 lg:block">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-xl px-3 py-2.5 text-[13px] font-medium text-paper/80 transition-colors hover:bg-paper/10 hover:text-paper"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-paper/15 px-5 py-4 text-[11px] text-paper/70">
            <p className="truncate">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="/" className="underline underline-offset-4 hover:text-paper" target="_blank">
                Ver site
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="underline underline-offset-4 hover:text-paper">
                  Sair
                </button>
              </form>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
