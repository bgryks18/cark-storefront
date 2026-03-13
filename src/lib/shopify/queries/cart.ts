import { CART_FRAGMENT } from '../fragments';
import { shopifyFetch } from '../client';

import type { CartLineInput, ShopifyCart } from '../types';

// ─── Mutations & Queries ──────────────────────────────────────────────────────

const CART_CREATE_MUTATION = `#graphql
  mutation CartCreate($lines: [CartLineInput!], $buyerIdentityInput: CartBuyerIdentityInput) {
    cartCreate(input: { lines: $lines, buyerIdentity: $buyerIdentityInput }) {
      cart { ...CartFields }
      userErrors { field message }
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
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_UPDATE_MUTATION = `#graphql
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_REMOVE_MUTATION = `#graphql
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_BUYER_IDENTITY_UPDATE_MUTATION = `#graphql
  mutation CartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`;

// ─── Yardımcı: userErrors kontrolü ───────────────────────────────────────────

function throwIfErrors(userErrors: { field: string[] | null; message: string }[], context: string) {
  if (userErrors.length > 0) {
    throw new Error(`[Cart ${context}] ${userErrors.map((e) => e.message).join(', ')}`);
  }
}

// ─── Fonksiyonlar ─────────────────────────────────────────────────────────────

export async function createCart(lines: CartLineInput[] = []): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartCreate: { cart: ShopifyCart; userErrors: { field: string[] | null; message: string }[] };
  }>(CART_CREATE_MUTATION, { lines });

  throwIfErrors(data.cartCreate.userErrors, 'create');
  return data.cartCreate.cart;
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<{ cart: ShopifyCart | null }>(CART_QUERY, { cartId });
  return data.cart;
}

export async function addCartLines(
  cartId: string,
  lines: CartLineInput[],
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesAdd: { cart: ShopifyCart; userErrors: { field: string[] | null; message: string }[] };
  }>(CART_LINES_ADD_MUTATION, { cartId, lines });

  throwIfErrors(data.cartLinesAdd.userErrors, 'addLines');
  return data.cartLinesAdd.cart;
}

export async function updateCartLines(
  cartId: string,
  lines: { id: string; quantity: number }[],
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesUpdate: {
      cart: ShopifyCart;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(CART_LINES_UPDATE_MUTATION, { cartId, lines });

  throwIfErrors(data.cartLinesUpdate.userErrors, 'updateLines');
  return data.cartLinesUpdate.cart;
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[],
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesRemove: {
      cart: ShopifyCart;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(CART_LINES_REMOVE_MUTATION, { cartId, lineIds });

  throwIfErrors(data.cartLinesRemove.userErrors, 'removeLines');
  return data.cartLinesRemove.cart;
}

export async function updateCartBuyerIdentity(
  cartId: string,
  customerAccessToken: string,
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartBuyerIdentityUpdate: {
      cart: ShopifyCart;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(CART_BUYER_IDENTITY_UPDATE_MUTATION, {
    cartId,
    buyerIdentity: { customerAccessToken },
  });

  throwIfErrors(data.cartBuyerIdentityUpdate.userErrors, 'buyerIdentityUpdate');
  return data.cartBuyerIdentityUpdate.cart;
}
