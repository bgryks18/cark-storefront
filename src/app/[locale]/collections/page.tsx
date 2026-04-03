import { Suspense } from 'react';

import { getTranslations } from 'next-intl/server';

import { flattenConnection } from '@/lib/shopify/normalize';
import { getCollections } from '@/lib/shopify/queries/collection';
import { PRODUCT_CARD_GRID_CLASS } from '@/lib/ui/productCardGrid';

import { CollectionCard, CollectionCardSkeleton } from '@/components/ui/CollectionCard';
import { Container } from '@/components/ui/Container';
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb';

interface CollectionsPageProps {
  params: Promise<{ locale: string }>;
}

async function CollectionGrid() {
  const t = await getTranslations('collection');
  const connection = await getCollections(50);
  const collections = flattenConnection(connection);

  if (collections.length === 0) {
    return <p className="py-16 text-center text-text-muted">{t('noCollections')}</p>;
  }

  return (
    <ul className={PRODUCT_CARD_GRID_CLASS}>
      {collections.map((collection) => (
        <li key={collection.id}>
          <CollectionCard collection={collection} headingLevel="h2" />
        </li>
      ))}
    </ul>
  );
}

function CollectionGridSkeleton() {
  return (
    <ul className={PRODUCT_CARD_GRID_CLASS}>
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i}>
          <CollectionCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

export async function generateMetadata({ params }: CollectionsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'collection' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.carkzimpara.com';
  const path = locale === 'tr' ? '/collections' : '/en/collections';
  const title = t('allCollections');
  const description = t('pageDescription');

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        tr: `${siteUrl}/collections`,
        en: `${siteUrl}/en/collections`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${path}`,
      images: [{ url: '/og.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: ['/og.png'],
    },
  };
}

export default async function CollectionsPage({ params }: CollectionsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'collection' });

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <PageBreadcrumb crumbs={[]} title={t('allCollections')} />
        <Suspense fallback={<CollectionGridSkeleton />}>
          <CollectionGrid />
        </Suspense>
      </Container>
    </section>
  );
}
