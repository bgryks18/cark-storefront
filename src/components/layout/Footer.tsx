import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Mail, MapPin, Phone } from 'lucide-react';

import { Container } from '@/components/ui/Container';

export function Footer() {
  const t = useTranslations('nav');
  const ft = useTranslations('footer');
  const ct = useTranslations('contactPage');
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
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-muted">{ft('tagline')}</p>
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
                { href: '/contact', label: t('contact') },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-text-muted transition-colors hover:text-primary"
                  >
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
                { href: '/account', label: t('account') },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-text-muted transition-colors hover:text-primary"
                  >
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
                <a
                  href="tel:+905375407666"
                  className="flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-primary"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  +90 537 540 76 66
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@carkzimpara.com"
                  className="flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-primary"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  info@carkzimpara.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="whitespace-pre-line">{ct('addressValue')}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Alt çizgi */}
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-start sm:justify-between items-center">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-text-muted">
              © {year} {ft('brandName')}. {ft('rights')}
            </p>
            <Link
              href="/privacy-policy"
              className="w-fit text-xs text-text-muted transition-colors hover:text-primary"
            >
              {ft('privacyPolicy')}
            </Link>
          </div>
          <div className="flex flex-col items-end gap-2 self-end sm:self-auto">
            <a
              href="https://bugrayuksel018.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-muted transition-colors hover:text-primary"
            >
              {ft('softwareCredit')}
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
