'use client';

import { useEffect, useRef, useState } from 'react';

import debounce from 'lodash/debounce';
import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CartErrorCode } from '@/lib/shopify/queries/cart';
import type { CartUserError } from '@/lib/shopify/queries/cart';
import type { ShopifyCart } from '@/lib/shopify/types';

import { useCartItem } from '@/hooks/useCartItem';
import { useModal } from '@/hooks/useModal';

interface QuantityCounterProps {
  lineId: string;
  quantity: number;
  maxQuantity?: number | null;
  onError?: (msg: string | null) => void;
}

export function QuantityCounter({ lineId, quantity, maxQuantity, onError }: QuantityCounterProps) {
  const t = useTranslations('cart');
  const { confirm } = useModal();
  const { removeFromCart, updateQuantity, isFetching } = useCartItem(lineId);

  const [localQty, setLocalQty] = useState(quantity);
  const [isAnimationLoading, setIsAnimationLoading] = useState(false);
  const [inputValue, setInputValue] = useState(String(quantity));
  const [serverMax, setServerMax] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateQuantityRef = useRef(updateQuantity);
  useEffect(() => {
    updateQuantityRef.current = updateQuantity;
  }, [updateQuantity]);

  // Must match `animation: loadBar Xs` in globals.css
  const ANIMATION_CYCLE_MS = 1000;
  const animStartRef = useRef<number>(-1); // -1 = bar not running
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showError(msg: string) {
    setErrorMsg(msg);
    onError?.(msg);
  }

  function clearError() {
    setErrorMsg(null);
    onError?.(null);
  }

  function startBar() {
    // Cancel any pending hide so the bar doesn't disappear mid-cycle
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    // Only record start time when bar wasn't already running
    if (animStartRef.current === -1) {
      animStartRef.current = performance.now();
    }
    setIsAnimationLoading(true);
  }

  function stopBar() {
    if (hideTimerRef.current !== null) return; // already scheduled
    const elapsed = (performance.now() - animStartRef.current) % ANIMATION_CYCLE_MS;
    const remaining = ANIMATION_CYCLE_MS - elapsed;
    hideTimerRef.current = setTimeout(() => {
      setIsAnimationLoading(false);
      animStartRef.current = -1;
      hideTimerRef.current = null;
    }, remaining);
  }

  const debouncedFn = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => {
    if (!isAnimationLoading) {
      setLocalQty(quantity);
      setInputValue(String(quantity));
    }
  }, [quantity, isAnimationLoading]);

  useEffect(() => {
    return () => {
      debouncedFn.current?.cancel();
      if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
    };
  }, []);

  function handleResult(
    updatedCart: ShopifyCart,
    userErrors: CartUserError[],
    requestedQty: number,
  ) {
    const line = updatedCart.lines.edges.find((e) => e.node.id === lineId);
    const actualQty = line?.node.quantity;

    // Shopify sessizce kısıtladıysa (userErrors boş olsa bile)
    if (actualQty != null && actualQty < requestedQty) {
      setServerMax(actualQty);
      setLocalQty(actualQty);
      setInputValue(String(actualQty));
    }

    if (userErrors.length > 0) {
      const err = userErrors[0];
      switch (err.code) {
        case CartErrorCode.MAXIMUM_EXCEEDED:
        case CartErrorCode.LESS_THAN:
        case CartErrorCode.MERCHANDISE_NOT_ENOUGH_STOCK:
          showError(t('errors.maxQuantity', { max: actualQty ?? effectiveMax ?? '' }));
          break;
        case CartErrorCode.MINIMUM_NOT_MET:
          showError(t('errors.minimumNotMet'));
          break;
        case CartErrorCode.INVALID_INCREMENT:
          showError(t('errors.invalidIncrement'));
          break;
        case CartErrorCode.MERCHANDISE_NOT_APPLICABLE:
        case CartErrorCode.INVALID_MERCHANDISE_LINE:
          showError(t('errors.productUnavailable'));
          break;
        case CartErrorCode.CART_TOO_LARGE:
          showError(t('errors.cartTooLarge'));
          break;
        case CartErrorCode.SERVICE_UNAVAILABLE:
          showError(t('errors.serviceUnavailable'));
          break;
        case CartErrorCode.VALIDATION_CUSTOM:
        default:
          showError(err.message);
      }
    } else if (actualQty != null && actualQty < requestedQty) {
      showError(t('errors.maxQuantity', { max: actualQty }));
    }
  }

  // Input path: fires immediately on blur
  async function sendImmediate(qty: number) {
    clearError();
    startBar();
    try {
      const { cart, userErrors } = await updateQuantityRef.current(qty);
      handleResult(cart, userErrors, qty);
    } catch {
      showError('Güncelleme başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      stopBar();
    }
  }

  // Button path: bar başlar hemen, istek debounce sonrası gider
  async function handleButtonChange(newQty: number) {
    if (newQty < 1) {
      confirm({
        title: t('removeConfirmTitle'),
        message: t('removeConfirmMessage'),
        confirmLabel: t('removeConfirmLabel'),
        variant: 'danger',
        action: async () => { await removeFromCart(); },
      });
      return;
    }
    if (effectiveMax != null && newQty > effectiveMax) return;
    clearError();
    setLocalQty(newQty);
    setInputValue(String(newQty));
    startBar();

    if (!debouncedFn.current) {
      debouncedFn.current = debounce(async (qty: number) => {
        try {
          const { cart, userErrors } = await updateQuantityRef.current(qty);
          handleResult(cart, userErrors, qty);
        } catch {
          showError('Güncelleme başarısız oldu. Lütfen tekrar deneyin.');
        } finally {
          stopBar();
          debouncedFn.current = null;
        }
      }, 1000);
    }

    debouncedFn.current(newQty);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (!/^\d*$/.test(raw)) return;
    setInputValue(raw);
  }

  async function handleInputBlur() {
    let parsed = parseInt(inputValue, 10);
    if (isNaN(parsed)) {
      setInputValue(String(localQty));
      return;
    }
    if (parsed === 0) {
      setInputValue(String(localQty));
      confirm({
        title: t('removeConfirmTitle'),
        message: t('removeConfirmMessage'),
        confirmLabel: t('removeConfirmLabel'),
        variant: 'danger',
        action: async () => { await removeFromCart(); },
      });
      return;
    }
    if (effectiveMax != null && parsed > effectiveMax) {
      parsed = effectiveMax;
      setInputValue(String(parsed));
    }
    if (parsed === localQty) return;
    debouncedFn.current?.cancel();
    debouncedFn.current = null;
    setLocalQty(parsed);
    sendImmediate(parsed);
  }

  const effectiveMax = (() => {
    const a = maxQuantity ?? Infinity;
    const b = serverMax ?? Infinity;
    const m = Math.min(a, b);
    return m === Infinity ? null : m;
  })();

  const atMax = effectiveMax != null && localQty >= effectiveMax;

  return (
    <div className="relative">
      <div
        className={`flex items-center overflow-hidden rounded-lg border bg-card transition-colors ${errorMsg ? 'border-error' : 'border-border'}`}
      >
        <button
          type="button"
          onClick={() => handleButtonChange(localQty - 1)}
          disabled={isFetching}
          className="flex h-8 w-8 cursor-pointer items-center justify-center text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <div className="h-4 w-px bg-border" />
        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          disabled={isFetching}
          className="h-8 w-10 bg-transparent text-center text-sm font-medium text-text-base focus:outline-none disabled:opacity-40"
        />
        <div className="h-4 w-px bg-border" />
        <button
          type="button"
          onClick={() => handleButtonChange(localQty + 1)}
          disabled={isFetching || atMax}
          className="flex h-8 w-8 cursor-pointer items-center justify-center text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {isAnimationLoading && (
        <div className="absolute left-0 -bottom-2 h-0.5 w-full overflow-hidden rounded-full">
          <div className="animate-load-bar h-full w-1/2 rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
}
