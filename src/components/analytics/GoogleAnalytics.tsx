'use client';

import { useEffect } from 'react';

import Script from 'next/script';

import { useCookieConsent } from '@/components/analytics/CookieConsentProvider';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';
const AW_MEASUREMENT_ID = process.env.NEXT_PUBLIC_AW_MEASUREMENT_ID ?? '';

export function GoogleAnalytics() {
  const { consent } = useCookieConsent();

  useEffect(() => {
    if (consent !== 'accepted') return;
    window.gtag?.('consent', 'update', {
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  }, [consent]);

  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('consent', 'default', {
            ad_storage: 'denied',
            analytics_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            functionality_storage: 'granted',
            security_storage: 'granted'
          });
          gtag('config', '${GA_MEASUREMENT_ID}');
          gtag('config', '${AW_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
