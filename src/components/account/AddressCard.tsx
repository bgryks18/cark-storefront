'use client';

import { useTransition } from 'react';

import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { Pencil, Trash2 } from 'lucide-react';

import { deleteAddressAction, setDefaultAddressAction } from '@/lib/actions/addressActions';
import type { ShopifyAddress } from '@/lib/shopify/types';
import { useModal } from '@/hooks/useModal';

type Props = {
  address: ShopifyAddress;
  isDefault: boolean;
  onEdit: () => void;
  onMutated: () => void;
};

export function AddressCard({ address, isDefault, onEdit, onMutated }: Props) {
  const t = useTranslations('account.addresses');
  const router = useRouter();
  const { confirm } = useModal();
  const [settingDefault, startDefaultTransition] = useTransition();

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('deleteConfirm'),
      confirmLabel: t('deleteConfirmYes'),
      variant: 'danger',
      action: async () => {
        await deleteAddressAction(address.id);
        router.refresh();
        onMutated();
      },
    });
    if (!ok) return;
  };

  const handleSetDefault = () => {
    startDefaultTransition(async () => {
      await setDefaultAddressAction(address.id);
      router.refresh();
      onMutated();
    });
  };

  const nameLine = [address.firstName, address.lastName].filter(Boolean).join(' ');
  const cityZipLine = [address.zip, address.city].filter(Boolean).join(' ');

  return (
    <div className="relative rounded-xl border border-card-border bg-card p-4 flex flex-col gap-3 justify-between">
      {isDefault && (
        <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {t('default')}
        </span>
      )}

      <div className="space-y-0.5 text-sm text-text-base">
        {nameLine && <p className="font-medium">{nameLine}</p>}
        {address.address1 && <p>{address.address1}</p>}
        {address.address2 && <p>{address.address2}</p>}
        {cityZipLine && <p>{cityZipLine}</p>}
        {address.phone && (
          <p className="text-text-muted">
            {address.phone.replace(/(\+\d{2})(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!isDefault && (
          <button
            onClick={handleSetDefault}
            disabled={settingDefault}
            className="cursor-pointer text-xs text-primary hover:underline disabled:opacity-50"
          >
            {settingDefault ? '…' : t('makeDefault')}
          </button>
        )}

        <button
          onClick={onEdit}
          disabled={settingDefault}
          className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs text-text-muted transition-colors hover:bg-primary-hover hover:text-primary disabled:opacity-50"
        >
          <Pencil className="h-3 w-3" aria-hidden />
          {t('edit')}
        </button>

        <button
          onClick={handleDelete}
          disabled={settingDefault || isDefault}
          className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs text-text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Trash2 className="h-3 w-3" aria-hidden />
          {t('delete')}
        </button>
      </div>
    </div>
  );
}
