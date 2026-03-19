import { atomWithStorage } from 'jotai/utils';

// Sepet ID'si — localStorage'da kalıcı
export const cartIdAtom = atomWithStorage<string | null>('cark-cart-id', null);
