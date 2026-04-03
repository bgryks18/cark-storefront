import type { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Ubuntu } from 'next/font/google';
import { notFound } from 'next/navigation';

import { routing } from '@/i18n/routing';

import { authOptions } from '@/lib/auth';

import { CookieConsent } from '@/components/analytics/CookieConsent';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { NavigationSpinner } from '@/components/layout/NavigationSpinner';
import { PageTransition } from '@/components/layout/PageTransition';
import { Providers } from '@/components/layout/Providers';

import '../globals.css';

const ubuntu = Ubuntu({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-ubuntu',
  display: 'swap',
});

/** Oturum çerezine göre Navbar vb. her istekte güncel session alınsın (çıkış sonrası “Hesabım” kalmasın). */
export const dynamic = 'force-dynamic';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home.hero' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.carkzimpara.com';

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t('title'),
      template: `%s | ${t('title')}`,
    },
    description: t('subtitle'),
    openGraph: {
      type: 'website',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
      siteName: t('title'),
      title: t('title'),
      description: t('subtitle'),
      images: [{ url: '/og.png', width: 1200, height: 630, alt: t('title') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('subtitle'),
      images: ['/og.png'],
    },
    verification: {
      google: '_6wcclMiSAtX7sJB2yw9W0dKwn3kVULAtXvG0slaU6M',
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'tr' | 'en')) {
    notFound();
  }

  const messages = await getMessages();
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const session = await getServerSession(authOptions);

  return (
    <html lang={locale} suppressHydrationWarning className={ubuntu.variable}>
      <head />
      <body className="flex min-h-screen flex-col bg-background">
        <a href="#main-content" className="skip-link">
          {tCommon('skipToContent')}
        </a>
        <NextIntlClientProvider messages={messages}>
          <CookieConsent />
          <Providers session={session}>
            <Navbar />
            <NavigationSpinner />
            <main id="main-content" className="flex-1">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
