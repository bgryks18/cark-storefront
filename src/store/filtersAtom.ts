import { atom } from 'jotai';

export type CollectionSortKey =
  | 'MANUAL'
  | 'BEST_SELLING'
  | 'TITLE'
  | 'PRICE'
  | 'CREATED';

export interface CollectionFiltersState {
  sortKey: CollectionSortKey;
  reverse: boolean;
  activeFilters: Record<string, string[]>; // { vendor: ['Marka A'], tag: ['indirim'] }
}

export const filtersAtom = atom<CollectionFiltersState>({
  sortKey: 'MANUAL',
  reverse: false,
  activeFilters: {},
});

export const isFiltersPanelOpenAtom = atom<boolean>(false);
