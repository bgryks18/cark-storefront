'use client';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

import { applyGtagConsentUpdate } from '@/lib/analytics/gtagConsent';
import { cn } from '@/lib/utils/cn';

import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'cark_analytics_consent';

type ConsentState = 'granted' | 'denied' | 'unknown';

export function CookieConsent() {
  const t = useTranslations('cookies');
  const [mounted, setMounted] = useState(false);
  const [consent, setConsent] = useState<ConsentState>('unknown');

  useEffect(() => {
    setMounted(true);
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === 'granted' || v === 'denied') {
        setConsent(v);
        applyGtagConsentUpdate(v === 'granted');
      }
    } catch {
      // localStorage erişilemezse banner göster
    }
  }, []);

  function accept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'granted');
    } catch {
      /* ignore */
    }
    setConsent('granted');
    applyGtagConsentUpdate(true);
  }

  function reject() {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'denied');
    } catch {
      /* ignore */
    }
    setConsent('denied');
    applyGtagConsentUpdate(false);
  }

  const showBanner = mounted && consent === 'unknown';

  return (
    <>
      <GoogleAnalytics />

      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-banner-title"
        aria-hidden={!showBanner}
        className={cn(
          'fixed inset-x-0 bottom-0 z-200 border-t border-border bg-card/95 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm transition-transform duration-300 ease-out md:p-5',
          showBanner ? 'translate-y-0' : 'pointer-events-none translate-y-full opacity-0',
        )}
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
              onClick={reject}
            >
              {t('rejectOptional')}
            </Button>
            <Button type="button" color="primary" className="w-full sm:w-auto" onClick={accept}>
              {t('acceptAnalytics')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
