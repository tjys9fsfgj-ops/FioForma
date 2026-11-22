import Link from 'next/link';
import { getCart } from '@/lib/cart';
import { getCurrentUser } from '@/lib/session';
import { getSettings } from '@/lib/settings';
import { Logo } from './logo';

const navigation = [
  { href: '/catalogo', label: 'Moldes' },
  { href: '/colecoes', label: 'Coleções' },
  { href: '/guias', label: 'Guias' },
  { href: '/blog', label: 'Blog' },
  { href: '/sobre', label: 'Sobre' },
];

function CartIcon({ count }: { count: number }) {
  return (
    <span className="relative inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2.5 text-paper transition-colors hover:bg-forest-800">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5.5 8.5h13l-1.1 11a1.5 1.5 0 0 1-1.5 1.35H8.1a1.5 1.5 0 0 1-1.5-1.35l-1.1-11Z"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <path d="M9 8.5V6.6a3 3 0 0 1 6 0v1.9" stroke="currentColor" strokeWidth="1.3" />
      </svg>
      <span className="hidden text-[13px] font-semibold sm:inline">Carrinho</span>
      {count > 0 ? (
        <span className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-blush px-1 text-[11px] font-bold text-forest">
          {count}
        </span>
      ) : null}
    </span>
  );
}

export async function Header() {
  const [cart, user, settings] = await Promise.all([getCart(), getCurrentUser(), getSettings()]);

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md">
      {settings.announcement ? (
        <div className="bg-forest px-5 py-2.5 text-center text-[12px] font-medium tracking-[0.02em] text-paper">
          {settings.announcement}
        </div>
      ) : null}

      <div className="container-page flex h-[76px] items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-[14px] font-medium text-ink/80 transition-colors hover:bg-forest/[0.07] hover:text-forest"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <form action="/catalogo" method="get" role="search" className="hidden items-center md:flex">
            <label htmlFor="header-search" className="sr-only">
              Buscar moldes
            </label>
            <div className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 transition-colors focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/15">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                id="header-search"
                type="search"
                name="q"
                placeholder="Buscar molde"
                className="w-28 bg-transparent text-[13px] text-ink placeholder:text-muted/70 focus:outline-none lg:w-40"
              />
            </div>
          </form>

          <Link
            href={user ? '/minha-conta' : '/entrar'}
            className="hidden rounded-full border border-forest/25 px-4 py-2.5 text-[13px] font-semibold text-forest transition-colors hover:border-forest hover:bg-white sm:inline"
          >
            {user ? (user.name?.split(' ')[0] ?? 'Minha conta') : 'Entrar'}
          </Link>

          <Link href="/carrinho" aria-label={`Carrinho com ${cart.count} itens`}>
            <CartIcon count={cart.count} />
          </Link>

          <details className="group relative lg:hidden">
            <summary
              className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-line bg-white text-ink marker:content-none [&::-webkit-details-marker]:hidden"
              aria-label="Abrir menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </summary>
            <div className="absolute right-0 top-14 z-50 w-[min(86vw,340px)] rounded-3xl border border-line bg-paper p-5 shadow-float">
              <form action="/catalogo" method="get" role="search" className="mb-4">
                <label htmlFor="mobile-search" className="field-label">
                  Buscar
                </label>
                <input
                  id="mobile-search"
                  type="search"
                  name="q"
                  placeholder="Vestido, camisa, saia…"
                  className="field-input"
                />
              </form>
              <nav aria-label="Menu" className="flex flex-col divide-y divide-line/70 [&_a]:px-1">
                {navigation.map((item) => (
                  <Link key={item.href} href={item.href} className="py-3.5 text-[15px] font-medium hover:text-forest">
                    {item.label}
                  </Link>
                ))}
                <Link href={user ? '/minha-conta' : '/entrar'} className="py-3.5 text-[15px] font-medium hover:text-forest">
                  {user ? 'Minha conta' : 'Entrar ou criar conta'}
                </Link>
                <Link href="/faq" className="py-3.5 text-[15px] font-medium hover:text-forest">
                  Ajuda e FAQ
                </Link>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
