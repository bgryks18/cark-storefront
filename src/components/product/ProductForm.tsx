'use client';

import { useEffect, useState } from 'react';
import { Check, Loader, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useCart } from '@/hooks/useCart';
import { CartErrorCode } from '@/lib/shopify/queries/cart';
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
  quantityLabel: string;
}

export function ProductForm({
  options,
  variants,
  minPrice,
  availableForSale,
  addToCartLabel,
  outOfStockLabel,
  quantityLabel,
}: ProductFormProps) {
  const { addToCart, cart } = useCart();
  const t = useTranslations('cart');

  const hasRealOptions = !(options.length === 1 && options[0].values.length === 1 && options[0].values[0] === 'Default Title');

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(options.map((o) => [o.name, o.values[0]])),
  );
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState<'idle' | 'loading' | 'added'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedVariant = variants.find((v) =>
    v.selectedOptions.every((so) => selectedOptions[so.name] === so.value),
  );

  const price = selectedVariant?.price ?? minPrice;
  const compareAtPrice = selectedVariant?.compareAtPrice ?? null;
  const isAvailable = availableForSale && (selectedVariant?.availableForSale ?? true);
  const isOnSale = compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price.amount);
  const effectiveMax = (() => {
    const stock = selectedVariant?.quantityAvailable ?? Infinity;
    const rule = selectedVariant?.quantityRule?.maximum ?? Infinity;
    const m = Math.min(stock, rule);
    return m === Infinity ? null : m;
  })();

  const existingQty = selectedVariant
    ? (cart?.lines.edges.find((e) => e.node.merchandise.id === selectedVariant.id)?.node.quantity ?? 0)
    : 0;

  const remainingMax = effectiveMax !== null ? Math.max(0, effectiveMax - existingQty) : null;
  const atMax = remainingMax !== null && quantity >= remainingMax;

  // Varyant değişince veya sepet değişince miktarı üst sınıra çek
  useEffect(() => {
    if (remainingMax !== null && quantity > remainingMax) {
      setQuantity(Math.max(1, remainingMax));
      setErrorMsg(remainingMax === 0
        ? t('errors.maxInCart', { max: effectiveMax ?? existingQty })
        : t('errors.maxQuantity', { max: remainingMax })
      );
    } else {
      setErrorMsg(null);
    }
  }, [selectedVariant?.id, existingQty]);

  function selectOption(name: string, value: string) {
    setSelectedOptions((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddToCart() {
    if (!selectedVariant || !isAvailable) return;

    setState('loading');
    setErrorMsg(null);
    try {
      const { cart, userErrors } = await addToCart({ merchandiseId: selectedVariant.id, quantity });

      // Shopify userErrors döndürmeden sessizce kısıtlamış olabilir
      const addedLine = cart.lines.edges.find(
        (e) => e.node.merchandise.id === selectedVariant.id,
      );
      const actualQty = addedLine?.node.quantity ?? null;
      if (actualQty !== null && actualQty < existingQty + quantity) {
        const added = actualQty - existingQty;
        setErrorMsg(added <= 0
          ? t('errors.maxInCart', { max: actualQty })
          : t('errors.maxQuantity', { max: added })
        );
        if (added > 0) {
          // Bir kısmı eklendi — butonu yeşile çevir, sonra idle'a dön
          setState('added');
          setQuantity(1);
          setTimeout(() => setState('idle'), 2000);
        } else {
          setState('idle');
        }
        return;
      }

      if (userErrors.length > 0) {
        const err = userErrors[0];
        switch (err.code) {
          case CartErrorCode.MAXIMUM_EXCEEDED:
          case CartErrorCode.MERCHANDISE_NOT_ENOUGH_STOCK:
            setErrorMsg(t('errors.maxQuantity', { max: effectiveMax ?? '' }));
            break;
          case CartErrorCode.MERCHANDISE_NOT_APPLICABLE:
          case CartErrorCode.INVALID_MERCHANDISE_LINE:
            setErrorMsg(t('errors.productUnavailable'));
            break;
          case CartErrorCode.CART_TOO_LARGE:
            setErrorMsg(t('errors.cartTooLarge'));
            break;
          case CartErrorCode.SERVICE_UNAVAILABLE:
            setErrorMsg(t('errors.serviceUnavailable'));
            break;
          default:
            setErrorMsg(err.message);
        }
        setState('idle');
        return;
      }
      setState('added');
      setQuantity(1);
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setErrorMsg(t('errors.updateFailed'));
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
            onClick={() => { setQuantity((q) => Math.max(1, q - 1)); setErrorMsg(null); }}
            disabled={quantity <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-card-border bg-card text-text-base transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-base font-semibold text-text-base">
            {quantity}
          </span>
          <button
            onClick={() => {
              if (atMax) {
                setErrorMsg(remainingMax === 0
                  ? t('errors.maxInCart', { max: effectiveMax ?? existingQty })
                  : t('errors.maxQuantity', { max: remainingMax })
                );
                return;
              }
              setQuantity((q) => q + 1);
            }}
            disabled={atMax}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-card-border bg-card text-text-base transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {errorMsg && (
          <p className="mt-2 text-xs text-error">{errorMsg}</p>
        )}
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
