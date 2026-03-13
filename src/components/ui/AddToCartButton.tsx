'use client';

import { useState } from 'react';

import { Check, Loader } from 'lucide-react';

import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils/cn';

function CartPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}

interface AddToCartButtonProps {
  variantId: string;
  availableForSale: boolean;
  className?: string;
}

export function AddToCartButton({ variantId, availableForSale, className }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [state, setState] = useState<'idle' | 'loading' | 'added'>('idle');

  if (!availableForSale) return null;

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setState('loading');

    try {
      await addToCart({ merchandiseId: variantId, quantity: 1 });
      setState('added');
      setTimeout(() => setState('idle'), 1500);
    } catch {
      setState('idle');
    }
  }

  const isIdle = state === 'idle';

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      aria-label="Sepete ekle"
      className={cn(
        'group flex h-9 items-center overflow-hidden rounded-full min-w-9 justify-center',
        'bg-background text-foreground shadow-md',
        'cursor-pointer',
        'disabled:pointer-events-none',
        'transition-[width] duration-100 ease-out',
        'hover:justify-start',
        'p-2',
        className,
      )}
    >
      {state === 'loading' && <Loader className="h-4 w-4 animate-spin" />}
      {state === 'added' && <Check className="h-4 w-4" />}
      {isIdle && (
        <>
          <CartPlusIcon className="h-4 w-4" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs transition-all duration-100 group-hover:max-w-xs group-hover:pl-1">
            Seç
          </span>
        </>
      )}
    </button>
  );
}
