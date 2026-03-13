import { GraphQLClient } from 'graphql-request';

import type { ShopifyError } from './types';

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

if (!domain) {
  throw new Error('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN env değişkeni tanımlanmamış');
}
if (!storefrontToken) {
  throw new Error('NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN env değişkeni tanımlanmamış');
}

// ─── Storefront API client ────────────────────────────────────────────────────

const storefrontEndpoint = `https://${domain}/api/2024-10/graphql.json`;

export const storefrontClient = new GraphQLClient(storefrontEndpoint, {
  headers: {
    'X-Shopify-Storefront-Access-Token': storefrontToken,
    'Content-Type': 'application/json',
  },
});

// ─── Helper: Shopify hata kontrolü ───────────────────────────────────────────

export function checkShopifyErrors(errors: ShopifyError[] | undefined, context: string): void {
  if (errors && errors.length > 0) {
    const messages = errors.map((e) => e.message).join(', ');
    throw new Error(`[Shopify ${context}] ${messages}`);
  }
}

// ─── Helper: Storefront query çalıştır ───────────────────────────────────────

export async function shopifyFetch<
  TData,
  TVariables extends Record<string, unknown> = Record<string, unknown>,
>(query: string, variables?: TVariables, locale?: string): Promise<TData> {
  const requestHeaders: Record<string, string> = {};
  if (locale) {
    requestHeaders['Accept-Language'] = locale;
  }
  const data = await storefrontClient.request<TData>(query, variables, requestHeaders);
  return data;
}
