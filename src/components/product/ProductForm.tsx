'use client';

import { useState } from 'react';
import { Check, Loader, Minus, Plus, ShoppingCart } from 'lucide-react';

import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils/cn';
import { formatMoney } from '@/lib/shopify/normalize';
import type { MoneyV2, ProductOption, ProductVariant } from '@/lib/shopify/types';

interface ProductFormProps {
  options: ProductOption[];
  variants: ProductVariant[];
  minPrice: MoneyV2;
  availableForSale: boolean;
  addToCartLabel: string;
  outOfStockLabel: string;
  selectVariantLabel: string;
  quantityLabel: string;
}

export function ProductForm({
  options,
  variants,
  minPrice,
  availableForSale,
  addToCartLabel,
  outOfStockLabel,
  selectVariantLabel,
  quantityLabel,
}: ProductFormProps) {
  const { addToCart } = useCart();

  const hasRealOptions = !(options.length === 1 && options[0].values.length === 1 && options[0].values[0] === 'Default Title');

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(options.map((o) => [o.name, o.values[0]])),
  );
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState<'idle' | 'loading' | 'added'>('idle');

  const selectedVariant = variants.find((v) =>
    v.selectedOptions.every((so) => selectedOptions[so.name] === so.value),
  );

  const price = selectedVariant?.price ?? minPrice;
  const compareAtPrice = selectedVariant?.compareAtPrice ?? null;
  const isAvailable = availableForSale && (selectedVariant?.availableForSale ?? true);
  const isOnSale = compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price.amount);

  function selectOption(name: string, value: string) {
    setSelectedOptions((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddToCart() {
    if (!selectedVariant || !isAvailable) return;

    setState('loading');
    try {
      await addToCart({ merchandiseId: selectedVariant.id, quantity });
      setState('added');
      setQuantity(1);
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('idle');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Fiyat */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-primary">
          {formatMoney(price)}
        </span>
        {isOnSale && (
          <span className="text-lg text-text-muted line-through">
            {formatMoney(compareAtPrice!)}
          </span>
        )}
      </div>

      {/* Varyant seçenekleri */}
      {hasRealOptions && options.map((option) => (
        <div key={option.id}>
          <p className="mb-2 text-sm font-medium text-text-base">
            {option.name}
            <span className="ml-1.5 font-normal text-text-muted">
              — {selectedOptions[option.name]}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selectedOptions[option.name] === value;
              const matchingVariant = variants.find((v) =>
                v.selectedOptions.some((so) => so.name === option.name && so.value === value) &&
                v.selectedOptions.every((so) =>
                  so.name === option.name ? so.value === value : selectedOptions[so.name] === so.value,
                ),
              );
              const isUnavailable = matchingVariant && !matchingVariant.availableForSale;

              return (
                <button
                  key={value}
                  onClick={() => selectOption(option.name, value)}
                  disabled={!!isUnavailable}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    'disabled:cursor-not-allowed disabled:opacity-40',
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-card-border bg-card text-text-base hover:border-primary hover:text-primary',
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Miktar */}
      <div>
        <p className="mb-2 text-sm font-medium text-text-base">{quantityLabel}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-card-border bg-card text-text-base transition-colors hover:border-primary hover:text-primary"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-base font-semibold text-text-base">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-card-border bg-card text-text-base transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sepete ekle butonu */}
      <button
        onClick={handleAddToCart}
        disabled={!isAvailable || state === 'loading'}
        className={cn(
          'flex h-12 items-center justify-center gap-2 rounded-xl px-8 text-base font-semibold transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          state === 'added'
            ? 'bg-green text-white'
            : 'bg-primary text-white hover:bg-primary-dark',
          !isAvailable && 'bg-gray-dark text-white hover:bg-gray-dark',
        )}
      >
        {state === 'loading' && <Loader className="h-5 w-5 animate-spin" />}
        {state === 'added' && <Check className="h-5 w-5" />}
        {state === 'idle' && <ShoppingCart className="h-5 w-5" />}
        {!isAvailable ? outOfStockLabel : state === 'added' ? '✓' : addToCartLabel}
      </button>
    </div>
  );
}
