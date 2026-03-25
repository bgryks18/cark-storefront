import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/ui/Container';
import { CollectionCard, CollectionCardSkeleton } from '@/components/ui/CollectionCard';
import { getCollections } from '@/lib/shopify/queries/collection';
import { flattenConnection } from '@/lib/shopify/normalize';

interface CollectionsPageProps {
  params: Promise<{ locale: string }>;
}

async function CollectionGrid() {
  const t = await getTranslations('collection');
  const connection = await getCollections(50);
  const collections = flattenConnection(connection);

  if (collections.length === 0) {
    return (
      <p className="py-16 text-center text-text-muted">{t('noCollections')}</p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  );
}

function CollectionGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <CollectionCardSkeleton key={i} />
      ))}
    </div>
  );
}

export async function generateMetadata({ params }: CollectionsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'collection' });
  return { title: t('allCollections') };
}

export default async function CollectionsPage({ params }: CollectionsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'collection' });

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <h1 className="mb-8 text-2xl font-bold text-black-dark sm:text-3xl">
          {t('allCollections')}
        </h1>
        <Suspense fallback={<CollectionGridSkeleton />}>
          <CollectionGrid />
        </Suspense>
      </Container>
    </section>
  );
}
