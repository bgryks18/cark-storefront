import type { CollectionVariantCard } from './types';

export function collectionVariantCardMatchesFilterInput(
  card: CollectionVariantCard,
  inputJson: string,
  groupType: string,
): boolean {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(inputJson) as Record<string, unknown>;
  } catch {
    return false;
  }

  const { variant, product } = card;

  if (parsed.variantOption && typeof parsed.variantOption === 'object') {
    const vo = parsed.variantOption as { name?: string; value?: string };
    if (!vo.name || vo.value === undefined) return false;
    return variant.selectedOptions.some((so) => so.name === vo.name && so.value === vo.value);
  }

  if (parsed.productMetafield && typeof parsed.productMetafield === 'object') {
    const pm = parsed.productMetafield as { namespace?: string; key?: string; value?: string };
    if (!pm.namespace || !pm.key || pm.value === undefined) return false;
    const mf = product.materialTypeMetafield;
    if (pm.namespace === 'custom' && pm.key === 'material_type' && mf?.value !== undefined) {
      return mf.value === pm.value;
    }
    return false;
  }

  if (groupType === 'PRICE_RANGE' && parsed.price && typeof parsed.price === 'object') {
    const pr = parsed.price as { min?: number; max?: number };
    const amt = parseFloat(variant.price.amount);
    if (Number.isNaN(amt)) return false;
    if (pr.min !== undefined && amt < pr.min) return false;
    if (pr.max !== undefined && amt > pr.max) return false;
    return true;
  }

  if (parsed.available === true) return variant.availableForSale;
  if (parsed.available === false) return !variant.availableForSale;

  return false;
}

export function countVariantCardsForFilterValue(
  cards: CollectionVariantCard[],
  inputJson: string,
  groupType: string,
): number {
  return cards.filter((c) => collectionVariantCardMatchesFilterInput(c, inputJson, groupType)).length;
}

/** URL’deki `filter` query değerinden grup tipi (Shopify `ProductFilter.type` ile uyumlu). */
export function inferFilterGroupTypeFromInput(inputJson: string): string {
  try {
    const p = JSON.parse(inputJson) as Record<string, unknown>;
    if (p.price && typeof p.price === 'object') return 'PRICE_RANGE';
    if (p.available === true || p.available === false) return 'BOOLEAN';
    return 'LIST';
  } catch {
    return 'LIST';
  }
}

/** Tüm aktif filtreler AND ile tek kartta sağlanıyor mu (grid ile aynı mantık). */
export function variantCardMatchesAllActiveFilters(
  card: CollectionVariantCard,
  activeFilterInputs: string[],
): boolean {
  if (activeFilterInputs.length === 0) return true;
  return activeFilterInputs.every((input) =>
    collectionVariantCardMatchesFilterInput(card, input, inferFilterGroupTypeFromInput(input)),
  );
}

/** Shopify ürün filtresinden sonra genişletilen kartları, varyant seviyesinde daraltır. */
export function filterVariantCardsByActiveFilters(
  cards: CollectionVariantCard[],
  activeFilterInputs: string[],
): CollectionVariantCard[] {
  if (activeFilterInputs.length === 0) return cards;
  return cards.filter((c) => variantCardMatchesAllActiveFilters(c, activeFilterInputs));
}

export function canComputeVariantFilterCount(inputJson: string, groupType: string): boolean {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(inputJson) as Record<string, unknown>;
  } catch {
    return false;
  }

  if (parsed.variantOption && typeof parsed.variantOption === 'object') return true;
  if (parsed.productMetafield && typeof parsed.productMetafield === 'object') return true;
  if (groupType === 'PRICE_RANGE' && parsed.price && typeof parsed.price === 'object') return true;
  if (parsed.available === true || parsed.available === false) return true;

  return false;
}
