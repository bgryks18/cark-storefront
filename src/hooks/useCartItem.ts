'use client';

import { useMutationState } from '@tanstack/react-query';

import { useCart } from '@/hooks/useCart';

export function useCartItem(lineId: string) {
  const { removeFromCart, updateQuantity } = useCart();

  const isUpdatingThis =
    useMutationState({
      filters: {
        mutationKey: ['cart', 'update'],
        status: 'pending',
        predicate: (m) =>
          (m.state.variables as { lineId: string } | undefined)?.lineId === lineId,
      },
    }).length > 0;

  const isRemovingThis =
    useMutationState({
      filters: {
        mutationKey: ['cart', 'remove'],
        status: 'pending',
        predicate: (m) => {
          const vars = m.state.variables as string | string[] | undefined;
          return Array.isArray(vars) ? vars.includes(lineId) : vars === lineId;
        },
      },
    }).length > 0;

  return {
    isFetching: isUpdatingThis || isRemovingThis,
    removeFromCart: () => removeFromCart(lineId),
    updateQuantity: (qty: number) => updateQuantity(lineId, qty),
  };
}
