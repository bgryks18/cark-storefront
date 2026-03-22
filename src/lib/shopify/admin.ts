const SHOPIFY_ADMIN_VERSION = '2024-01';

function getAdminUrl(path: string): string {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  return `https://${domain}/admin/api/${SHOPIFY_ADMIN_VERSION}${path}`;
}

// In-memory token cache — otomatik yenileme
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAdminToken(): Promise<string> {
  // 5 dakika erken yenile
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_ADMIN_CLIENT_ID,
      client_secret: process.env.SHOPIFY_ADMIN_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) throw new Error('Shopify Admin token alınamadı');

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

async function getAdminHeaders(): Promise<HeadersInit> {
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': await getAdminToken(),
  };
}

// Shopify GID → numeric ID: "gid://shopify/ProductVariant/12345" → 12345
function extractNumericId(gid: string): number {
  const parts = gid.split('/');
  return parseInt(parts[parts.length - 1]!, 10);
}

export interface DraftOrderParams {
  lineItems: Array<{
    variantId: string; // GID formatında
    quantity: number;
    price: string;
    title: string;
  }>;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  shippingTitle: string;
  shippingPrice: string;
  merchantOid: string;
}

export async function createDraftOrder(params: DraftOrderParams): Promise<{ id: number }> {
  const {
    lineItems,
    email,
    firstName,
    lastName,
    phone,
    address,
    city,
    zip,
    shippingTitle,
    shippingPrice,
    merchantOid,
  } = params;

  const body = {
    draft_order: {
      tags: 'paytr',
      note: `PayTR: ${merchantOid}`,
      email,
      phone,
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        address1: address,
        city,
        zip,
        country: 'Turkey',
        country_code: 'TR',
        phone,
      },
      billing_address: {
        first_name: firstName,
        last_name: lastName,
        address1: address,
        city,
        zip,
        country: 'Turkey',
        country_code: 'TR',
        phone,
      },
      line_items: lineItems.map((item) => ({
        variant_id: extractNumericId(item.variantId),
        quantity: item.quantity,
        price: item.price,
        title: item.title,
      })),
      shipping_line: {
        title: shippingTitle,
        price: shippingPrice,
        code: shippingTitle.includes('Hızlı') ? 'fast' : 'standard',
      },
    },
  };

  const response = await fetch(getAdminUrl('/draft_orders.json'), {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as {
    draft_order?: { id: number };
    errors?: unknown;
  };

  if (!response.ok || !data.draft_order) {
    console.error('Shopify draft order oluşturulamadı:', JSON.stringify(data.errors));
    throw new Error('Shopify taslak sipariş oluşturulamadı');
  }

  return { id: data.draft_order.id };
}

export async function completeDraftOrder(draftOrderId: number): Promise<void> {
  const gid = `gid://shopify/DraftOrder/${draftOrderId}`;
  const response = await fetch(getAdminUrl('/graphql.json'), {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify({
      query: `mutation {
        draftOrderComplete(id: "${gid}", paymentPending: false) {
          draftOrder { id }
          userErrors { field message }
        }
      }`,
    }),
  });

  const data = (await response.json()) as {
    data?: { draftOrderComplete?: { userErrors?: { field: string; message: string }[] } };
    errors?: unknown;
  };

  const userErrors = data.data?.draftOrderComplete?.userErrors ?? [];
  if (!response.ok || data.errors || userErrors.length > 0) {
    console.error('Shopify draft order tamamlanamadı:', JSON.stringify(data.errors ?? userErrors));
    throw new Error(`Shopify taslak sipariş tamamlanamadı: ${JSON.stringify(userErrors)}`);
  }
}

export async function deleteDraftOrder(draftOrderId: number): Promise<void> {
  await fetch(getAdminUrl(`/draft_orders/${draftOrderId}.json`), {
    method: 'DELETE',
    headers: await getAdminHeaders(),
  });
}

export interface AdminOrderLineItem {
  title: string;
  quantity: number;
  price: string;
  variant_title: string | null;
}

export interface AdminFulfillment {
  tracking_number: string | null;
  tracking_url: string | null;
  tracking_company: string | null;
}

export interface AdminOrder {
  id: number;
  name: string;
  email: string;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  subtotal_price: string;
  total_shipping_price_set: {
    shop_money: { amount: string; currency_code: string };
  };
  line_items: AdminOrderLineItem[];
  fulfillments: AdminFulfillment[];
}

export async function getOrderByIdAndEmail(
  orderId: string,
  email: string,
): Promise<AdminOrder | null> {
  const response = await fetch(
    getAdminUrl(`/orders/${orderId}.json?fields=id,name,email,created_at,financial_status,fulfillment_status,total_price,subtotal_price,total_shipping_price_set,line_items,fulfillments`),
    {
      headers: await getAdminHeaders(),
      cache: 'no-store',
    },
  );

  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Sipariş sorgulanamadı');

  const data = (await response.json()) as { order: AdminOrder };
  const order = data.order;

  // Email eşleşmiyorsa bulunamadı gibi davran
  if (order.email.toLowerCase() !== email.toLowerCase()) return null;

  return order;
}

export interface ShippingRate {
  title: string;
  price: number;
}

let ratesCache: ShippingRate[] | null = null;
let ratesCachedAt = 0;
const RATES_CACHE_TTL = 5 * 60 * 1000;

export async function getShippingRates(): Promise<ShippingRate[]> {
  if (ratesCache && Date.now() - ratesCachedAt < RATES_CACHE_TTL) {
    return ratesCache;
  }

  const response = await fetch(getAdminUrl('/shipping_zones.json'), {
    headers: await getAdminHeaders(),
  });

  if (!response.ok) throw new Error('Kargo seçenekleri alınamadı');

  const data = (await response.json()) as {
    shipping_zones: Array<{
      countries: Array<{ code: string }>;
      weight_based_shipping_rates: Array<{ name: string; price: string }>;
      price_based_shipping_rates: Array<{ name: string; price: string }>;
    }>;
  };

  const domestic = data.shipping_zones.find((z) =>
    z.countries?.some((c) => c.code === 'TR'),
  );

  // Shopify flat rate'leri price_based_shipping_rates'te saklıyor
  // Ücretsiz kargo (price=0) hariç her ikisini de alıyoruz
  const rates: ShippingRate[] = [
    ...(domestic?.weight_based_shipping_rates ?? []),
    ...(domestic?.price_based_shipping_rates ?? []),
  ]
    .filter((r) => parseFloat(r.price) > 0)
    .map((r) => ({
      title: r.name,
      price: parseFloat(r.price),
    }));

  ratesCache = rates;
  ratesCachedAt = Date.now();
  return rates;
}
