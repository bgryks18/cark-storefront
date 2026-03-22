import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';

export function Footer() {
  const t = useTranslations('nav');
  const ft = useTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <Container className="py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Marka */}
          <div className="col-span-full lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-1">
              <span className="text-lg font-bold text-primary">Çark</span>
              <span className="text-lg font-bold text-black-dark">Zımpara</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-muted">
              {ft('tagline')}
            </p>
          </div>

          {/* Mağaza */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
              {ft('store')}
            </h3>
            <ul className="space-y-3" role="list">
              {[
                { href: '/collections', label: t('collections') },
                { href: '/search', label: t('search') },
                { href: '/cart', label: t('cart') },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-black-dark transition-colors hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hesap */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
              {ft('account')}
            </h3>
            <ul className="space-y-3" role="list">
              {[
                { href: '/login', label: t('login') },
                { href: '/register', label: t('register') },
                { href: '/account', label: t('account') },
                { href: '/order-tracking', label: ft('orderTracking') },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-black-dark transition-colors hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
              {ft('contact')}
            </h3>
            <ul className="space-y-3" role="list">
              <li>
                <a href="mailto:info@carkzimpara.com" className="text-sm text-black-dark transition-colors hover:text-primary">
                  info@carkzimpara.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Alt çizgi */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-text-muted">
            © {year} {ft('brandName')}. {ft('rights')}
          </p>
          <p className="text-xs text-text-muted">shop.carkzimpara.com</p>
        </div>
      </Container>
    </footer>
  );
}
