import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/ui/Container';
import { ProductCard, ProductCardSkeleton } from '@/components/ui/ProductCard';
import { SortSelect } from '@/components/ui/SortSelect';
import { Link } from '@/i18n/navigation';
import { getCollection } from '@/lib/shopify/queries/collection';
import { flattenConnection } from '@/lib/shopify/normalize';
import type { SortKey } from '@/lib/shopify/types';
import { Suspense } from 'react';

interface CollectionPageProps {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<{ sort?: string }>;
}

const SORT_MAP: Record<string, { sortKey: SortKey; reverse: boolean }> = {
  manual:      { sortKey: 'MANUAL',       reverse: false },
  bestSelling: { sortKey: 'BEST_SELLING', reverse: false },
  titleAsc:    { sortKey: 'TITLE',        reverse: false },
  titleDesc:   { sortKey: 'TITLE',        reverse: true  },
  priceAsc:    { sortKey: 'PRICE',        reverse: false },
  priceDesc:   { sortKey: 'PRICE',        reverse: true  },
  createdDesc: { sortKey: 'CREATED',      reverse: true  },
};

export async function generateMetadata({ params }: CollectionPageProps) {
  const { locale, handle } = await params;
  const collection = await getCollection({ handle });
  if (!collection) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.carkzimpara.com';
  const title = collection.seo?.title ?? collection.title;
  const description = collection.seo?.description ?? collection.description;
  const canonicalPath = `/collections/${handle}`;
  const image = collection.image;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${locale === 'en' ? '/en' : ''}${canonicalPath}`,
      languages: {
        tr: `${siteUrl}${canonicalPath}`,
        en: `${siteUrl}/en${canonicalPath}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${locale === 'en' ? '/en' : ''}${canonicalPath}`,
      type: 'website',
      ...(image && {
        images: [{ url: image.url, width: image.width ?? 1200, height: image.height ?? 630, alt: image.altText ?? title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image && { images: [image.url] }),
    },
  };
}

async function ProductGrid({ handle, sort, locale }: { handle: string; sort: string; locale: string }) {
  const { sortKey, reverse } = SORT_MAP[sort] ?? SORT_MAP.manual;
  const collection = await getCollection({ handle, first: 48, sortKey, reverse, locale });

  if (!collection) notFound();

  const products = flattenConnection(collection.products);

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-text-muted">
        Bu koleksiyonda ürün bulunamadı.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const { locale, handle } = await params;
  const { sort = 'manual' } = await searchParams;

  const [collection, t] = await Promise.all([
    getCollection({ handle, first: 1, locale }),
    getTranslations({ locale, namespace: 'collection' }),
  ]);

  if (!collection) notFound();

  const sortOptions = [
    { value: 'manual',      label: t('sortOptions.manual') },
    { value: 'bestSelling', label: t('sortOptions.bestSelling') },
    { value: 'titleAsc',    label: t('sortOptions.titleAsc') },
    { value: 'titleDesc',   label: t('sortOptions.titleDesc') },
    { value: 'priceAsc',    label: t('sortOptions.priceAsc') },
    { value: 'priceDesc',   label: t('sortOptions.priceDesc') },
    { value: 'createdDesc', label: t('sortOptions.createdDesc') },
  ];

  return (
    <>
      {/* ─── Koleksiyon başlığı ────────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface">
        <Container className="py-8 sm:py-10">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-text-muted">
            <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
            <span>/</span>
            <Link href="/collections" className="hover:text-primary">{t('allCollections')}</Link>
            <span>/</span>
            <span className="text-text-base">{collection.title}</span>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            {collection.image && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-24">
                <Image
                  src={collection.image.url}
                  alt={collection.image.altText ?? collection.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-black-dark sm:text-3xl">
                {collection.title}
              </h1>
              {collection.description && (
                <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
                  {collection.description}
                </p>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Ürün ızgarası ────────────────────────────────────────────────── */}
      <section className="py-8 sm:py-10">
        <Container>
          {/* Sıralama çubuğu */}
          <div className="mb-6 flex items-center justify-end">
            <SortSelect
              options={sortOptions}
              currentSort={sort}
              label={t('sort')}
            />
          </div>

          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid handle={handle} sort={sort} locale={locale} />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
