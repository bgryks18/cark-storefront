import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Sepet ID'si — localStorage'da kalıcı
export const cartIdAtom = atomWithStorage<string | null>('cark-cart-id', null);

// Hangi cart line'ların animation loading gösterdiği — lineId → boolean
export const cartItemLoadingAtom = atom<Record<string, boolean>>({});
