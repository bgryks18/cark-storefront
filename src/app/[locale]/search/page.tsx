import { Suspense } from 'react';

import { getTranslations } from 'next-intl/server';

import { searchProducts } from '@/lib/shopify/queries/search';

import { Container } from '@/components/ui/Container';
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb';
import { ProductCard, ProductCardSkeleton } from '@/components/ui/ProductCard';
import { SearchInput } from '@/components/ui/SearchInput';

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

async function SearchResults({ query, locale }: { query: string; locale: string }) {
  const language = locale === 'tr' ? 'TR' : 'EN';
  const country = locale === 'tr' ? 'TR' : 'US';
  const t = await getTranslations({ locale, namespace: 'search' });

  const { totalCount, products } = await searchProducts({
    query,
    first: 48,
    language,
    country,
  });

  if (products.length === 0) {
    return <p className="py-16 text-center text-text-muted">{t('noResults', { query })}</p>;
  }

  return (
    <>
      <p className="mb-6 text-sm text-text-muted">{t('resultCount', { count: totalCount })}</p>
      <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} headingLevel="h2" />
          </li>
        ))}
      </ul>
    </>
  );
}

function SearchResultsSkeleton() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

export async function generateMetadata({ params }: SearchPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'search' });
  return {
    title: t('title'),
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const { q = '' } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'search' });

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <PageBreadcrumb crumbs={[]} title={t('title')} />

        <div className="mb-8 max-w-xl">
          <SearchInput defaultValue={q} placeholder={t('placeholder')} />
        </div>

        {q ? (
          <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResults query={q} locale={locale} />
          </Suspense>
        ) : (
          <p className="py-10 text-center text-text-muted">{t('placeholder')}</p>
        )}
      </Container>
    </section>
  );
}
