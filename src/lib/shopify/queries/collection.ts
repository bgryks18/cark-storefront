import { shopifyFetch } from '../client';
import { IMAGE_FRAGMENT, MONEY_FRAGMENT, PRODUCT_CARD_FRAGMENT, SEO_FRAGMENT } from '../fragments';
import type { Connection, ShopifyCollection, SortKey } from '../types';

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
  query CollectionFilters($handle: String!) {
    collection(handle: $handle) {
      products(first: 1) {
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

// ─── Fonksiyonlar ─────────────────────────────────────────────────────────────

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

export async function getCollectionFilters(handle: string): Promise<ProductFilter[]> {
  const data = await shopifyFetch<{
    collection: { products: { filters: ProductFilter[] } } | null;
  }>(COLLECTION_FILTERS_QUERY, { handle }, { next: { revalidate: 3600, tags: [`collection-${handle}`] } });

  return data.collection?.products.filters ?? [];
}
