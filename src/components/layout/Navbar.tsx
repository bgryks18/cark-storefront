'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getSession, useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { PackagePlus, User } from 'lucide-react';

import { useCart } from '@/hooks/useCart';

import { Container } from '@/components/ui/Container';

import { Badge } from '../ui/Badge';
import { ThemeToggle } from '../ui/ThemeToggle';
import { SearchBar } from './SearchBar';

const NAV_LINKS = [{ key: 'collections', href: '/collections' }] as const;

const ACCOUNT_AVATAR_CHANGED = 'account-avatar-changed';

/** Hesabım linki yanında: foto varsa görsel, yoksa User ikonu */
function AccountNavAvatarRing({ avatarUrl }: { avatarUrl: string | null | undefined }) {
  const showPhoto = Boolean(avatarUrl);
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary-hover text-primary">
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element -- /api + Admin URL
        <img
          src={avatarUrl!}
          alt=""
          width={28}
          height={28}
          className="h-full w-full object-cover"
        />
      ) : (
        <User className="h-4 w-4" strokeWidth={2} aria-hidden />
      )}
    </span>
  );
}

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  return (
    <button
      onClick={() => {
        window.dispatchEvent(new CustomEvent('navigation-start'));
        const qs = searchParams.toString();
        router.replace(`${pathname}${qs ? `?${qs}` : ''}`, {
          locale: locale === 'tr' ? 'en' : 'tr',
        });
      }}
      className="flex h-9 items-center gap-1 rounded px-2 text-sm font-medium transition-colors hover:bg-gray-light"
      title={locale === 'tr' ? 'Switch to English' : "Türkçe'ye geç"}
    >
      <span className={locale === 'tr' ? 'font-bold text-primary' : 'text-black opacity-40'}>
        TR
      </span>
      <span className="text-gray">/</span>
      <span className={locale === 'en' ? 'font-bold text-primary' : 'text-black opacity-40'}>
        EN
      </span>
    </button>
  );
}

export function Navbar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.shopifyAccessToken;
  const isSessionLoading = status === 'loading';
  const [navAvatarUrl, setNavAvatarUrl] = useState<string | null | undefined>(undefined);

  const fetchNavAvatar = useCallback(() => {
    if (!isAuthenticated || !session?.user?.email) {
      setNavAvatarUrl(undefined);
      return;
    }
    void fetch('/api/account/avatar', { cache: 'no-store' })
      .then((r) => r.json() as Promise<{ avatarUrl: string | null }>)
      .then((j) => setNavAvatarUrl(j.avatarUrl ?? null))
      .catch(() => setNavAvatarUrl(null));
  }, [isAuthenticated, session?.user?.email]);

  useEffect(() => {
    void getSession();
  }, [pathname]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNavAvatarUrl(undefined);
      return;
    }
    fetchNavAvatar();
  }, [isAuthenticated, session?.user?.email, pathname, fetchNavAvatar]);

  useEffect(() => {
    const onAvatarChanged = () => fetchNavAvatar();
    window.addEventListener(ACCOUNT_AVATAR_CHANGED, onAvatarChanged);
    return () => window.removeEventListener(ACCOUNT_AVATAR_CHANGED, onAvatarChanged);
  }, [fetchNavAvatar]);
  const { itemCount: cartCount, cart, isAnyItemLoading, isAdding } = useCart();
  const isCartLoading = isAdding || isAnyItemLoading;
  const totalQty = cart?.totalQuantity ?? 0;
  const prevTotalQtyRef = useRef(totalQty);
  const pendingPlusRef = useRef(false);
  const [showCartPlus, setShowCartPlus] = useState(false);
  const cartPlusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (totalQty > prevTotalQtyRef.current) {
      pendingPlusRef.current = true;
    }
    prevTotalQtyRef.current = totalQty;
  }, [totalQty]);

  useEffect(() => {
    if (!isCartLoading && pendingPlusRef.current) {
      pendingPlusRef.current = false;
      if (cartPlusTimer.current) clearTimeout(cartPlusTimer.current);
      setShowCartPlus(true);
      cartPlusTimer.current = setTimeout(() => setShowCartPlus(false), 900);
    }
  }, [isCartLoading]);

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
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header
      className={[
        'sticky top-0 z-50 w-full bg-surface transition-shadow duration-200',
        scrolled ? 'shadow-md' : 'border-b border-border',
      ].join(' ')}
    >
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
              {showCartPlus && (
                <span className="animate-cart-plus pointer-events-none absolute bottom-4 -left-2">
                  <PackagePlus className="h-4 w-4 text-success" strokeWidth={2} />
                </span>
              )}
            </Link>

            {/* Tema toggle */}
            <ThemeToggle />

            {/* Dil switcher — masaüstü */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Giriş / Hesap — masaüstü (session client’ta yüklendiği için kısa süre loading) */}
            {isSessionLoading ? (
              <span
                className="hidden h-9 min-w-22 self-center rounded-md bg-gray-light/80 animate-pulse md:inline-block"
                aria-hidden="true"
              />
            ) : isAuthenticated ? (
              <Link
                href="/account"
                className="hidden h-9 items-center gap-2 rounded px-3 text-sm font-medium text-black-dark transition-colors hover:bg-primary-hover hover:text-primary md:inline-flex"
              >
                <AccountNavAvatarRing avatarUrl={navAvatarUrl} />
                {t('account')}
              </Link>
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
              onClick={() => setMobileOpen((v) => !v)}
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
              {isSessionLoading ? (
                <li className="px-3 py-2" aria-hidden="true">
                  <div className="h-10 w-32 animate-pulse rounded-md bg-gray-light/80" />
                </li>
              ) : isAuthenticated ? (
                <li>
                  <Link
                    href="/account"
                    className="flex h-12 items-center gap-3 rounded px-3 text-base font-medium text-black-dark transition-colors hover:bg-primary-hover hover:text-primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    <AccountNavAvatarRing avatarUrl={navAvatarUrl} />
                    {t('account')}
                  </Link>
                </li>
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
