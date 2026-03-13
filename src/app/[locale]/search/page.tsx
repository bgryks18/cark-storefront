import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/ui/Container';
import { ProductCard, ProductCardSkeleton } from '@/components/ui/ProductCard';
import { SearchInput } from '@/components/ui/SearchInput';
import { searchProducts } from '@/lib/shopify/queries/search';

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

async function SearchResults({ query, locale }: { query: string; locale: string }) {
  const language = locale === 'tr' ? 'TR' : 'EN';
  const country = locale === 'tr' ? 'TR' : 'US';

  const { totalCount, products } = await searchProducts({
    query,
    first: 48,
    language,
    country,
  });

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-text-muted">
        &ldquo;{query}&rdquo; için sonuç bulunamadı.
      </p>
    );
  }

  return (
    <>
      <p className="mb-6 text-sm text-text-muted">
        <span className="font-medium text-text-base">{totalCount}</span> sonuç bulundu
      </p>
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export async function generateMetadata({ params }: SearchPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'search' });
  return { title: t('title') };
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const { q = '' } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'search' });

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <h1 className="mb-6 text-2xl font-bold text-black-dark sm:text-3xl">
          {t('title')}
        </h1>

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
