import { CookieBanner } from '@/components/site/cookie-banner';
import { Footer } from '@/components/site/footer';
import { Header } from '@/components/site/header';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}
