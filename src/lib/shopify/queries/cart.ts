import { CART_FRAGMENT } from '../fragments';
import { shopifyFetch } from '../client';

import type { CartLineInput, ShopifyCart } from '../types';

// ─── Shared error/warning types ───────────────────────────────────────────────

/**
 * Shopify CartUserErrorCode — cartLinesAdd / cartLinesUpdate / cartLinesRemove
 * mutasyonlarından dönebilecek hata kodları.
 *
 * Referans: https://shopify.dev/docs/api/storefront/latest/enums/CartErrorCode
 */
export enum CartErrorCode {
  /** İstenen miktar mevcut stoğu aşıyor. */
  MAXIMUM_EXCEEDED = 'MAXIMUM_EXCEEDED',

  /** İstenen miktar minimum miktarın altında (quantityRule.minimum). */
  LESS_THAN = 'LESS_THAN',

  /** Ürün için tanımlı minimum adet şartı sağlanamadı. */
  MINIMUM_NOT_MET = 'MINIMUM_NOT_MET',

  /** Ürün yeterli stoğa sahip değil. */
  MERCHANDISE_NOT_ENOUGH_STOCK = 'MERCHANDISE_NOT_ENOUGH_STOCK',

  /** Ürün bu sepete eklenemiyor (bölge / kanal kısıtlaması vb.). */
  MERCHANDISE_NOT_APPLICABLE = 'MERCHANDISE_NOT_APPLICABLE',

  /** Miktar, ürünün tanımlı artış adımına (quantityRule.increment) uymuyor. */
  INVALID_DELIVERABLE_QUANTITY = 'INVALID_DELIVERABLE_QUANTITY',

  /** Miktar geçerli bir artış adımında değil (increment kuralı ihlali). */
  INVALID_INCREMENT = 'INVALID_INCREMENT',

  /** Sepet satırı bulunamadı; ürün zaten silinmiş ya da ID geçersiz. */
  INVALID_MERCHANDISE_LINE = 'INVALID_MERCHANDISE_LINE',

  /** Sepette izin verilen maksimum satır sayısı aşıldı. */
  CART_TOO_LARGE = 'CART_TOO_LARGE',

  /** Shopify tarafında geçici servis hatası; kısa süre sonra tekrar denenebilir. */
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  /** Shopify akış kuralları veya uygulama mantığından kaynaklanan özel doğrulama hatası. */
  VALIDATION_CUSTOM = 'VALIDATION_CUSTOM',
}

export type CartUserError = { code: CartErrorCode | null; field: string[] | null; message: string };
export type CartWarning = { code: string; message: string };

// ─── Mutations & Queries ──────────────────────────────────────────────────────

const CART_CREATE_MUTATION = `#graphql
  mutation CartCreate($lines: [CartLineInput!], $buyerIdentityInput: CartBuyerIdentityInput) {
    cartCreate(input: { lines: $lines, buyerIdentity: $buyerIdentityInput }) {
      cart { ...CartFields }
      userErrors { code field message }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_QUERY = `#graphql
  query Cart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_ADD_MUTATION = `#graphql
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { code field message }
      warnings { code message }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_UPDATE_MUTATION = `#graphql
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { code field message }
      warnings { code message }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_REMOVE_MUTATION = `#graphql
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { code field message }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_BUYER_IDENTITY_UPDATE_MUTATION = `#graphql
  mutation CartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart { ...CartFields }
      userErrors { code field message }
    }
  }
  ${CART_FRAGMENT}
`;

// ─── Fonksiyonlar ─────────────────────────────────────────────────────────────

export async function createCart(lines: CartLineInput[] = []): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartCreate: { cart: ShopifyCart; userErrors: CartUserError[] };
  }>(CART_CREATE_MUTATION, { lines }, { cache: 'no-store' });

  // create'te hata varsa sepet oluşturulmamış demektir — throw et
  if (data.cartCreate.userErrors.length > 0) {
    throw new Error(data.cartCreate.userErrors.map((e) => e.message).join(', '));
  }
  return data.cartCreate.cart;
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<{ cart: ShopifyCart | null }>(CART_QUERY, { cartId }, { cache: 'no-store' });
  return data.cart;
}

export async function addCartLines(
  cartId: string,
  lines: CartLineInput[],
): Promise<{ cart: ShopifyCart; userErrors: CartUserError[]; warnings: CartWarning[] }> {
  const data = await shopifyFetch<{
    cartLinesAdd: { cart: ShopifyCart; userErrors: CartUserError[]; warnings: CartWarning[] };
  }>(CART_LINES_ADD_MUTATION, { cartId, lines }, { cache: 'no-store' });

  return {
    cart: data.cartLinesAdd.cart,
    userErrors: data.cartLinesAdd.userErrors,
    warnings: data.cartLinesAdd.warnings ?? [],
  };
}

export async function updateCartLines(
  cartId: string,
  lines: { id: string; quantity: number }[],
): Promise<{ cart: ShopifyCart; userErrors: CartUserError[]; warnings: CartWarning[] }> {
  const data = await shopifyFetch<{
    cartLinesUpdate: { cart: ShopifyCart; userErrors: CartUserError[]; warnings: CartWarning[] };
  }>(CART_LINES_UPDATE_MUTATION, { cartId, lines }, { cache: 'no-store' });

  return {
    cart: data.cartLinesUpdate.cart,
    userErrors: data.cartLinesUpdate.userErrors,
    warnings: data.cartLinesUpdate.warnings ?? [],
  };
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[],
): Promise<{ cart: ShopifyCart; userErrors: CartUserError[] }> {
  const data = await shopifyFetch<{
    cartLinesRemove: { cart: ShopifyCart; userErrors: CartUserError[] };
  }>(CART_LINES_REMOVE_MUTATION, { cartId, lineIds }, { cache: 'no-store' });

  return {
    cart: data.cartLinesRemove.cart,
    userErrors: data.cartLinesRemove.userErrors,
  };
}

export async function updateCartBuyerIdentity(
  cartId: string,
  customerAccessToken: string,
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartBuyerIdentityUpdate: { cart: ShopifyCart; userErrors: CartUserError[] };
  }>(CART_BUYER_IDENTITY_UPDATE_MUTATION, {
    cartId,
    buyerIdentity: { customerAccessToken },
  }, { cache: 'no-store' });

  if (data.cartBuyerIdentityUpdate.userErrors.length > 0) {
    throw new Error(data.cartBuyerIdentityUpdate.userErrors.map((e) => e.message).join(', '));
  }
  return data.cartBuyerIdentityUpdate.cart;
}
