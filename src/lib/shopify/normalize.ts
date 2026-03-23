import type { CartLineItem, Connection, MoneyV2, ShopifyCart, ShopifyProduct } from './types';

// ─── Connection → Array ───────────────────────────────────────────────────────
// Shopify GraphQL connection'larını düz array'e çevirir

export function flattenConnection<T>(connection: Connection<T>): T[] {
  return connection.edges.map((edge) => edge.node);
}

// ─── Para formatlama ──────────────────────────────────────────────────────────

export function formatMoney(money: MoneyV2, locale = 'tr-TR'): string {
  const amount = parseFloat(money.amount);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPrice(amount: string | number, currency = 'TRY', locale = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
}

// ─── Ürün yardımcıları ────────────────────────────────────────────────────────

export function getProductUrl(handle: string, locale?: string): string {
  const base = locale && locale !== 'tr' ? `/${locale}` : '';
  return `${base}/products/${handle}`;
}

export function getCollectionUrl(handle: string, locale?: string): string {
  const base = locale && locale !== 'tr' ? `/${locale}` : '';
  return `${base}/collections/${handle}`;
}

export function isProductOnSale(product: ShopifyProduct): boolean {
  const min = parseFloat(product.priceRange.minVariantPrice.amount);
  const compareMin = parseFloat(product.compareAtPriceRange.minVariantPrice.amount);
  return compareMin > 0 && compareMin > min;
}

export function getDiscountPercentage(original: MoneyV2, discounted: MoneyV2): number {
  const orig = parseFloat(original.amount);
  const disc = parseFloat(discounted.amount);
  if (orig <= 0) return 0;
  return Math.round(((orig - disc) / orig) * 100);
}

// ─── Sepet yardımcıları ───────────────────────────────────────────────────────

export function getCartItemCount(cart: ShopifyCart | null): number {
  return cart?.totalQuantity ?? 0;
}

export function getCartLines(cart: ShopifyCart | null): CartLineItem[] {
  if (!cart) return [];
  return flattenConnection(cart.lines);
}

export function getCartSubtotal(cart: ShopifyCart | null): MoneyV2 | null {
  return cart?.cost.subtotalAmount ?? null;
}

// ─── Varyant yardımcıları ─────────────────────────────────────────────────────

export function encodeVariantId(variantId: string): string {
  // Shopify global ID'yi base64 encode eder (gerektiğinde)
  return btoa(variantId);
}

export function decodeVariantId(encoded: string): string {
  return atob(encoded);
}
