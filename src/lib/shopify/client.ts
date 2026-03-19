const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

if (!domain) {
  throw new Error('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN env değişkeni tanımlanmamış');
}
if (!storefrontToken) {
  throw new Error('NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN env değişkeni tanımlanmamış');
}

const endpoint = `https://${domain}/api/2024-10/graphql.json`;

export interface ShopifyFetchOptions {
  locale?: string;
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

export async function shopifyFetch<
  TData,
  TVariables extends Record<string, unknown> = Record<string, unknown>,
>(query: string, variables?: TVariables, options?: ShopifyFetchOptions): Promise<TData> {
  const { locale, cache, next } = options ?? {};

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': storefrontToken!,
  };

  if (locale) {
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    cache,
    next,
  });

  if (!res.ok) {
    throw new Error(`[Shopify] HTTP ${res.status}`);
  }

  const json = (await res.json()) as {
    data?: TData;
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) {
    throw new Error(`[Shopify] ${json.errors.map((e) => e.message).join(', ')}`);
  }

  return json.data as TData;
}
