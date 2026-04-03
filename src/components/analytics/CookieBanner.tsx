'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

import { useCookieConsent } from '@/components/analytics/CookieConsentProvider';
import { Button } from '@/components/ui/Button';

export function CookieBanner() {
  const t = useTranslations('cookies');
  const { consent, setConsent } = useCookieConsent();

  if (consent !== null) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      className="fixed inset-x-0 bottom-0 z-200 border-t border-border bg-card/95 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm md:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-2">
          <p id="cookie-banner-title" className="text-sm font-semibold text-text-base">
            {t('bannerTitle')}
          </p>
          <p className="text-sm leading-relaxed text-text-muted">{t('bannerText')}</p>
          <Link
            href="/privacy-policy"
            className="inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            {t('privacyLink')}
          </Link>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            className="w-full sm:w-auto"
            onClick={() => setConsent('rejected')}
          >
            {t('rejectOptional')}
          </Button>
          <Button
            type="button"
            color="primary"
            className="w-full sm:w-auto"
            onClick={() => setConsent('accepted')}
          >
            {t('acceptAnalytics')}
          </Button>
        </div>
      </div>
    </div>
  );
}
