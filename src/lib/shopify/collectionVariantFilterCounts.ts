import { shopifyFetch } from './client';
import {
  canComputeVariantFilterCount,
  countVariantCardsForFilterValue,
  filterVariantCardsByActiveFilters,
} from './filterVariantMatch';
import { expandProductsToVariantCards } from './normalize';
import type { CollectionVariantCard, Connection, ProductVariant, ShopifyProduct } from './types';

const COLLECTION_FILTER_COUNT_PRODUCTS_QUERY = `#graphql
  query CollectionFilterCountProducts(
    $handle: String!
    $filters: [ProductFilter!]
    $first: Int!
    $after: String
  ) {
    collection(handle: $handle) {
      products(first: $first, after: $after, filters: $filters) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            materialTypeMetafield: metafield(namespace: "custom", key: "material_type") {
              value
            }
            variants(first: 250) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                cursor
                node {
                  id
                  title
                  availableForSale
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

type CountingProductNode = {
  id: string;
  materialTypeMetafield?: { value: string } | null;
  variants: Connection<ProductVariant>;
};

type CollectionFilterCountData = {
  collection: {
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: Array<{ node: CountingProductNode }>;
    };
  } | null;
};

const MAX_PAGES = 25;
const PAGE_SIZE = 100;

async function fetchAllProductsForVariantFilterCounts(
  handle: string,
  activeFilters: Record<string, unknown>[] | undefined,
  locale?: string,
): Promise<ShopifyProduct[]> {
  const out: CountingProductNode[] = [];
  let after: string | null = null;

  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const data: CollectionFilterCountData = await shopifyFetch<CollectionFilterCountData>(
        COLLECTION_FILTER_COUNT_PRODUCTS_QUERY,
        {
          handle,
          first: PAGE_SIZE,
          after: after ?? undefined,
          filters: activeFilters?.length ? activeFilters : undefined,
        },
        { locale, next: { revalidate: 3600, tags: [`collection-${handle}`] } },
      );

      const coll = data.collection;
      if (!coll?.products.edges.length) break;

      out.push(...coll.products.edges.map((e) => e.node));

      if (!coll.products.pageInfo.hasNextPage) break;
      after = coll.products.pageInfo.endCursor;
      if (!after) break;
    }
  } catch {
    return [];
  }

  return out.map((n) => n as unknown as ShopifyProduct);
}

/** `queries/collection` içindeki `ProductFilter` ile yapısal uyumlu */
function enrichFiltersWithVariantCounts(
  filters: Array<{
    id: string;
    label: string;
    type: string;
    values: Array<{ id: string; label: string; count: number; input: string }>;
  }>,
  cards: CollectionVariantCard[],
): typeof filters {
  return filters.map((group) => {
    if (group.type !== 'LIST' && group.type !== 'BOOLEAN' && group.type !== 'PRICE_RANGE') {
      return group;
    }

    return {
      ...group,
      values: group.values.map((v) => {
        if (!canComputeVariantFilterCount(v.input, group.type)) {
          return v;
        }
        const n = countVariantCardsForFilterValue(cards, v.input, group.type);
        return { ...v, count: n };
      }),
    };
  });
}

/** Shopify ürün `count` → koleksiyondaki eşleşen **varyant** sayısı (grid ile uyumlu). */
export async function enrichCollectionFiltersWithVariantCounts<
  T extends {
    id: string;
    label: string;
    type: string;
    values: Array<{ id: string; label: string; count: number; input: string }>;
  },
>(
  filters: T[],
  handle: string,
  activeFilters: Record<string, unknown>[] | undefined,
  locale: string | undefined,
  /** URL `filter` dizisi — facet sayıları, diğer seçimlere göre daraltılmış varyant kümesinden hesaplanır */
  activeFilterStrings: string[],
): Promise<T[]> {
  if (filters.length === 0) return filters;

  const products = await fetchAllProductsForVariantFilterCounts(handle, activeFilters, locale);
  if (products.length === 0) return filters;

  const cards = filterVariantCardsByActiveFilters(expandProductsToVariantCards(products), activeFilterStrings);

  return enrichFiltersWithVariantCounts(filters, cards) as T[];
}
