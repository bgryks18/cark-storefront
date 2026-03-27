import type { MetadataRoute } from 'next';

import { shopifyFetch } from '@/lib/shopify/client';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.carkzimpara.com';

function url(path: string) {
  return `${SITE_URL}${path}`;
}

// ─── Lightweight sitemap queries ──────────────────────────────────────────────

const SITEMAP_PRODUCTS_QUERY = `#graphql
  query SitemapProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          handle
          updatedAt
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const SITEMAP_COLLECTIONS_QUERY = `#graphql
  query SitemapCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        node {
          handle
          updatedAt
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface SitemapNode {
  handle: string;
  updatedAt: string;
}

interface SitemapConnection {
  edges: { node: SitemapNode }[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

async function getAllProducts(): Promise<SitemapNode[]> {
  const all: SitemapNode[] = [];
  let after: string | null = null;

  while (true) {
    const data: { products: SitemapConnection } = await shopifyFetch(
      SITEMAP_PRODUCTS_QUERY,
      { first: 250, after },
      { next: { revalidate: 3600, tags: ['products'] } },
    );
    for (const edge of data.products.edges) all.push(edge.node);
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }

  return all;
}

async function getAllCollections(): Promise<SitemapNode[]> {
  const all: SitemapNode[] = [];
  let after: string | null = null;

  while (true) {
    const data: { collections: SitemapConnection } = await shopifyFetch(
      SITEMAP_COLLECTIONS_QUERY,
      { first: 250, after },
      { next: { revalidate: 3600, tags: ['collections'] } },
    );
    for (const edge of data.collections.edges) all.push(edge.node);
    if (!data.collections.pageInfo.hasNextPage) break;
    after = data.collections.pageInfo.endCursor;
  }

  return all;
}

// ─── Sitemap ──────────────────────────────────────────────────────────────────

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([getAllProducts(), getAllCollections()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url('/'), alternates: { languages: { tr: url('/'), en: url('/en') } }, priority: 1.0, changeFrequency: 'daily' },
    { url: url('/collections'), alternates: { languages: { tr: url('/collections'), en: url('/en/collections') } }, priority: 0.8, changeFrequency: 'weekly' },
    { url: url('/contact'), alternates: { languages: { tr: url('/contact'), en: url('/en/contact') } }, priority: 0.5, changeFrequency: 'monthly' },
    { url: url('/order-tracking'), alternates: { languages: { tr: url('/order-tracking'), en: url('/en/order-tracking') } }, priority: 0.4, changeFrequency: 'monthly' },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map(({ handle, updatedAt }) => ({
    url: url(`/products/${handle}`),
    lastModified: new Date(updatedAt),
    alternates: {
      languages: {
        tr: url(`/products/${handle}`),
        en: url(`/en/products/${handle}`),
      },
    },
    priority: 0.9,
    changeFrequency: 'weekly' as const,
  }));

  const collectionRoutes: MetadataRoute.Sitemap = collections.map(({ handle, updatedAt }) => ({
    url: url(`/collections/${handle}`),
    lastModified: new Date(updatedAt),
    alternates: {
      languages: {
        tr: url(`/collections/${handle}`),
        en: url(`/en/collections/${handle}`),
      },
    },
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }));

  return [...staticRoutes, ...collectionRoutes, ...productRoutes];
}
