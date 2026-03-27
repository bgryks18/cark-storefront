import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

import { FeaturedCollections } from '@/components/sections/FeaturedCollections';
import { FeaturedProducts } from '@/components/sections/FeaturedProducts';
import { Container } from '@/components/ui/Container';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home.hero' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.carkzimpara.com';
  const url = locale === 'en' ? `${siteUrl}/en` : siteUrl;

  return {
    alternates: {
      canonical: url,
      languages: {
        tr: siteUrl,
        en: `${siteUrl}/en`,
      },
    },
    openGraph: {
      url,
      title: t('title'),
      description: t('subtitle'),
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const nav = await getTranslations({ locale, namespace: 'nav' });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.carkzimpara.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'Store'],
    name: t('hero.title'),
    url: siteUrl,
    telephone: '+905375407666',
    email: 'info@carkzimpara.com',
    image: `${siteUrl}/og.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Osman Yılmaz Mahallesi, Barbaros Caddesi No: 23/A',
      addressLocality: 'Gebze',
      addressRegion: 'Kocaeli',
      addressCountry: 'TR',
    },
    sameAs: [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-linear-to-br from-primary to-primary-dark text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-125 w-125 rounded-full bg-white/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-32 h-90 w-90 rounded-full bg-white/5"
        />

        <Container className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary-light">
              {t('hero.eyebrow')}
            </p>
            <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {t('hero.title')}
            </h1>
            <p className="mb-10 text-lg text-white/80 sm:text-xl">{t('hero.subtitle')}</p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/collections"
                className="inline-flex h-12 items-center justify-center rounded bg-white px-8 text-base font-semibold text-primary transition-colors hover:bg-gray-light-hover"
              >
                {t('featuredCollections')}
              </Link>
              <Link
                href="/search"
                className="inline-flex h-12 items-center justify-center rounded border border-white/50 px-8 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                {nav('search')}
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Öne çıkan kategoriler ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <Container>
          <h2 className="mb-8 text-2xl font-bold text-black-dark sm:mb-10 sm:text-3xl">
            {t('featuredCollections')}
          </h2>
          <FeaturedCollections />
        </Container>
      </section>

      {/* ─── Öne Çıkan Ürünler ────────────────────────────────────────────── */}
      <section className="bg-surface py-16 sm:py-20">
        <Container>
          <h2 className="mb-8 text-2xl font-bold text-black-dark sm:mb-10 sm:text-3xl">
            {t('featuredProducts')}
          </h2>
          <FeaturedProducts />
        </Container>
      </section>
    </>
  );
}
