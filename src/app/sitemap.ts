import type { MetadataRoute } from 'next';

import { getProducts } from '@/lib/shopify/queries/product';
import { getCollections } from '@/lib/shopify/queries/collection';
import { flattenConnection } from '@/lib/shopify/normalize';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.carkzimpara.com';

function url(path: string) {
  return `${SITE_URL}${path}`;
}

async function getAllProductHandles(): Promise<string[]> {
  const handles: string[] = [];
  let after: string | undefined;

  while (true) {
    const connection = await getProducts({ first: 250, after });
    const products = flattenConnection(connection);
    handles.push(...products.map((p) => p.handle));

    if (!connection.pageInfo.hasNextPage) break;
    after = connection.pageInfo.endCursor ?? undefined;
  }

  return handles;
}

async function getAllCollectionHandles(): Promise<string[]> {
  const handles: string[] = [];
  let after: string | undefined;

  while (true) {
    const connection = await getCollections(250, after);
    const collections = flattenConnection(connection);
    handles.push(...collections.map((c) => c.handle));

    if (!connection.pageInfo.hasNextPage) break;
    after = connection.pageInfo.endCursor ?? undefined;
  }

  return handles;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productHandles, collectionHandles] = await Promise.all([
    getAllProductHandles(),
    getAllCollectionHandles(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url('/'),           alternates: { languages: { tr: url('/'), en: url('/en') } },           priority: 1.0, changeFrequency: 'daily' },
    { url: url('/collections'), alternates: { languages: { tr: url('/collections'), en: url('/en/collections') } }, priority: 0.8, changeFrequency: 'weekly' },
  ];

  const productRoutes: MetadataRoute.Sitemap = productHandles.map((handle) => ({
    url: url(`/products/${handle}`),
    alternates: {
      languages: {
        tr: url(`/products/${handle}`),
        en: url(`/en/products/${handle}`),
      },
    },
    priority: 0.7,
    changeFrequency: 'weekly' as const,
  }));

  const collectionRoutes: MetadataRoute.Sitemap = collectionHandles.map((handle) => ({
    url: url(`/collections/${handle}`),
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
