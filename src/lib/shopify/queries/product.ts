import { PRODUCT_CARD_FRAGMENT, PRODUCT_VARIANT_FRAGMENT, SEO_FRAGMENT } from '../fragments';
import { shopifyFetch } from '../client';

import type { Connection, ShopifyProduct, SortKey } from '../types';

// ─── Queries ──────────────────────────────────────────────────────────────────

const PRODUCT_DETAIL_QUERY = `#graphql
  query ProductDetail($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      availableForSale
      tags
      vendor
      productType
      publishedAt
      seo { ...SeoFields }
      priceRange {
        minVariantPrice { ...MoneyFields }
        maxVariantPrice { ...MoneyFields }
      }
      compareAtPriceRange {
        minVariantPrice { ...MoneyFields }
        maxVariantPrice { ...MoneyFields }
      }
      featuredImage { ...ImageFields }
      images(first: 20) {
        edges {
          cursor
          node { ...ImageFields }
        }
        pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
      }
      options {
        id
        name
        values
      }
      variants(first: 250) {
        edges {
          cursor
          node { ...ProductVariantFields }
        }
        pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
      }
    }
  }
  ${SEO_FRAGMENT}
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCTS_QUERY = `#graphql
  query Products(
    $first: Int!
    $after: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $query: String
  ) {
    products(
      first: $first
      after: $after
      sortKey: $sortKey
      reverse: $reverse
      query: $query
    ) {
      edges {
        cursor
        node { ...ProductCardFields }
      }
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query RecommendedProducts($productId: ID!) {
    productRecommendations(productId: $productId) {
      ...ProductCardFields
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

// ─── Fonksiyonlar ─────────────────────────────────────────────────────────────

export async function getProduct(handle: string, locale?: string): Promise<ShopifyProduct | null> {
  const data = await shopifyFetch<{ product: ShopifyProduct | null }>(
    PRODUCT_DETAIL_QUERY,
    { handle },
    locale,
  );

  return data.product;
}

export interface GetProductsParams {
  first?: number;
  after?: string;
  sortKey?: SortKey;
  reverse?: boolean;
  query?: string;
}

export async function getProducts(params: GetProductsParams = {}): Promise<Connection<ShopifyProduct>> {
  const { first = 24, after, sortKey = 'MANUAL', reverse = false, query } = params;

  const data = await shopifyFetch<{ products: Connection<ShopifyProduct> }>(
    PRODUCTS_QUERY,
    { first, after, sortKey, reverse, query },
  );

  return data.products;
}

export async function getRecommendedProducts(productId: string, count = 8): Promise<ShopifyProduct[]> {
  const data = await shopifyFetch<{ productRecommendations: ShopifyProduct[] }>(
    RECOMMENDED_PRODUCTS_QUERY,
    { productId },
  );

  return data.productRecommendations.slice(0, count);
}
