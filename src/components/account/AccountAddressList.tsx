'use client';

import { useCallback, useState } from 'react';

import { useTranslations } from 'next-intl';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus } from 'lucide-react';

import { getAddressesAction } from '@/lib/actions/addressActions';
import type { ShopifyAddress } from '@/lib/shopify/types';

import { AddressCard } from '@/components/account/AddressCard';
import { AddressFormModal } from '@/components/account/AddressFormModal';

function AddressSkeleton() {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4 animate-pulse">
      <div className="mb-3 h-4 w-16 rounded bg-skeleton" />
      <div className="space-y-2">
        <div className="h-3 w-32 rounded bg-skeleton" />
        <div className="h-3 w-48 rounded bg-skeleton" />
        <div className="h-3 w-24 rounded bg-skeleton" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-16 rounded-lg bg-skeleton" />
        <div className="h-6 w-14 rounded-lg bg-skeleton" />
      </div>
    </div>
  );
}

export function AccountAddressList() {
  const t = useTranslations('account.addresses');
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShopifyAddress | null>(null);

  const invalidateAddresses = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
  }, [queryClient]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: () => getAddressesAction(),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const openAdd = () => {
    setEditingAddress(null);
    setModalOpen(true);
  };

  const openEdit = useCallback((address: ShopifyAddress) => {
    setEditingAddress(address);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingAddress(null);
  }, []);

  const handleSuccess = useCallback(() => {
    closeModal();
    void queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
  }, [closeModal, queryClient]);

  const addresses = data?.addresses ?? [];
  const defaultAddressId = data?.defaultAddressId ?? null;

  const sorted = [...addresses].sort((a, b) => {
    if (a.id === defaultAddressId) return -1;
    if (b.id === defaultAddressId) return 1;
    return 0;
  });

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        {isLoading ? (
          <div className="h-4 w-20 animate-pulse rounded bg-skeleton" />
        ) : (
          <p className="text-sm text-text-muted">
            {addresses.length === 0 ? t('empty') : t('count', { count: addresses.length })}
          </p>
        )}
        <button
          onClick={openAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-dark cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('add')}
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <AddressSkeleton />
          <AddressSkeleton />
        </div>
      ) : isError || data === null ? (
        <p className="text-sm text-error-text">{t('errors.loadFailed')}</p>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <MapPin className="h-10 w-10 text-text-muted" strokeWidth={1.25} />
          <p className="text-sm text-text-muted">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sorted.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              isDefault={address.id === defaultAddressId}
              onEdit={() => openEdit(address)}
              onMutated={invalidateAddresses}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <AddressFormModal
          address={editingAddress}
          isDefault={editingAddress?.id === defaultAddressId}
          onClose={closeModal}
          onSuccess={handleSuccess}
          isFetching={isFetching}
        />
      )}
    </>
  );
}
