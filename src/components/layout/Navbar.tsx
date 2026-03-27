'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getSession, useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { ChevronDown, PackagePlus, User } from 'lucide-react';

import { useCart } from '@/hooks/useCart';

import { Container } from '@/components/ui/Container';

import { AccountSignOut } from '../account/AccountSignOut';
import { Badge } from '../ui/Badge';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LogoMark } from './LogoMark';
import { SearchBar } from './SearchBar';

const NAV_LINKS = [
  { key: 'collections', href: '/collections' },
  { key: 'contact', href: '/contact' },
] as const;

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

const LOCALES = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
] as const;

function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function switchTo(target: 'tr' | 'en') {
    setOpen(false);
    if (target === locale) return;
    window.dispatchEvent(new CustomEvent('navigation-start'));
    const qs = searchParams.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { locale: target });
  }

  const current = LOCALES.find((l) => l.code === locale)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium transition-colors hover:bg-primary-hover"
      >
        <span>{current.flag}</span>
        <span className="text-text-base">{current.code.toUpperCase()}</span>
        <ChevronDown
          className={[
            'h-3.5 w-3.5 text-text-muted transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
          aria-hidden
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => switchTo(l.code)}
              className={[
                'cursor-pointer flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-primary-hover',
                l.code === locale ? 'font-semibold text-primary' : 'text-text-base',
              ].join(' ')}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
      <Container as="nav" aria-label={t('home')}>
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 sm:gap-2.5 text-text-base"
            onClick={() => setMobileOpen(false)}
          >
            <LogoMark className="h-8 w-auto shrink-0 sm:h-9" />
            <span className="text-lg font-bold tracking-tight sm:text-xl">{t('storeName')}</span>
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
              className="relative flex h-9 w-9 items-center justify-center rounded text-black-dark transition-colors hover:bg-primary-hover"
              aria-label={
                cartCount > 0 ? tCommon('cartWithCount', { count: cartCount }) : t('cart')
              }
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

            {/* Dil switcher */}
            <LanguageSwitcher />

            {/* Giriş / Hesap */}
            {isSessionLoading ? (
              <span
                className="h-9 w-9 self-center rounded-md bg-gray-light/80 animate-pulse inline-block md:w-24"
                aria-hidden="true"
              />
            ) : isAuthenticated ? (
              <Link
                href="/account"
                className="flex h-9 items-center gap-2 rounded px-2 text-sm font-medium text-black-dark transition-colors hover:bg-primary-hover hover:text-primary md:px-3"
              >
                <AccountNavAvatarRing avatarUrl={navAvatarUrl} />
                <span className="hidden md:inline">{t('account')}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex h-9 w-9 items-center justify-center rounded text-black-dark transition-colors hover:bg-primary-hover hover:text-primary md:w-auto md:px-4"
                aria-label={t('login')}
              >
                <User className="h-5 w-5 md:hidden" strokeWidth={1.75} aria-hidden />
                <span className="hidden md:inline text-sm font-medium">{t('login')}</span>
              </Link>
            )}
            {/* Hamburger — mobil */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded text-black-dark transition-colors hover:bg-primary-hover md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? tCommon('closeMenu') : tCommon('openMenu')}
            >
              <MenuIcon open={mobileOpen} />
            </button>
          </div>
        </div>
      </Container>

      {/* Mobil menü */}
      <div
        id="mobile-menu"
        className={[
          'grid transition-[grid-template-rows] duration-300 ease-in-out md:hidden',
          mobileOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        ].join(' ')}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border bg-surface pb-4">
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
                {isAuthenticated && (
                  <li className="border-t border-border pt-1 mt-1">
                    <AccountSignOut label={t('logout')} />
                  </li>
                )}
              </ul>
            </Container>
          </div>
        </div>
      </div>
    </header>
  );
}
