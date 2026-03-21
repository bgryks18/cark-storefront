'use client';

import { useEffect, useRef, useState } from 'react';

import { useLocale, useTranslations } from 'next-intl';
import { User } from 'lucide-react';

import { useSession, signOut } from 'next-auth/react';

import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useCart } from '@/hooks/useCart';
import { Container } from '@/components/ui/Container';

import { Badge } from '../ui/Badge';
import { ThemeToggle } from '../ui/ThemeToggle';
import { SearchBar } from './SearchBar';

const NAV_LINKS = [
  { key: 'collections', href: '/collections' },
] as const;

function CartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}


function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-6 w-6" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-6 w-6" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <button
      onClick={() => {
        window.dispatchEvent(new CustomEvent('navigation-start'));
        router.replace(pathname, { locale: locale === 'tr' ? 'en' : 'tr' });
      }}
      className="flex h-9 items-center gap-1 rounded px-2 text-sm font-medium transition-colors hover:bg-gray-light"
      title={locale === 'tr' ? 'Switch to English' : "Türkçe'ye geç"}
    >
      <span className={locale === 'tr' ? 'font-bold text-primary' : 'text-black opacity-40'}>TR</span>
      <span className="text-gray">/</span>
      <span className={locale === 'en' ? 'font-bold text-primary' : 'text-black opacity-40'}>EN</span>
    </button>
  );
}

export function Navbar() {
  const t = useTranslations('nav');
  const { data: session } = useSession();
  const isAuthenticated = !!session;
  const { itemCount: cartCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header className={[
      'sticky top-0 z-50 w-full bg-surface transition-shadow duration-200',
      scrolled ? 'shadow-md' : 'border-b border-border',
    ].join(' ')}>
      <Container as="nav" aria-label="Ana navigasyon">
        <div className="flex h-16 items-center justify-between gap-6">

          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1"
            onClick={() => setMobileOpen(false)}
          >
            <span className="text-xl font-bold tracking-tight text-primary">Çark</span>
            <span className="text-xl font-bold tracking-tight text-black-dark">Zımpara</span>
          </Link>

          {/* Masaüstü menü — ortada */}
          <ul className="hidden flex-1 items-center gap-1 md:flex" role="list">
            {NAV_LINKS.map(({ key, href }) => (
              <li key={key}>
                <Link
                  href={href}
                  className="inline-flex h-9 items-center rounded px-4 text-sm font-medium text-black-dark transition-colors hover:bg-primary-hover hover:text-primary"
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>

          {/* Sağ aksiyonlar */}
          <div className="flex items-center gap-1">
            {/* Arama */}
            <div className="hidden md:block">
              <SearchBar />
            </div>

            {/* Sepet */}
            <Link
              href="/cart"
              className="relative flex h-9 w-9 items-center justify-center rounded text-black-dark transition-colors hover:bg-gray-light"
              aria-label={`${t('cart')}${cartCount > 0 ? `, ${cartCount} ürün` : ''}`}
            >
              <CartIcon />
              <Badge count={cartCount} />
            </Link>

            {/* Tema toggle */}
            <ThemeToggle />

            {/* Dil switcher — masaüstü */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Giriş / Hesap — masaüstü */}
            {isAuthenticated ? (
              <>
                <Link
                  href="/account"
                  className="hidden h-9 items-center gap-1.5 rounded px-3 text-sm font-medium text-black-dark transition-colors hover:bg-primary-hover hover:text-primary md:inline-flex"
                >
                  <User className="h-4 w-4" />
                  {t('account')}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="hidden h-9 items-center rounded px-3 text-sm font-medium text-text-muted transition-colors hover:bg-gray-light hover:text-text-base md:inline-flex"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden h-9 items-center rounded px-4 text-sm font-medium text-black-dark transition-colors hover:bg-primary-hover hover:text-primary md:inline-flex"
              >
                {t('login')}
              </Link>
            )}

            {/* Hamburger — mobil */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded text-black-dark transition-colors hover:bg-gray-light md:hidden"
              onClick={() => setMobileOpen(v => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              <MenuIcon open={mobileOpen} />
            </button>
          </div>
        </div>
      </Container>

      {/* Mobil menü */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          ref={mobileMenuRef}
          className="border-t border-border bg-surface pb-4 md:hidden"
        >
          <Container>
            <ul className="flex flex-col pt-2" role="list">
              {NAV_LINKS.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="flex h-12 items-center rounded px-3 text-base font-medium text-black-dark transition-colors hover:bg-primary-hover hover:text-primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
              {isAuthenticated ? (
                <>
                  <li>
                    <Link
                      href="/account"
                      className="flex h-12 items-center gap-2 rounded px-3 text-base font-medium text-black-dark transition-colors hover:bg-primary-hover hover:text-primary"
                      onClick={() => setMobileOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      {t('account')}
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }); }}
                      className="flex h-12 w-full items-center rounded px-3 text-base font-medium text-text-muted transition-colors hover:bg-gray-light hover:text-text-base"
                    >
                      {t('logout')}
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href="/login"
                    className="flex h-12 items-center rounded px-3 text-base font-medium text-black-dark transition-colors hover:bg-primary-hover hover:text-primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t('login')}
                  </Link>
                </li>
              )}
              <li className="pt-2">
                <LanguageSwitcher />
              </li>
            </ul>
          </Container>
        </div>
      )}
    </header>
  );
}
