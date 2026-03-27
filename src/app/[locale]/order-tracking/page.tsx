import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { OrderTrackingClient } from './OrderTrackingClient';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'orderTracking' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.carkzimpara.com';
  const path = '/order-tracking';

  return {
    title: t('title'),
    alternates: {
      canonical: `${siteUrl}${locale === 'en' ? '/en' : ''}${path}`,
      languages: {
        tr: `${siteUrl}${path}`,
        en: `${siteUrl}/en${path}`,
      },
    },
  };
}

export default function OrderTrackingPage() {
  return (
    <Suspense>
      <OrderTrackingClient />
    </Suspense>
  );
}
