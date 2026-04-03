import { cache } from 'react';

import { shopifyFetch } from '../client';
import { IMAGE_FRAGMENT, MONEY_FRAGMENT, PRODUCT_CARD_FRAGMENT, SEO_FRAGMENT } from '../fragments';
import type { Connection, ShopifyCollection, SortKey } from '../types';

export type CollectionMeta = Pick<ShopifyCollection, 'id' | 'handle' | 'title' | 'description' | 'seo' | 'image' | 'updatedAt'>;

// ─── Queries ──────────────────────────────────────────────────────────────────

const COLLECTION_QUERY = `#graphql
  query Collection(
    $handle: String!
    $first: Int!
    $after: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $filters: [ProductFilter!]
  ) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      seo { ...SeoFields }
      image { ...ImageFields }
      updatedAt
      products(
        first: $first
        after: $after
        sortKey: $sortKey
        reverse: $reverse
        filters: $filters
      ) {
        edges {
          cursor
          node { ...ProductCardFields }
        }
        pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
      }
    }
  }
  ${SEO_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${PRODUCT_CARD_FRAGMENT}
`;

const COLLECTIONS_QUERY = `#graphql
  query Collections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          handle
          title
          description
          seo { ...SeoFields }
          image { ...ImageFields }
          updatedAt
          products(first: 1) {
            edges { node { id } }
          }
        }
      }
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    }
  }
  ${SEO_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;

const COLLECTION_FILTERS_QUERY = `#graphql
  query CollectionFilters($handle: String!, $filters: [ProductFilter!]) {
    collection(handle: $handle) {
      products(first: 250, filters: $filters) {
        filters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
      }
    }
  }
`;

// ─── Tip tanımları ────────────────────────────────────────────────────────────

export interface FilterValue {
  id: string;
  label: string;
  count: number;
  input: string;
}

export interface ProductFilter {
  id: string;
  label: string;
  type: string;
  values: FilterValue[];
}

export interface GetCollectionProductsParams {
  handle: string;
  first?: number;
  after?: string;
  sortKey?: SortKey;
  reverse?: boolean;
  filters?: Record<string, unknown>[];
  locale?: string;
}

const COLLECTION_META_QUERY = `#graphql
  query CollectionMeta($handle: String!) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo { ...SeoFields }
      image { ...ImageFields }
      updatedAt
    }
  }
  ${SEO_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;

// ─── Fonksiyonlar ─────────────────────────────────────────────────────────────

export const getCollectionMeta = cache(async function getCollectionMeta(
  handle: string,
  locale?: string,
): Promise<CollectionMeta | null> {
  const data = await shopifyFetch<{ collection: CollectionMeta | null }>(
    COLLECTION_META_QUERY,
    { handle },
    { locale, next: { revalidate: 3600, tags: [`collection-${handle}`, 'collections'] } },
  );

  return data.collection;
});

export async function getCollection(
  params: GetCollectionProductsParams,
): Promise<ShopifyCollection | null> {
  const { handle, first = 24, after, sortKey = 'MANUAL', reverse = false, filters, locale } = params;

  const data = await shopifyFetch<{ collection: ShopifyCollection | null }>(
    COLLECTION_QUERY,
    { handle, first, after, sortKey, reverse, filters },
    { locale, next: { revalidate: 3600, tags: [`collection-${handle}`, 'collections'] } },
  );

  return data.collection;
}

export async function getCollections(
  first = 20,
  after?: string,
): Promise<Connection<ShopifyCollection>> {
  const data = await shopifyFetch<{ collections: Connection<ShopifyCollection> }>(
    COLLECTIONS_QUERY,
    { first, after },
    { next: { revalidate: 3600, tags: ['collections'] } },
  );

  return data.collections;
}

export async function getCollectionFilters(handle: string, filters?: Record<string, unknown>[]): Promise<ProductFilter[]> {
  const data = await shopifyFetch<{
    collection: { products: { filters: ProductFilter[] } } | null;
  }>(COLLECTION_FILTERS_QUERY, { handle, filters }, { next: { revalidate: 3600, tags: [`collection-${handle}`] } });

  return data.collection?.products.filters ?? [];
}

/** Filtre şeması Shopify’dan; `count` değerleri grid ile uyumlu **varyant** sayısıdır (`activeFilterStrings` ile facet daraltması). */
export async function getCollectionFiltersWithVariantCounts(
  handle: string,
  filters?: Record<string, unknown>[],
  locale?: string,
  activeFilterStrings: string[] = [],
): Promise<ProductFilter[]> {
  const base = await getCollectionFilters(handle, filters);
  const { enrichCollectionFiltersWithVariantCounts } = await import('../collectionVariantFilterCounts');
  return enrichCollectionFiltersWithVariantCounts(base, handle, filters, locale, activeFilterStrings);
}
