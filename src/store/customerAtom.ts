import { atom } from 'jotai';

import type { ShopifyCustomer } from '@/lib/shopify/types';

// Shopify müşteri verisi — NextAuth session'dan doldurulur
export const customerAtom = atom<ShopifyCustomer | null>(null);
