'use client';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';

import {
  addCartLines,
  createCart,
  getCart,
  removeCartLines,
  updateCartLines,
} from '@/lib/shopify/queries/cart';
import type { CartLineInput } from '@/lib/shopify/types';
import { cartAtom, cartIdAtom, cartItemCountAtom, cartLoadingAtom } from '@/store/cartAtom';

export function useCart() {
  const [cartId, setCartId] = useAtom(cartIdAtom);
  const [cart, setCart] = useAtom(cartAtom);
  const itemCount = useAtomValue(cartItemCountAtom);
  const [isLoading, setIsLoading] = useAtom(cartLoadingAtom);

  async function addToCart(lines: CartLineInput | CartLineInput[]) {
    setIsLoading(true);
    try {
      const lineArray = Array.isArray(lines) ? lines : [lines];
      const updated = cartId
        ? await addCartLines(cartId, lineArray)
        : await createCart(lineArray);
      setCartId(updated.id);
      setCart(updated);
      return updated;
    } finally {
      setIsLoading(false);
    }
  }

  async function removeFromCart(lineIds: string | string[]) {
    if (!cartId) return;
    setIsLoading(true);
    try {
      const ids = Array.isArray(lineIds) ? lineIds : [lineIds];
      const updated = await removeCartLines(cartId, ids);
      setCart(updated);
      return updated;
    } finally {
      setIsLoading(false);
    }
  }

  async function updateQuantity(lineId: string, quantity: number) {
    if (!cartId) return;
    setIsLoading(true);
    try {
      const updated = await updateCartLines(cartId, [{ id: lineId, quantity }]);
      setCart(updated);
      return updated;
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshCart() {
    if (!cartId) return;
    setIsLoading(true);
    try {
      const updated = await getCart(cartId);
      if (updated) {
        setCart(updated);
      } else {
        // Sepet silinmiş veya geçersiz
        setCartId(null);
        setCart(null);
      }
      return updated;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    cart,
    cartId,
    itemCount,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    refreshCart,
  };
}
