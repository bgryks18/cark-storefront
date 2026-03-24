'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { saveAddressAction } from '@/lib/actions/addressActions';
import type { ShopifyAddress } from '@/lib/shopify/types';

import { useModalAnimation } from '@/hooks/useModalAnimation';

const inputClass =
  'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-base outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/25';

type FormValues = {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  zip: string;
  phone: string;
  makeDefault: boolean;
};

type Props = {
  address?: ShopifyAddress | null;
  isDefault?: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isFetching?: boolean;
};

export function AddressFormModal({ address, isDefault, onClose, onSuccess, isFetching }: Props) {
  const t = useTranslations('account.addresses');
  const { isVisible, handleClose } = useModalAnimation(onClose);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      firstName: address?.firstName ?? '',
      lastName: address?.lastName ?? '',
      address1: address?.address1 ?? '',
      address2: address?.address2 ?? '',
      city: address?.city ?? '',
      zip: address?.zip ?? '',
      phone: address?.phone ?? '',
      makeDefault: !!isDefault,
    },
  });

  const isBusy = isSaving || !!isFetching;
  const isEdit = !!address;

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    setError(null);

    const formData = new FormData();
    if (isEdit) formData.set('addressId', address.id);
    formData.set('firstName', values.firstName);
    formData.set('lastName', values.lastName);
    formData.set('address1', values.address1);
    formData.set('address2', values.address2);
    formData.set('city', values.city);
    formData.set('zip', values.zip);
    formData.set('phone', values.phone);
    if (values.makeDefault) formData.set('makeDefault', 'on');

    const result = await saveAddressAction(null, formData);
    setIsSaving(false);

    if (result?.ok) {
      onSuccess();
    } else {
      setError(result?.message ?? t('errors.saveFailed'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => handleClose()}
        aria-hidden
      />
      <div
        className={`relative w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-xl transition-all duration-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-base">
            {isEdit ? t('editTitle') : t('addTitle')}
          </h2>
          <button
            type="button"
            onClick={() => handleClose()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-primary-hover hover:text-primary"
            aria-label={t('close')}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="addr-firstName" className="text-xs font-medium text-text-muted">
                {t('fields.firstName')} <span className="text-error-text">*</span>
              </label>
              <input
                id="addr-firstName"
                type="text"
                maxLength={50}
                autoComplete="given-name"
                disabled={isBusy}
                className={inputClass}
                {...register('firstName', { required: true })}
              />
            </div>
            <div>
              <label htmlFor="addr-lastName" className="text-xs font-medium text-text-muted">
                {t('fields.lastName')} <span className="text-error-text">*</span>
              </label>
              <input
                id="addr-lastName"
                type="text"
                maxLength={50}
                autoComplete="family-name"
                disabled={isBusy}
                className={inputClass}
                {...register('lastName', { required: true })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="addr-address1" className="text-xs font-medium text-text-muted">
              {t('fields.address1')} <span className="text-error-text">*</span>
            </label>
            <input
              id="addr-address1"
              type="text"
              maxLength={255}
              autoComplete="address-line1"
              disabled={isBusy}
              className={inputClass}
              {...register('address1', { required: true })}
            />
          </div>

          <div>
            <label htmlFor="addr-address2" className="text-xs font-medium text-text-muted">
              {t('fields.address2')}
            </label>
            <input
              id="addr-address2"
              type="text"
              maxLength={255}
              autoComplete="address-line2"
              disabled={isBusy}
              className={inputClass}
              {...register('address2')}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="addr-city" className="text-xs font-medium text-text-muted">
                {t('fields.city')} <span className="text-error-text">*</span>
              </label>
              <input
                id="addr-city"
                type="text"
                maxLength={100}
                autoComplete="address-level2"
                disabled={isBusy}
                className={inputClass}
                {...register('city', { required: true })}
              />
            </div>
            <div>
              <label htmlFor="addr-zip" className="text-xs font-medium text-text-muted">
                {t('fields.zip')}
              </label>
              <input
                id="addr-zip"
                type="text"
                maxLength={20}
                autoComplete="postal-code"
                disabled={isBusy}
                className={inputClass}
                {...register('zip')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="addr-phone" className="text-xs font-medium text-text-muted">
              {t('fields.phone')}
            </label>
            <input
              id="addr-phone"
              type="tel"
              maxLength={30}
              autoComplete="tel"
              disabled={isBusy}
              className={inputClass}
              {...register('phone')}
            />
          </div>

          {!isDefault && (
            <label className="flex cursor-pointer items-center gap-2 pt-1">
              <input
                type="checkbox"
                disabled={isBusy}
                className="h-4 w-4 rounded border-border accent-primary"
                {...register('makeDefault')}
              />
              <span className="text-sm text-text-base">{t('fields.makeDefault')}</span>
            </label>
          )}

          {error && (
            <p className="text-sm text-error-text" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleClose()}
              disabled={isBusy}
              className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border text-sm font-medium text-text-base transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isBusy}
              aria-busy={isBusy}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
            >
              {isBusy ? (
                <span className="flex items-center gap-1.5" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-white"
                      style={{ animation: `navDot 1s ease-in-out ${i * 0.15}s infinite` }}
                    />
                  ))}
                </span>
              ) : (
                t('save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
