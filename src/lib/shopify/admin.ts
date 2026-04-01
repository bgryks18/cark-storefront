const SHOPIFY_ADMIN_VERSION = '2026-01';

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

/** Mağazada API izinleri güncellendikten sonra yeni token almak için (ör. write_files eklendiğinde). */
export function invalidateShopifyAdminTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}

async function getAdminHeaders(): Promise<HeadersInit> {
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': await getAdminToken(),
  };
}

/** Admin GraphQL — draft order vb. dışında ortak kullanım */
export async function adminGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ data?: T; errors?: { message: string }[] }> {
  const response = await fetch(getAdminUrl('/graphql.json'), {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  const json = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (!response.ok) {
    return { data: undefined, errors: [{ message: `HTTP ${response.status}` }] };
  }
  return { data: json.data, errors: json.errors };
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

export async function updateDraftOrderNote(draftOrderId: number, note: string): Promise<void> {
  await fetch(getAdminUrl(`/draft_orders/${draftOrderId}.json`), {
    method: 'PUT',
    headers: await getAdminHeaders(),
    body: JSON.stringify({ draft_order: { note } }),
  });
}

export interface AdminAppliedDiscount {
  title: string;
  description: string | null;
  value_type: 'fixed_amount' | 'percentage' | 'shipping';
  value: string;
  amount: string;
}

export interface AdminDraftOrderLineItem {
  id: number;
  product_id?: number | null;
  title: string;
  quantity: number;
  price: string;
  total_discount?: string | null;
  applied_discount?: { amount: string; value: string; value_type: string; title?: string } | null;
  variant_id: number | null;
  variant_title: string | null;
  sku: string | null;
  custom: boolean;
}

export interface AdminDraftOrder {
  id: number;
  name: string;
  email: string;
  total_price: string;
  subtotal_price: string;
  total_discounts?: string | null;
  phone: string | null;
  status: string;
  shipping_address: AdminAddress | null;
  billing_address: AdminAddress | null;
  shipping_line: { title: string; price: string } | null;
  applied_discount: AdminAppliedDiscount | null;
  allow_discount_codes_in_checkout?: boolean | null;
  'allow_discount_codes_in_checkout?'?: boolean | null;
  line_items: AdminDraftOrderLineItem[];
}

export async function getDraftOrder(draftOrderId: string): Promise<AdminDraftOrder | null> {
  const response = await fetch(getAdminUrl(`/draft_orders/${draftOrderId}.json`), {
    headers: await getAdminHeaders(),
    cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Draft order sorgulanamadı');
  const data = (await response.json()) as { draft_order: AdminDraftOrder };
  return data.draft_order;
}

export interface AdminDraftOrderPricing {
  subtotalPrice: string;
  totalPrice: string;
  appliedDiscount: { title: string | null; amount: string } | null;
  lineItemDiscountTitle: string | null;
  hasDiscountSignal: boolean;
  originalSubtotalPrice: string;
  discountAmount: string;
}

export async function getDraftOrderDiscountCodeGraphql(
  draftOrderId: string,
): Promise<string | null> {
  const gid = `gid://shopify/DraftOrder/${draftOrderId}`;

  try {
    const result = await adminGraphql<{
      draftOrder: { discountCodes: string[] | null } | null;
    }>(
      `
        query DraftOrderDiscountCode($id: ID!) {
          draftOrder(id: $id) {
            discountCodes
          }
        }
      `,
      { id: gid },
    );
    if (!result.errors?.length) {
      const code = result.data?.draftOrder?.discountCodes?.[0]?.trim();
      if (code) return code;
    }
  } catch {
    // Discount code fetch is optional; return null on failure.
  }

  return null;
}

export async function getDraftOrderPricingGraphql(
  draftOrderId: string,
): Promise<AdminDraftOrderPricing | null> {
  const gid = `gid://shopify/DraftOrder/${draftOrderId}`;
  const query = `
    query DraftOrderPricing($id: ID!) {
      draftOrder(id: $id) {
        subtotalPrice
        totalPrice
        appliedDiscount {
          title
          amountV2 { amount }
        }
        lineItems(first: 50) {
          nodes {
            quantity
            originalUnitPrice
            discountedUnitPrice
            appliedDiscount { title }
          }
        }
      }
    }
  `;

  const result = await adminGraphql<{
    draftOrder: {
      subtotalPrice: string;
      totalPrice: string;
      appliedDiscount: { title: string | null; amountV2: { amount: string } | null } | null;
      lineItems: {
        nodes: Array<{
          quantity: number;
          originalUnitPrice: string | null;
          discountedUnitPrice: string | null;
          appliedDiscount: { title: string | null } | null;
        }>;
      };
    } | null;
  }>(query, { id: gid });

  if (result.errors?.length) {
    throw new Error(
      `Draft order GraphQL sorgusu başarısız: ${result.errors[0]?.message ?? 'Unknown error'}`,
    );
  }

  const draft = result.data?.draftOrder;
  if (!draft) return null;

  const firstLineDiscount = draft.lineItems.nodes.find((n) => n.appliedDiscount)?.appliedDiscount;
  const originalSubtotal = draft.lineItems.nodes.reduce((sum, n) => {
    const price = parseFloat(n.originalUnitPrice ?? '0');
    return sum + (Number.isFinite(price) ? price : 0) * n.quantity;
  }, 0);
  const discountedSubtotal = draft.lineItems.nodes.reduce((sum, n) => {
    const price = parseFloat(n.discountedUnitPrice ?? n.originalUnitPrice ?? '0');
    return sum + (Number.isFinite(price) ? price : 0) * n.quantity;
  }, 0);
  const topLevelDiscountAmount = parseFloat(draft.appliedDiscount?.amountV2?.amount ?? '0');
  const lineItemDiscountAmount = Math.max(0, originalSubtotal - discountedSubtotal);
  const totalPriceNumber = parseFloat(draft.totalPrice);
  const diffByTotal = Number.isFinite(totalPriceNumber)
    ? Math.max(0, originalSubtotal - totalPriceNumber)
    : 0;
  const effectiveDiscountAmount = Math.max(
    topLevelDiscountAmount,
    lineItemDiscountAmount,
    diffByTotal,
  );
  const hasDiscountByLinePrice = draft.lineItems.nodes.some((n) => {
    if (!n.originalUnitPrice || !n.discountedUnitPrice) return false;
    return parseFloat(n.discountedUnitPrice) < parseFloat(n.originalUnitPrice);
  });
  const hasDiscountSignal = Boolean(
    draft.appliedDiscount || firstLineDiscount || hasDiscountByLinePrice,
  );

  return {
    subtotalPrice: draft.subtotalPrice,
    totalPrice: draft.totalPrice,
    appliedDiscount: draft.appliedDiscount
      ? {
          title: draft.appliedDiscount.title,
          amount: draft.appliedDiscount.amountV2?.amount ?? '0',
        }
      : null,
    lineItemDiscountTitle: firstLineDiscount?.title ?? null,
    hasDiscountSignal,
    originalSubtotalPrice: originalSubtotal.toFixed(2),
    discountAmount: effectiveDiscountAmount.toFixed(2),
  };
}

export interface ShopifyDiscountCodeLookup {
  id: number;
  price_rule_id: number;
  code: string;
}

export async function lookupDiscountCode(code: string): Promise<ShopifyDiscountCodeLookup | null> {
  const response = await fetch(
    getAdminUrl(`/discount_codes/lookup.json?code=${encodeURIComponent(code)}`),
    {
      headers: await getAdminHeaders(),
      cache: 'no-store',
      redirect: 'manual',
    },
  );

  if ([301, 302, 303].includes(response.status)) {
    const location = response.headers.get('location') ?? '';
    const match = location.match(/price_rules\/(\d+)\/discount_codes\/(\d+)\.json/i);
    if (!match) throw new Error('İndirim kodu yönlendirmesi çözümlenemedi');
    return {
      id: parseInt(match[2]!, 10),
      price_rule_id: parseInt(match[1]!, 10),
      code,
    };
  }

  if (response.status === 404) return null;
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Shopify Admin uygulamasında read_discounts izni eksik');
    }
    throw new Error(`İndirim kodu sorgulanamadı (HTTP ${response.status})`);
  }

  let data: { discount_code?: ShopifyDiscountCodeLookup };
  try {
    data = (await response.json()) as { discount_code?: ShopifyDiscountCodeLookup };
  } catch {
    throw new Error('İndirim kodu sorgusu geçersiz yanıt döndürdü');
  }
  return data.discount_code ?? null;
}

export interface ShopifyPriceRule {
  id: number;
  title: string;
  value_type: 'fixed_amount' | 'percentage' | 'shipping';
  value: string;
}

export async function getPriceRule(priceRuleId: number): Promise<ShopifyPriceRule | null> {
  const response = await fetch(getAdminUrl(`/price_rules/${priceRuleId}.json`), {
    headers: await getAdminHeaders(),
    cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('İndirim kuralı sorgulanamadı');

  const data = (await response.json()) as { price_rule?: ShopifyPriceRule };
  return data.price_rule ?? null;
}

interface UpdateDraftOrderDiscountParams {
  draftOrderId: number;
  appliedDiscount: {
    title: string;
    description?: string;
    value_type: 'fixed_amount' | 'percentage';
    value: string;
  } | null;
}

export async function updateDraftOrderAppliedDiscount({
  draftOrderId,
  appliedDiscount,
}: UpdateDraftOrderDiscountParams): Promise<AdminDraftOrder> {
  const response = await fetch(getAdminUrl(`/draft_orders/${draftOrderId}.json`), {
    method: 'PUT',
    headers: await getAdminHeaders(),
    body: JSON.stringify({
      draft_order: {
        applied_discount: appliedDiscount
          ? {
              title: appliedDiscount.title,
              description: appliedDiscount.description ?? appliedDiscount.title,
              value_type: appliedDiscount.value_type,
              value: appliedDiscount.value,
            }
          : null,
      },
    }),
  });

  if (!response.ok) throw new Error('Draft order indirimi güncellenemedi');
  const data = (await response.json()) as { draft_order?: AdminDraftOrder };
  if (!data.draft_order) throw new Error('Draft order cevabı geçersiz');
  return data.draft_order;
}

export interface AdminAddress {
  first_name: string | null;
  last_name: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  zip: string | null;
  phone: string | null;
}

export interface AdminRefundTransaction {
  id: number;
  amount: string;
  kind: string;
  status: string;
}

export interface AdminRefund {
  id: number;
  created_at: string;
  transactions: AdminRefundTransaction[];
}

export interface AdminShippingLine {
  title: string;
  price: string;
}

export interface AdminOrderLineItem {
  id: number;
  product_id: number | null;
  title: string;
  quantity: number;
  price: string;
  variant_title: string | null;
  sku: string | null;
  image: { src: string; alt: string | null } | null;
}

export interface AdminFulfillment {
  id: number;
  created_at: string;
  updated_at: string;
  status: string;
  shipment_status: string | null;
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
  total_discounts: string;
  payment_gateway: string | null;
  total_shipping_price_set: {
    shop_money: { amount: string; currency_code: string };
  };
  shipping_address: AdminAddress | null;
  billing_address: AdminAddress | null;
  shipping_lines: AdminShippingLine[];
  line_items: AdminOrderLineItem[];
  fulfillments: AdminFulfillment[];
  refunds: AdminRefund[];
}

export async function getOrderByIdAndEmail(
  orderId: string,
  email: string,
): Promise<AdminOrder | null> {
  const response = await fetch(
    getAdminUrl(
      `/orders/${orderId}.json?fields=id,name,email,created_at,financial_status,fulfillment_status,total_price,subtotal_price,total_discounts,payment_gateway,total_shipping_price_set,shipping_address,billing_address,shipping_lines,line_items,fulfillments,refunds`,
    ),
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

  // REST API line item image'ı dönmüyor — Admin GraphQL ile çek
  const gid = `gid://shopify/Order/${orderId}`;
  const imgRes = await fetch(getAdminUrl('/graphql.json'), {
    method: 'POST',
    headers: { ...(await getAdminHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `{ order(id: "${gid}") { lineItems(first: 50) { nodes { id image { url altText } } } } }`,
    }),
    cache: 'no-store',
  });

  if (imgRes.ok) {
    const imgData = (await imgRes.json()) as {
      data?: {
        order?: {
          lineItems?: {
            nodes: { id: string; image: { url: string; altText: string | null } | null }[];
          };
        };
      };
    };
    const nodes = imgData.data?.order?.lineItems?.nodes ?? [];
    const imageMap = new Map(nodes.map((n) => [parseInt(n.id.split('/').pop()!), n.image]));
    order.line_items = order.line_items.map((item) => ({
      ...item,
      image: item.image?.src
        ? item.image
        : imageMap.get(item.id)
          ? { src: imageMap.get(item.id)!.url, alt: imageMap.get(item.id)!.altText }
          : null,
    }));
  }

  return order;
}

export interface ShippingRate {
  title: string;
  price: number;
  originalPrice: number;
  isFree: boolean;
}

const FREE_SHIPPING_MIN = parseFloat(process.env.SHOPIFY_FREE_SHIPPING_MIN ?? '0') || null;

let ratesCache: { title: string; price: number }[] | null = null;
let ratesCachedAt = 0;
const RATES_CACHE_TTL = 5 * 60 * 1000;

async function fetchRawRates(): Promise<{ title: string; price: number }[]> {
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

  const domestic = data.shipping_zones.find((z) => z.countries?.some((c) => c.code === 'TR'));

  ratesCache = [
    ...(domestic?.weight_based_shipping_rates ?? []),
    ...(domestic?.price_based_shipping_rates ?? []),
  ].map((r) => ({ title: r.name, price: parseFloat(r.price) }));


  ratesCachedAt = Date.now();
  return ratesCache;
}

export async function getShippingRates(cartSubtotal?: number): Promise<ShippingRate[]> {
  const raw = await fetchRawRates();
  const isFree =
    FREE_SHIPPING_MIN !== null && cartSubtotal !== undefined && cartSubtotal >= FREE_SHIPPING_MIN;

  return raw.map((r) => ({
    title: r.title,
    price: isFree ? 0 : r.price,
    originalPrice: r.price,
    isFree,
  }));
}
