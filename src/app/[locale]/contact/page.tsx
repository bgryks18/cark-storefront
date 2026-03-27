import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ContactPageClient } from './ContactPageClient';

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contactPage' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.carkzimpara.com';
  const path = locale === 'tr' ? '/contact' : '/en/contact';
  const title = t('title');
  const description = t('subtitle');

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        tr: `${siteUrl}/contact`,
        en: `${siteUrl}/en/contact`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${path}`,
      images: [{ url: '/og.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og.png'],
    },
  };
}

export default function ContactPage() {
  return <ContactPageClient />;
}
