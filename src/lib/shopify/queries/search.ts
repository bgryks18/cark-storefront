import { IMAGE_FRAGMENT, MONEY_FRAGMENT } from '../fragments';
import { shopifyFetch } from '../client';

import type { PredictiveSearchResult, ShopifyProduct } from '../types';

// ─── Queries ──────────────────────────────────────────────────────────────────

const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch($query: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    predictiveSearch(
      query: $query
      types: [PRODUCT, COLLECTION, QUERY]
      limit: 5
      limitScope: EACH
    ) {
      products {
        id
        handle
        title
        availableForSale
        featuredImage { ...ImageFields }
        priceRange {
          minVariantPrice { ...MoneyFields }
        }
        variants(first: 1) {
          edges {
            node {
              id
              price { ...MoneyFields }
              compareAtPrice { ...MoneyFields }
            }
          }
        }
      }
      collections {
        id
        handle
        title
        image { ...ImageFields }
      }
      queries {
        text
        styledText
      }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

const SEARCH_QUERY = `#graphql
  query Search(
    $query: String!
    $first: Int!
    $after: String
    $sortKey: SearchSortKeys
    $reverse: Boolean
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    search(
      query: $query
      first: $first
      after: $after
      sortKey: $sortKey
      reverse: $reverse
      types: [PRODUCT]
    ) {
      totalCount
      edges {
        cursor
        node {
          ... on Product {
            id
            handle
            title
            availableForSale
            tags
            vendor
            priceRange {
              minVariantPrice { ...MoneyFields }
              maxVariantPrice { ...MoneyFields }
            }
            compareAtPriceRange {
              minVariantPrice { ...MoneyFields }
            }
            featuredImage { ...ImageFields }
            variants(first: 1) {
              edges {
                node {
                  id
                  availableForSale
                  price { ...MoneyFields }
                  compareAtPrice { ...MoneyFields }
                }
              }
            }
          }
        }
      }
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

// ─── Tip tanımları ────────────────────────────────────────────────────────────

type CountryCode = string;
type LanguageCode = string;

export interface SearchParams {
  query: string;
  first?: number;
  after?: string;
  sortKey?: 'RELEVANCE' | 'PRICE';
  reverse?: boolean;
  country?: CountryCode;
  language?: LanguageCode;
}

export interface SearchResults {
  totalCount: number;
  products: ShopifyProduct[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

// ─── Fonksiyonlar ─────────────────────────────────────────────────────────────

export async function getPredictiveSearch(
  query: string,
  locale?: string,
): Promise<PredictiveSearchResult> {
  const language = locale === 'tr' ? 'TR' : 'EN';
  const country = locale === 'tr' ? 'TR' : 'US';

  const data = await shopifyFetch<{ predictiveSearch: PredictiveSearchResult }>(
    PREDICTIVE_SEARCH_QUERY,
    { query, country, language },
    { cache: 'no-store' },
  );

  return data.predictiveSearch;
}

export async function searchProducts(params: SearchParams): Promise<SearchResults> {
  const {
    query,
    first = 24,
    after,
    sortKey = 'RELEVANCE',
    reverse = false,
    country,
    language,
  } = params;

  const data = await shopifyFetch<{
    search: {
      totalCount: number;
      edges: { cursor: string; node: unknown }[];
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor: string | null;
        endCursor: string | null;
      };
    };
  }>(SEARCH_QUERY, { query, first, after, sortKey, reverse, country, language }, { cache: 'no-store' });

  return {
    totalCount: data.search.totalCount,
    products: data.search.edges.map((e) => e.node as ShopifyProduct),
    pageInfo: data.search.pageInfo,
  };
}
