import type {
  CartLineItem,
  CollectionVariantCard,
  Connection,
  MoneyV2,
  ShopifyCart,
  ShopifyProduct,
} from './types';

// ─── Connection → Array ───────────────────────────────────────────────────────
// Shopify GraphQL connection'larını düz array'e çevirir

export function flattenConnection<T>(connection: Connection<T>): T[] {
  return connection.edges.map((edge) => edge.node);
}

/** Shopify GID → `?variant=` için sayısal id */
export function variantNumericId(variantGid: string): string {
  return variantGid.split('/').pop() ?? variantGid;
}

/** Koleksiyon: her ürünü varyant kartlarına böler */
export function expandProductsToVariantCards(products: ShopifyProduct[]): CollectionVariantCard[] {
  const out: CollectionVariantCard[] = [];
  for (const product of products) {
    for (const variant of flattenConnection(product.variants)) {
      out.push({ product, variant });
    }
  }
  return out;
}

/** Aynı ürünün varyantları arasında tutarlı ikincil sıra */
function compareVariantTieBreak(a: CollectionVariantCard, b: CollectionVariantCard): number {
  const sa = a.variant.selectedOptions.map((o) => `${o.name}\u0000${o.value}`).join('\u0001');
  const sb = b.variant.selectedOptions.map((o) => `${o.name}\u0000${o.value}`).join('\u0001');
  const s = sa.localeCompare(sb, undefined, { sensitivity: 'base' });
  if (s !== 0) return s;
  return a.variant.id.localeCompare(b.variant.id);
}

/**
 * Koleksiyon sıralaması Shopify’da **ürün** düzeyinde; grid **varyant kartı**.
 * Bu fonksiyon, seçilen `sort`a göre kartları **varyant mantığıyla** yeniden sıralar.
 *
 * - `manual`: Shopify’ın döndüğü ürün sırası × varyant sırası korunur (yeniden sıralama yok).
 *
 * Sayfalama ürün cursor’ı ile olduğu için “tüm katalogda” mükemmel sıra garantisi yok;
 * yüklenen kartlar arasında tutarlılık sağlanır.
 */
export function sortVariantCardsByCollectionSort(
  cards: CollectionVariantCard[],
  sort: string,
): CollectionVariantCard[] {
  if (sort === 'manual') {
    return cards;
  }

  const copy = [...cards];

  switch (sort) {
    case 'priceAsc':
    case 'priceDesc': {
      const mult = sort === 'priceAsc' ? 1 : -1;
      return copy.sort((a, b) => {
        const pa = parseFloat(a.variant.price.amount);
        const pb = parseFloat(b.variant.price.amount);
        if (Number.isNaN(pa) || Number.isNaN(pb)) return 0;
        if (pa !== pb) return (pa - pb) * mult;
        return compareVariantTieBreak(a, b);
      });
    }
    case 'titleAsc':
      return copy.sort((a, b) => {
        const t = a.product.title.localeCompare(b.product.title, undefined, { sensitivity: 'base' });
        if (t !== 0) return t;
        return compareVariantTieBreak(a, b);
      });
    case 'titleDesc':
      return copy.sort((a, b) => {
        const t = b.product.title.localeCompare(a.product.title, undefined, { sensitivity: 'base' });
        if (t !== 0) return t;
        return compareVariantTieBreak(a, b);
      });
    case 'createdDesc':
      return copy.sort((a, b) => {
        const da = new Date(a.product.publishedAt ?? 0).getTime();
        const db = new Date(b.product.publishedAt ?? 0).getTime();
        if (da !== db) return db - da;
        return compareVariantTieBreak(a, b);
      });
    default:
      return cards;
  }
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
