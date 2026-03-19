'use client';

import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';

import {
  addCartLines,
  createCart,
  getCart,
  removeCartLines,
  updateCartLines,
} from '@/lib/shopify/queries/cart';
import type { CartUserError } from '@/lib/shopify/queries/cart';
import type { CartLineInput } from '@/lib/shopify/types';

import { cartIdAtom } from '@/store/cartAtom';

export function useCart() {
  const [cartId, setCartId] = useAtom(cartIdAtom);
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ['cart', cartId],
    queryFn: async () => {
      const cart = await getCart(cartId!);
      if (!cart) {
        // Shopify'da sepet silinmiş ya da geçersiz
        setCartId(null);
        return null;
      }
      return cart;
    },
    enabled: !!cartId,
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationKey: ['cart', 'add'],
    mutationFn: async (lines: CartLineInput | CartLineInput[]) => {
      const lineArray = Array.isArray(lines) ? lines : [lines];
      if (cartId) {
        return addCartLines(cartId, lineArray);
      }
      // createCart throws on error (cart oluşturulamadı = kritik hata)
      const cart = await createCart(lineArray);
      return { cart, userErrors: [] as CartUserError[], warnings: [] };
    },
    onSuccess: ({ cart }) => {
      setCartId(cart.id);
      queryClient.setQueryData(['cart', cart.id], cart);
    },
  });

  const removeMutation = useMutation({
    mutationKey: ['cart', 'remove'],
    mutationFn: async (lineIds: string | string[]) => {
      if (!cartId) throw new Error('No cart');
      const ids = Array.isArray(lineIds) ? lineIds : [lineIds];
      return removeCartLines(cartId, ids);
    },
    onSuccess: ({ cart }) => {
      queryClient.setQueryData(['cart', cartId], cart);
    },
  });

  const updateMutation = useMutation({
    mutationKey: ['cart', 'update'],
    mutationFn: async ({ lineId, quantity }: { lineId: string; quantity: number }) => {
      if (!cartId) throw new Error('No cart');
      return updateCartLines(cartId, [{ id: lineId, quantity }]);
    },
    onSuccess: ({ cart }) => {
      queryClient.setQueryData(['cart', cartId], cart);
    },
  });

  const cart = cartQuery.data ?? null;
  const isAdding = useMutationState({ filters: { mutationKey: ['cart', 'add'], status: 'pending' } }).length > 0;
  const isRemoving = useMutationState({ filters: { mutationKey: ['cart', 'remove'], status: 'pending' } }).length > 0;
  const isUpdating = useMutationState({ filters: { mutationKey: ['cart', 'update'], status: 'pending' } }).length > 0;
  const isLoading = cartQuery.isLoading || isAdding || isRemoving || isUpdating;

  return {
    cart,
    cartId,
    itemCount: cart?.lines.edges.length ?? 0,
    isLoading,
    isAdding,
    isRemoving,
    isUpdating,
    isFetching: cartQuery.isFetching,
    addToCart: (lines: CartLineInput | CartLineInput[]) => addMutation.mutateAsync(lines),
    removeFromCart: (lineIds: string | string[]) => removeMutation.mutateAsync(lineIds),
    updateQuantity: (lineId: string, quantity: number) =>
      updateMutation.mutateAsync({ lineId, quantity }),
    refreshCart: () => cartQuery.refetch(),
  };
}
