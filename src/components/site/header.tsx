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

const textLink =
  'text-[11px] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:text-wine';

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
    </svg>
  );
}

export async function Header() {
  const [cart, user, settings] = await Promise.all([getCart(), getCurrentUser(), getSettings()]);
  const accountHref = user ? '/minha-conta' : '/entrar';
  const accountLabel = user ? (user.name?.split(' ')[0] ?? 'Minha conta') : 'Entrar';

  return (
    <header className="sticky top-0 z-40 bg-linen/95 backdrop-blur-sm">
      {settings.announcement ? (
        <div className="bg-wine px-4 py-2 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-paper">
          {settings.announcement}
        </div>
      ) : null}

      <div className="container-page grid h-[72px] grid-cols-[1fr_auto_1fr] items-center gap-4 sm:h-[88px]">
        {/* Esquerda: menu (celular) e busca (desktop) */}
        <div className="flex items-center">
          <details className="group lg:hidden">
            <summary
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center text-ink marker:content-none [&::-webkit-details-marker]:hidden"
              aria-label="Abrir menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </summary>
            <div className="fixed inset-x-0 top-[72px] z-50 h-[calc(100dvh-72px)] overflow-y-auto border-t border-rule bg-linen px-4 pb-10 pt-6 sm:top-[88px]">
              <form action="/catalogo" method="get" role="search" className="mb-6">
                <label htmlFor="mobile-search" className="field-label">
                  Buscar molde
                </label>
                <input id="mobile-search" type="search" name="q" placeholder="Saia, bolsa, avental…" className="field-input" />
              </form>
              <nav aria-label="Menu" className="flex flex-col divide-y divide-rule border-y border-rule">
                {navigation.map((item) => (
                  <Link key={item.href} href={item.href} className="py-4 font-serif text-[22px] text-ink hover:text-wine">
                    {item.label}
                  </Link>
                ))}
                <Link href={accountHref} className="py-4 font-serif text-[22px] text-ink hover:text-wine">
                  {user ? 'Minha conta' : 'Entrar ou criar conta'}
                </Link>
                <Link href="/faq" className="py-4 font-serif text-[22px] text-ink hover:text-wine">
                  Ajuda
                </Link>
              </nav>
            </div>
          </details>

          <form action="/catalogo" method="get" role="search" className="hidden items-center lg:flex">
            <label htmlFor="header-search" className="sr-only">
              Buscar moldes
            </label>
            <div className="flex items-center gap-2 border-b border-rule pb-1 text-ink transition-colors focus-within:border-wine">
              <SearchIcon />
              <input
                id="header-search"
                type="search"
                name="q"
                placeholder="Buscar molde"
                className="w-36 bg-transparent text-[13px] text-ink placeholder:text-muted-2 focus:outline-none"
              />
            </div>
          </form>
        </div>

        {/* Centro: marca */}
        <Logo />

        {/* Direita: conta e carrinho */}
        <div className="flex items-center justify-end gap-6">
          <Link href={accountHref} className={`hidden sm:inline ${textLink}`}>
            {accountLabel}
          </Link>
          <Link href="/carrinho" aria-label={`Carrinho com ${cart.count} itens`} className={textLink}>
            Carrinho <span className="tabular-nums">({cart.count})</span>
          </Link>
        </div>
      </div>

      <div className="container-page hidden lg:block">
        <nav aria-label="Navegação principal" className="rule-y flex items-center justify-center gap-10 py-3">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className={textLink}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="container-page lg:hidden">
        <div className="border-b border-rule" />
      </div>
    </header>
  );
}
