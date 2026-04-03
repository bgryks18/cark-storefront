import { Suspense } from 'react';

import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { Link } from '@/i18n/navigation';

import { filterVariantCardsByActiveFilters } from '@/lib/shopify/filterVariantMatch';
import {
  expandProductsToVariantCards,
  flattenConnection,
  sortVariantCardsByCollectionSort,
} from '@/lib/shopify/normalize';
import {
  getCollection,
  getCollectionFiltersWithVariantCounts,
  getCollectionMeta,
} from '@/lib/shopify/queries/collection';
import type { SortKey } from '@/lib/shopify/types';

import { CollectionProductsClient } from '@/components/ui/CollectionProductsClient';
import { Container } from '@/components/ui/Container';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { ProductCardSkeleton } from '@/components/ui/ProductCard';
import { SortSelect } from '@/components/ui/SortSelect';

interface CollectionPageProps {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<{ sort?: string; filter?: string | string[] }>;
}

const SORT_MAP: Record<string, { sortKey: SortKey; reverse: boolean }> = {
  manual: { sortKey: 'MANUAL', reverse: false },
  titleAsc: { sortKey: 'TITLE', reverse: false },
  titleDesc: { sortKey: 'TITLE', reverse: true },
  priceAsc: { sortKey: 'PRICE', reverse: false },
  priceDesc: { sortKey: 'PRICE', reverse: true },
  createdDesc: { sortKey: 'CREATED', reverse: true },
};

export async function generateMetadata({ params }: CollectionPageProps) {
  const { locale, handle } = await params;
  const collection = await getCollectionMeta(handle, locale);
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
        images: [
          {
            url: image.url,
            width: image.width ?? 1200,
            height: image.height ?? 630,
            alt: image.altText ?? title,
          },
        ],
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

async function ProductGrid({
  handle,
  sort,
  locale,
  activeFilters,
}: {
  handle: string;
  sort: string;
  locale: string;
  activeFilters: string[];
}) {
  const { sortKey, reverse } = SORT_MAP[sort] ?? SORT_MAP.manual;
  const filters = activeFilters.flatMap((f) => {
    try {
      return [JSON.parse(f) as Record<string, unknown>];
    } catch {
      return [];
    }
  });
  const collection = await getCollection({
    handle,
    first: 30,
    sortKey,
    reverse,
    locale,
    filters: filters.length ? filters : undefined,
  });

  if (!collection) notFound();

  const products = flattenConnection(collection.products);
  const variantItems = sortVariantCardsByCollectionSort(
    filterVariantCardsByActiveFilters(expandProductsToVariantCards(products), activeFilters),
    sort,
  );

  const tGrid = await getTranslations({ locale, namespace: 'collection' });

  return (
    <CollectionProductsClient
      initialItems={variantItems}
      initialPageInfo={collection.products.pageInfo}
      handle={handle}
      sort={sort}
      locale={locale}
      activeFilters={activeFilters}
      noProductsText={tGrid('noProducts')}
    />
  );
}

function ProductGridSkeleton() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <li key={i}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const { locale, handle } = await params;
  const { sort = 'manual', filter } = await searchParams;
  const activeFilters = Array.isArray(filter) ? filter : filter ? [filter] : [];
  const parsedFilters = activeFilters.flatMap((f) => {
    try {
      return [JSON.parse(f) as Record<string, unknown>];
    } catch {
      return [];
    }
  });

  const [collection, filters, t] = await Promise.all([
    getCollection({ handle, first: 1, locale }),
    getCollectionFiltersWithVariantCounts(
      handle,
      parsedFilters.length ? parsedFilters : undefined,
      locale,
      activeFilters,
    ),
    getTranslations({ locale, namespace: 'collection' }),
  ]);

  if (!collection) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.carkzimpara.com';
  const localePfx = locale === 'en' ? '/en' : '';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('breadcrumbHome'),
        item: `${siteUrl}${localePfx}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('allCollections'),
        item: `${siteUrl}${localePfx}/collections`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: collection.title,
        item: `${siteUrl}${localePfx}/collections/${handle}`,
      },
    ],
  };

  const sortOptions = [
    { value: 'manual', label: t('sortOptions.manual') },
    { value: 'titleAsc', label: t('sortOptions.titleAsc') },
    { value: 'titleDesc', label: t('sortOptions.titleDesc') },
    { value: 'priceAsc', label: t('sortOptions.priceAsc') },
    { value: 'priceDesc', label: t('sortOptions.priceDesc') },
    { value: 'createdDesc', label: t('sortOptions.createdDesc') },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ─── Kategori başlığı ────────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface">
        <Container className="py-8 sm:py-10">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-text-muted">
            <Link href="/" className="hover:text-primary">
              {t('breadcrumbHome')}
            </Link>
            <span>/</span>
            <Link href="/collections" className="hover:text-primary">
              {t('allCollections')}
            </Link>
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
              <h1 className="text-2xl font-bold text-black-dark sm:text-3xl">{collection.title}</h1>
              {collection.description && (
                <p className="mt-1.5 max-w-2xl text-sm text-text-muted">{collection.description}</p>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Ürün ızgarası ────────────────────────────────────────────────── */}
      <section className="py-8 sm:py-10">
        <Container>
          {/* Mobile: dikey yığın; Desktop: yatay (sidebar + içerik) */}
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            {/* FilterPanel: mobilde toggle+panel, desktopda sidebar */}
            <FilterPanel filters={filters} />

            {/* Ana içerik */}
            <div className="min-w-0 flex-1">
              {/* Sıralama çubuğu */}
              <div className="mb-6 flex items-center justify-end">
                <SortSelect options={sortOptions} currentSort={sort} label={t('sort')} />
              </div>

              <Suspense fallback={<ProductGridSkeleton />}>
                <ProductGrid
                  handle={handle}
                  sort={sort}
                  locale={locale}
                  activeFilters={activeFilters}
                />
              </Suspense>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
