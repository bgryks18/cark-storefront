import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import type { ShopifyCart } from '@/lib/shopify/types';

// Sepet ID'si — localStorage'da kalıcı
export const cartIdAtom = atomWithStorage<string | null>('cark-cart-id', null);

// Shopify'dan yüklenen tam sepet verisi — sadece in-memory
export const cartAtom = atom<ShopifyCart | null>(null);

// Derived: navbar badge için toplam ürün adedi
export const cartItemCountAtom = atom((get) => {
  const cart = get(cartAtom);
  return cart?.totalQuantity ?? 0;
});

// Derived: sepet yükleniyor mu?
export const cartLoadingAtom = atom<boolean>(false);
