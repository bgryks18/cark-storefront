import { getLocale } from 'next-intl/server';

import type { ShopifyAddress, ShopifyCustomer } from './types';

const SHOP_ID = process.env.SHOPIFY_SHOP_ID!;
const CLIENT_ID = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID!;
const API_VERSION = '2024-10';
const STOREFRONT_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

const TOKEN_URL = `https://shopify.com/authentication/${SHOP_ID}/oauth/token`;

const UA = 'CarkStorefront/1.0 (+https://shopify.dev/docs/api/customer)';

function storefrontOrigin(): string | undefined {
  const raw = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return undefined;
  try {
    return new URL(raw).origin;
  } catch {
    return undefined;
  }
}

async function resolveCustomerAccountGraphqlUrl(): Promise<string> {
  const override = process.env.SHOPIFY_CUSTOMER_ACCOUNT_GRAPHQL_URL;
  if (override) return override;
  const fallback = `https://shopify.com/${SHOP_ID}/account/customer/api/${API_VERSION}/graphql`;
  if (!STOREFRONT_DOMAIN) return fallback;
  try {
    const res = await fetch(`https://${STOREFRONT_DOMAIN}/.well-known/customer-account-api`, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(String(res.status));
    const cfg = (await res.json()) as { graphql_api?: string };
    if (cfg.graphql_api) return cfg.graphql_api;
  } catch {
    /* use fallback */
  }
  return fallback;
}

// ─── Raw API Types ────────────────────────────────────────────────────────────

interface RawLineItem {
  name: string;
  quantity: number;
  variantTitle: string | null;
  price: { amount: string; currencyCode: string } | null;
  image: { url: string; altText: string | null } | null;
}

interface RawOrder {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: { amount: string; currencyCode: string };
  subtotal: { amount: string; currencyCode: string } | null;
  totalShipping: { amount: string; currencyCode: string } | null;
  lineItems: { nodes: RawLineItem[] };
}

interface RawCustomer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  emailAddress: { emailAddress: string } | null;
  creationDate: string;
  orders: { nodes: RawOrder[] };
}

const CUSTOMER_UPDATE_MUTATION = `#graphql
  mutation CustomerAccountUpdate($input: CustomerUpdateInput!) {
    customerUpdate(input: $input) {
      customer {
        firstName
        lastName
        displayName
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ─── Orders List Query ────────────────────────────────────────────────────────

const ORDERS_LIST_QUERY = `#graphql
  query CustomerOrders {
    customer {
      orders(first: 250, reverse: true) {
        nodes {
          id
          name
          processedAt
          financialStatus
          fulfillmentStatus
          totalPrice { amount currencyCode }
          lineItems(first: 50) {
            nodes { quantity }
          }
        }
      }
    }
  }
`;

export interface ShopifyOrderSummary {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  itemCount: number;
  totalPrice: { amount: string; currencyCode: string };
}

export async function getCustomerOrders(
  accessToken: string,
): Promise<ShopifyOrderSummary[] | null> {
  try {
    const payload = await postCustomerAccountGraphql(accessToken, { query: ORDERS_LIST_QUERY });
    if (!payload) return null;
    const data = payload.data as
      | {
          customer: {
            orders: {
              nodes: Array<{
                id: string;
                name: string;
                processedAt: string;
                financialStatus: string | null;
                fulfillmentStatus: string | null;
                totalPrice: { amount: string; currencyCode: string };
                lineItems: { nodes: Array<{ quantity: number }> };
              }>;
            };
          } | null;
        }
      | undefined;
    const nodes = data?.customer?.orders.nodes;
    if (!nodes) return null;
    return nodes.map((o) => ({
      id: o.id,
      name: o.name,
      processedAt: o.processedAt,
      financialStatus: o.financialStatus ?? 'UNKNOWN',
      fulfillmentStatus: o.fulfillmentStatus ?? 'UNFULFILLED',
      itemCount: o.lineItems.nodes.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: o.totalPrice,
    }));
  } catch {
    return null;
  }
}

// ─── GraphQL Query ────────────────────────────────────────────────────────────

const CUSTOMER_QUERY = `#graphql
  query CustomerAccount {
    customer {
      id
      firstName
      lastName
      displayName
      emailAddress { emailAddress }
      creationDate
      orders(first: 20, reverse: true) {
        nodes {
          id
          name
          processedAt
          financialStatus
          fulfillmentStatus
          totalPrice { amount currencyCode }
          subtotal { amount currencyCode }
          totalShipping { amount currencyCode }
          lineItems(first: 50) {
            nodes {
              name
              quantity
              variantTitle
              price { amount currencyCode }
              image { url altText }
            }
          }
        }
      }
    }
  }
`;

// ─── Adapter ──────────────────────────────────────────────────────────────────

function mapToShopifyCustomer(raw: RawCustomer): ShopifyCustomer {
  const firstName = raw.firstName ?? '';
  const lastName = raw.lastName ?? '';
  const email = raw.emailAddress?.emailAddress ?? '';
  const displayName =
    raw.displayName?.trim() || [firstName, lastName].filter(Boolean).join(' ') || email;

  return {
    id: raw.id,
    email,
    firstName: firstName || null,
    lastName: lastName || null,
    displayName,
    phone: null,
    acceptsMarketing: false,
    createdAt: raw.creationDate,
    defaultAddress: null,
    addresses: {
      edges: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
    },
    orders: {
      edges: raw.orders.nodes.map((order) => ({
        cursor: order.id,
        node: {
          id: order.id,
          name: order.name,
          processedAt: order.processedAt,
          financialStatus: order.financialStatus ?? 'UNKNOWN',
          fulfillmentStatus: order.fulfillmentStatus ?? 'UNFULFILLED',
          totalPrice: order.totalPrice,
          subtotalPrice: order.subtotal ?? null,
          totalShippingPrice: order.totalShipping ?? {
            amount: '0',
            currencyCode: order.totalPrice.currencyCode,
          },
          lineItems: {
            edges: order.lineItems.nodes.map((item) => ({
              cursor: item.name,
              node: {
                title: item.name,
                quantity: item.quantity,
                variant: {
                  id: '',
                  title: item.variantTitle ?? item.name,
                  price: item.price ?? { amount: '0', currencyCode: order.totalPrice.currencyCode },
                  image: item.image
                    ? {
                        url: item.image.url,
                        altText: item.image.altText,
                        width: null,
                        height: null,
                      }
                    : null,
                },
              },
            })),
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
          },
        },
      })),
      pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
    },
  };
}

// ─── Public Functions ─────────────────────────────────────────────────────────

function buildGraphqlHeaders(
  accessToken: string,
  authScheme: 'bearer' | 'raw',
): Record<string, string> {
  const origin = storefrontOrigin();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': UA,
    Authorization: authScheme === 'bearer' ? `Bearer ${accessToken}` : accessToken,
  };
  if (origin) {
    headers.Origin = origin;
  }
  return headers;
}

async function postCustomerAccountGraphql(
  accessToken: string,
  body: { query: string; variables?: Record<string, unknown> },
): Promise<{
  data?: unknown;
  errors?: { message: string }[];
} | null> {
  try {
    const graphqlUrl = await resolveCustomerAccountGraphqlUrl();
    const jsonBody = JSON.stringify(body);
    const locale = await getLocale().catch(() => 'tr');

    for (const scheme of ['bearer', 'raw'] as const) {
      const res = await fetch(graphqlUrl, {
        method: 'POST',
        headers: { ...buildGraphqlHeaders(accessToken, scheme), 'Accept-Language': locale },
        body: jsonBody,
        cache: 'no-store',
      });

      if (!res.ok) continue;

      const payload = (await res.json()) as {
        data?: unknown;
        errors?: { message: string }[];
      };

      if (process.env.NODE_ENV === 'development' && payload.errors?.length) {
        console.error('[Customer Account API]', JSON.stringify(payload.errors, null, 2));
      }

      return payload;
    }

    return null;
  } catch {
    return null;
  }
}

export async function getCustomerAccount(accessToken: string): Promise<ShopifyCustomer | null> {
  try {
    const payload = await postCustomerAccountGraphql(accessToken, { query: CUSTOMER_QUERY });
    if (!payload) return null;

    const data = payload.data as { customer: RawCustomer | null } | undefined;
    const raw = data?.customer;
    if (raw) {
      return mapToShopifyCustomer(raw);
    }

    return null;
  } catch {
    return null;
  }
}

export type CustomerAccountProfileUpdateResult = { ok: true } | { ok: false; message: string };

/**
 * Customer Account API — yalnızca ad / soyad (CustomerUpdateInput).
 */
export async function updateCustomerAccountProfile(
  accessToken: string,
  input: { firstName: string; lastName: string },
): Promise<CustomerAccountProfileUpdateResult> {
  const payload = await postCustomerAccountGraphql(accessToken, {
    query: CUSTOMER_UPDATE_MUTATION,
    variables: {
      input: {
        firstName: input.firstName,
        lastName: input.lastName,
      },
    },
  });

  if (!payload) {
    return { ok: false, message: 'request_failed' };
  }

  if (payload.errors?.length) {
    return { ok: false, message: payload.errors.map((e) => e.message).join(', ') };
  }

  const data = payload.data as {
    customerUpdate?: {
      customer: { firstName: string | null; lastName: string | null; displayName: string } | null;
      userErrors: { field?: string[] | null; message: string }[];
    } | null;
  };

  const update = data?.customerUpdate;
  if (!update) {
    return { ok: false, message: 'invalid_response' };
  }

  if (update.userErrors?.length) {
    return {
      ok: false,
      message: update.userErrors.map((e) => e.message).join(', '),
    };
  }

  if (!update.customer) {
    return { ok: false, message: 'no_customer' };
  }

  return { ok: true };
}

// ─── Address Types ────────────────────────────────────────────────────────────

interface RawCustomerAddress {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  zoneCode: string | null;
  zip: string | null;
  territoryCode: string | null;
  phoneNumber: string | null;
}

export interface CustomerAddressInput {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  zoneCode?: string;
  zip?: string;
  territoryCode?: string;
  phoneNumber?: string;
}

// ─── Address GraphQL ──────────────────────────────────────────────────────────

const ADDRESSES_QUERY = `#graphql
  query CustomerAddresses {
    customer {
      addresses(first: 20) {
        nodes {
          id
          firstName
          lastName
          company
          address1
          address2
          city
          zoneCode
          zip
          territoryCode
          phoneNumber
        }
      }
      defaultAddress {
        id
      }
    }
  }
`;

const ADDRESS_CREATE_MUTATION = `#graphql
  mutation CustomerAddressCreate($address: CustomerAddressInput!) {
    customerAddressCreate(address: $address) {
      customerAddress { id }
      userErrors { field message }
    }
  }
`;

const ADDRESS_UPDATE_MUTATION = `#graphql
  mutation CustomerAddressUpdate($addressId: ID!, $address: CustomerAddressInput!, $defaultAddress: Boolean) {
    customerAddressUpdate(addressId: $addressId, address: $address, defaultAddress: $defaultAddress) {
      customerAddress { id }
      userErrors { field message }
    }
  }
`;

const ADDRESS_DELETE_MUTATION = `#graphql
  mutation CustomerAddressDelete($addressId: ID!) {
    customerAddressDelete(addressId: $addressId) {
      deletedAddressId
      userErrors { field message }
    }
  }
`;

// ─── Address Adapter ──────────────────────────────────────────────────────────

function mapToShopifyAddress(raw: RawCustomerAddress): ShopifyAddress {
  const nameParts = [raw.firstName, raw.lastName].filter(Boolean);
  const cityZip = [raw.zip, raw.city].filter(Boolean).join(' ');
  const formatted = [
    nameParts.join(' '),
    raw.company,
    raw.address1,
    raw.address2,
    cityZip,
    raw.territoryCode,
  ].filter((l): l is string => !!l?.trim());

  return {
    id: raw.id,
    firstName: raw.firstName,
    lastName: raw.lastName,
    company: raw.company,
    address1: raw.address1,
    address2: raw.address2,
    city: raw.city,
    province: raw.zoneCode,
    country: raw.territoryCode,
    zip: raw.zip,
    phone: raw.phoneNumber,
    formatted,
  };
}

// ─── Address Public Functions ─────────────────────────────────────────────────

export type AddressResult = { ok: true; addressId?: string } | { ok: false; message: string };

export async function getCustomerAddresses(accessToken: string): Promise<{
  addresses: ShopifyAddress[];
  defaultAddressId: string | null;
} | null> {
  try {
    const payload = await postCustomerAccountGraphql(accessToken, { query: ADDRESSES_QUERY });
    if (!payload) return null;

    const data = payload.data as {
      customer?: {
        addresses: { nodes: RawCustomerAddress[] };
        defaultAddress: { id: string } | null;
      } | null;
    };

    const customer = data?.customer;
    if (!customer) return null;

    return {
      addresses: customer.addresses.nodes.map(mapToShopifyAddress),
      defaultAddressId: customer.defaultAddress?.id ?? null,
    };
  } catch {
    return null;
  }
}

export async function createCustomerAddress(
  accessToken: string,
  input: CustomerAddressInput,
): Promise<AddressResult> {
  const payload = await postCustomerAccountGraphql(accessToken, {
    query: ADDRESS_CREATE_MUTATION,
    variables: { address: input },
  });

  if (!payload) return { ok: false, message: 'request_failed' };
  if (payload.errors?.length)
    return { ok: false, message: payload.errors.map((e) => e.message).join(', ') };

  const data = payload.data as {
    customerAddressCreate?: {
      customerAddress: { id: string } | null;
      userErrors: { message: string }[];
    } | null;
  };
  const result = data?.customerAddressCreate;
  if (!result) return { ok: false, message: 'invalid_response' };
  if (result.userErrors?.length)
    return { ok: false, message: result.userErrors.map((e) => e.message).join(', ') };
  if (!result.customerAddress) return { ok: false, message: 'no_address' };

  return { ok: true, addressId: result.customerAddress.id };
}

export async function updateCustomerAddress(
  accessToken: string,
  addressId: string,
  input: CustomerAddressInput,
  makeDefault?: boolean,
): Promise<AddressResult> {
  const payload = await postCustomerAccountGraphql(accessToken, {
    query: ADDRESS_UPDATE_MUTATION,
    variables: { addressId, address: input, defaultAddress: makeDefault },
  });

  if (!payload) return { ok: false, message: 'request_failed' };
  if (payload.errors?.length)
    return { ok: false, message: payload.errors.map((e) => e.message).join(', ') };

  const data = payload.data as {
    customerAddressUpdate?: {
      customerAddress: { id: string } | null;
      userErrors: { message: string }[];
    } | null;
  };
  const result = data?.customerAddressUpdate;
  if (!result) return { ok: false, message: 'invalid_response' };
  if (result.userErrors?.length) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '[customerAddressUpdate userErrors]',
        JSON.stringify(result.userErrors, null, 2),
      );
    }
    return { ok: false, message: result.userErrors.map((e) => e.message).join(', ') };
  }

  return { ok: true };
}

export async function deleteCustomerAddress(
  accessToken: string,
  addressId: string,
): Promise<AddressResult> {
  const payload = await postCustomerAccountGraphql(accessToken, {
    query: ADDRESS_DELETE_MUTATION,
    variables: { addressId },
  });

  if (!payload) return { ok: false, message: 'request_failed' };
  if (payload.errors?.length)
    return { ok: false, message: payload.errors.map((e) => e.message).join(', ') };

  const data = payload.data as {
    customerAddressDelete?: {
      deletedAddressId: string | null;
      userErrors: { message: string }[];
    } | null;
  };
  const result = data?.customerAddressDelete;
  if (!result) return { ok: false, message: 'invalid_response' };
  if (result.userErrors?.length)
    return { ok: false, message: result.userErrors.map((e) => e.message).join(', ') };

  return { ok: true };
}

export async function refreshCustomerAccountToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
} | null> {
  try {
    const origin = storefrontOrigin();
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
        ...(origin ? { Origin: origin } : {}),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
      }),
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return res.json() as Promise<{
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    }>;
  } catch {
    return null;
  }
}
