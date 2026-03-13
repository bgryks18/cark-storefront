'use client';

import { useEffect } from 'react';

import { useCart } from '@/hooks/useCart';

// Layout'a yerleştirilen bu bileşen, uygulama açıldığında localStorage'daki
// cartId varsa sepeti Shopify'dan çeker ve cartAtom'u doldurur.
export function CartInitializer() {
  const { cartId, cart, refreshCart } = useCart();

  useEffect(() => {
    if (cartId && !cart) {
      refreshCart();
    }
  }, [cartId]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
