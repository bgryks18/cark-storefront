'use client';

import { useEffect, useMemo, useState } from 'react';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Plus, ShieldCheck } from 'lucide-react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import * as yup from 'yup';

import { getAddressesAction } from '@/lib/actions/addressActions';
import { getCustomerProfileAction } from '@/lib/actions/getCustomerProfile';
import { COUNTRY_CODES } from '@/lib/countryCodes';
import type { ShippingRate } from '@/lib/shopify/admin';
import { formatMoney, formatPrice, getCartLines } from '@/lib/shopify/normalize';

import { useCart } from '@/hooks/useCart';

import { AddressFormModal } from '@/components/account/AddressFormModal';
import { AlertBox } from '@/components/ui/AlertBox';
import { Container } from '@/components/ui/Container';

interface ShippingRateWithDescription extends ShippingRate {
  description: string;
}

const baseSchema = yup.object({
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  email: yup.string().required().email(),
  phone: yup
    .string()
    .required()
    .matches(/^\+[1-9]\d{6,14}$/),
  address: yup.string().required(),
  city: yup.string().required(),
  zip: yup.string(),
});

type FormValues = yup.InferType<typeof baseSchema>;

const CARD_CLASS = 'rounded-2xl border border-card-border bg-card p-6';

function PhoneInput({
  value,
  onChange,
  onBlur,
  label,
  error,
}: {
  value?: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  label: string;
  error?: string;
}) {
  const defaultCountry = COUNTRY_CODES.find((c) => c.code === 'TR')!;
  const [dialCode, setDialCode] = useState(defaultCountry.dialCode);
  const [localNumber, setLocalNumber] = useState('');
  const hasError = !!error;

  // Parse existing value on mount
  useEffect(() => {
    if (value?.startsWith('+')) {
      const match = COUNTRY_CODES.find((c) => value.startsWith('+' + c.dialCode));
      if (match) {
        setDialCode(match.dialCode);
        setLocalNumber(value.slice(match.dialCode.length + 1));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDialChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newDial = e.target.value;
    setDialCode(newDial);
    onChange(`+${newDial}${localNumber}`);
  }

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    setLocalNumber(digits);
    onChange(`+${dialCode}${digits}`);
  }

  const borderClass = hasError
    ? 'border-error focus-within:border-error'
    : 'border-card-border focus-within:border-primary';

  return (
    <div>
      <div className={`flex overflow-hidden rounded-lg border transition-colors ${borderClass}`}>
        {/* Alan kodu seçici */}
        <select
          value={dialCode}
          onChange={handleDialChange}
          className="shrink-0 border-r border-card-border bg-transparent py-2 pl-3 pr-1 text-sm text-text-base focus:outline-none"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
              {c.flag} +{c.dialCode}
            </option>
          ))}
        </select>

        {/* Numara girişi — floating label */}
        <div className="relative flex-1">
          <input
            type="tel"
            value={localNumber}
            onChange={handleLocalChange}
            onBlur={onBlur}
            placeholder=" "
            className="peer h-14 w-full bg-transparent px-3 pb-2 pt-5 text-sm text-text-base focus:outline-none"
          />
          <label className="pointer-events-none absolute left-3 top-2 text-[11px] text-text-muted transition-all duration-150 peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-primary">
            {label}
          </label>
        </div>
      </div>

      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-error">
          <AlertCircle className="h-3 w-3 shrink-0 text-error" />
          {error}
        </p>
      )}
    </div>
  );
}

function FloatingInput({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const hasError = !!error;
  return (
    <div>
      <div className="relative">
        <input
          {...props}
          placeholder=" "
          className={[
            'peer h-14 w-full rounded-lg border bg-transparent px-3 pb-2 pt-5 text-sm text-text-base transition-colors focus:outline-none disabled:cursor-not-allowed disabled:bg-skeleton/40 disabled:text-text-muted',
            hasError
              ? 'border-error focus:border-error'
              : 'border-card-border focus:border-primary disabled:border-card-border',
          ].join(' ')}
        />
        <label className="pointer-events-none absolute left-3 top-2 text-[11px] text-text-muted transition-all duration-150 peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-primary">
          {label}
        </label>
      </div>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-error">
          <AlertCircle className="h-3 w-3 shrink-0 text-error" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const t = useTranslations('checkout.form');
  const tCart = useTranslations('cart');
  const { cart, cartId, isLoading: isCartLoading } = useCart();
  const lines = getCartLines(cart);

  const schema = useMemo(
    () =>
      yup.object({
        firstName: yup.string().required(t('validation.required')),
        lastName: yup.string().required(t('validation.required')),
        email: yup.string().required(t('validation.required')).email(t('validation.emailInvalid')),
        phone: yup
          .string()
          .required(t('validation.required'))
          .matches(/^\+[1-9]\d{6,14}$/, t('validation.phoneInvalid')),
        address: yup.string().required(t('validation.required')),
        city: yup.string().required(t('validation.required')),
        zip: yup.string(),
      }),
    [t],
  );

  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as unknown as Resolver<FormValues>,
    mode: 'onTouched',
  });

  const { data: customerProfile, isPending: customerProfilePending } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: getCustomerProfileAction,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const { data: addressData, isLoading: addressesLoading } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: getAddressesAction,
    enabled: isAuthenticated,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const savedAddresses = addressData?.addresses ?? [];
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  const sortedAddresses = useMemo(() => {
    if (!selectedAddressId) return savedAddresses;
    return [
      ...savedAddresses.filter((a) => a.id === selectedAddressId),
      ...savedAddresses.filter((a) => a.id !== selectedAddressId),
    ];
  }, [savedAddresses, selectedAddressId]);

  useEffect(() => {
    if (!addressData) return;
    const preselect = addressData.defaultAddressId ?? addressData.addresses[0]?.id ?? null;
    if (!preselect) return;
    setSelectedAddressId(preselect);
    const addr = addressData.addresses.find((a) => a.id === preselect);
    if (addr) {
      setValue('address', addr.address1 ?? '', { shouldValidate: true });
      setValue('city', addr.city ?? '', { shouldValidate: true });
      setValue('zip', addr.zip ?? '');
    }
  }, [addressData, setValue]);

  useEffect(() => {
    if (!customerProfile) return;
    if (customerProfile.firstName) setValue('firstName', customerProfile.firstName);
    if (customerProfile.lastName) setValue('lastName', customerProfile.lastName);
    if (customerProfile.email) setValue('email', customerProfile.email);
  }, [customerProfile, setValue]);

  const {
    data: ratesData,
    isPending: ratesLoading,
    isError: ratesError,
  } = useQuery({
    queryKey: ['shipping-options'],
    queryFn: async () => {
      const r = await fetch('/api/shipping-options');
      const json = (await r.json()) as { rates?: ShippingRateWithDescription[]; error?: string };
      if (!r.ok) throw new Error(json.error ?? 'Kargo seçenekleri alınamadı');
      return json.rates ?? [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const shippingRates = ratesData ?? [];

  const [mounted, setMounted] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ShippingRateWithDescription | null>(null);

  const paytrMutation = useMutation({
    mutationFn: async (payload: FormValues & { cartId: string; shippingTitle: string }) => {
      let res: Response;
      try {
        res = await fetch('/api/paytr/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        throw new Error(t('errors.connectionError'));
      }
      const data = (await res.json()) as { paytrUrl?: string; error?: string };
      if (!res.ok || !data.paytrUrl) throw new Error(data.error ?? t('errors.paymentFailed'));
      return data.paytrUrl;
    },
    onSuccess: (paytrUrl) => {
      window.location.href = paytrUrl;
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (shippingRates.length > 0 && !selectedRate) {
      setSelectedRate(shippingRates[0]!);
    }
  }, [shippingRates, selectedRate]);

  useEffect(() => {
    if (mounted && !isCartLoading && lines.length === 0) {
      router.replace('/cart');
    }
  }, [mounted, isCartLoading, lines.length, router]);

  if (
    !mounted ||
    isCartLoading ||
    (!cart && !!cartId) ||
    lines.length === 0 ||
    (isAuthenticated && customerProfilePending)
  ) {
    return (
      <section className="py-8 sm:py-12">
        <Container>
          <div className="mb-8 h-8 w-32 animate-pulse rounded-lg bg-skeleton" />
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-skeleton" />
              ))}
            </div>
            <div className="h-80 animate-pulse rounded-2xl bg-skeleton" />
          </div>
        </Container>
      </section>
    );
  }

  const currencyCode = cart?.cost.totalAmount.currencyCode ?? 'TRY';
  const subtotalTL = parseFloat(cart?.cost.totalAmount.amount ?? '0');
  const totalTL = subtotalTL + (selectedRate?.price ?? 0);

  function formatTL(amount: number) {
    return formatPrice(amount, currencyCode, 'tr-TR');
  }

  function onSubmit(values: FormValues) {
    if (!cartId || !selectedRate) return;
    paytrMutation.mutate({ cartId, ...values, shippingTitle: selectedRate.title });
  }

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <h1 className="mb-8 text-2xl font-bold text-black-dark sm:text-3xl">{t('title')}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* ─── Sol: Form ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">
            {/* İletişim */}
            <div className={CARD_CLASS}>
              <h2 className="mb-4 text-base font-semibold text-text-base">{t('contact')}</h2>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <FloatingInput
                    {...register('firstName')}
                    label={`${t('firstName')} *`}
                    error={errors.firstName?.message}
                    disabled={isAuthenticated}
                  />
                  <FloatingInput
                    {...register('lastName')}
                    label={`${t('lastName')} *`}
                    error={errors.lastName?.message}
                    disabled={isAuthenticated}
                  />
                </div>
                <FloatingInput
                  {...register('email')}
                  type="email"
                  label={`${t('email')} *`}
                  error={errors.email?.message}
                  disabled={isAuthenticated}
                />
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      label={`${t('phone')} *`}
                      error={errors.phone?.message}
                    />
                  )}
                />
              </div>
            </div>

            {/* Teslimat adresi */}
            <div className={CARD_CLASS}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-base">{t('deliveryAddress')}</h2>
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-hover"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    {t('addNewAddress')}
                  </button>
                )}
              </div>
              <div className="grid gap-3">
                {isAuthenticated && addressesLoading && (
                  <div className="flex flex-col gap-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-skeleton" />
                    ))}
                  </div>
                )}
                {isAuthenticated ? (
                  sortedAddresses.length > 0 && (
                    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                      {sortedAddresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                            selectedAddressId === addr.id
                              ? 'border-primary bg-primary-hover'
                              : 'border-card-border hover:border-primary'
                          }`}
                        >
                          <input
                            type="radio"
                            name="savedAddress"
                            value={addr.id}
                            checked={selectedAddressId === addr.id}
                            onChange={() => {
                              setSelectedAddressId(addr.id);
                              setValue('address', addr.address1 ?? '', { shouldValidate: true });
                              setValue('city', addr.city ?? '', { shouldValidate: true });
                              setValue('zip', addr.zip ?? '');
                            }}
                            className="mt-0.5 accent-primary"
                          />
                          <div className="text-sm">
                            <p className="font-medium text-text-base">
                              {[addr.firstName, addr.lastName].filter(Boolean).join(' ')}
                            </p>
                            <p className="text-text-muted">{addr.address1}</p>
                            {addr.address2 && <p className="text-text-muted">{addr.address2}</p>}
                            <p className="text-text-muted">
                              {[addr.zip, addr.city].filter(Boolean).join(' ')}
                            </p>
                            {addr.phone && <p className="text-text-muted">{addr.phone}</p>}
                          </div>
                        </label>
                      ))}
                    </div>
                  )
                ) : (
                  <>
                    <FloatingInput
                      {...register('address')}
                      label={`${t('address')} *`}
                      error={errors.address?.message}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FloatingInput
                        {...register('city')}
                        label={`${t('city')} *`}
                        error={errors.city?.message}
                      />
                      <FloatingInput
                        {...register('zip')}
                        label={t('zip')}
                        error={errors.zip?.message}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Kargo yöntemi */}
            <div className={CARD_CLASS}>
              <h2 className="mb-4 text-base font-semibold text-text-base">{t('shippingMethod')}</h2>
              {ratesError ? (
                <p className="text-sm text-error">{t('shippingLoadError')}</p>
              ) : ratesLoading || shippingRates.length === 0 ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-skeleton" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {shippingRates.map((rate) => (
                    <label
                      key={rate.title}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors ${
                        selectedRate?.title === rate.title
                          ? 'border-primary bg-primary-hover'
                          : 'border-card-border hover:border-primary'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={rate.title}
                          checked={selectedRate?.title === rate.title}
                          onChange={() => setSelectedRate(rate)}
                          className="accent-primary"
                        />
                        <div>
                          <p className="text-sm font-medium text-text-base">{rate.title}</p>
                          {rate.description && (
                            <p className="text-xs text-text-muted">{rate.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-text-base">
                        {formatTL(rate.price)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── Sağ: Sipariş özeti + buton ───────────────────────────── */}
          <div className="self-start lg:sticky lg:top-28">
            <div className={CARD_CLASS}>
              <h2 className="mb-4 text-base font-semibold text-text-base">
                {tCart('summary.title')}
              </h2>

              {/* Ürün listesi */}
              <div className="mb-4 flex flex-col gap-2">
                {lines.map((line) => (
                  <div key={line.id} className="flex items-start justify-between gap-2 text-sm">
                    <span className="text-text-muted">
                      {line.merchandise.product.title}
                      {line.merchandise.title !== 'Default Title' && (
                        <span className="block text-xs">{line.merchandise.title}</span>
                      )}
                      <span className="ml-1">× {line.quantity}</span>
                    </span>
                    <span className="shrink-0 font-medium text-text-base">
                      {formatMoney(line.cost.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Fiyat özeti */}
              <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">{tCart('summary.subtotal')}</span>
                  <span className="font-medium text-text-base">{formatTL(subtotalTL)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">{t('shipping')}</span>
                  <span className="font-medium text-text-base">
                    {selectedRate ? formatTL(selectedRate.price) : '—'}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border pt-3 text-base">
                  <span className="font-semibold text-text-base">{tCart('summary.total')}</span>
                  <span className="font-bold text-primary">{formatTL(totalTL)}</span>
                </div>
              </div>

              {paytrMutation.error && (
                <AlertBox className="mt-4">{paytrMutation.error.message}</AlertBox>
              )}

              <button
                type="submit"
                disabled={
                  paytrMutation.isPending ||
                  !selectedRate ||
                  (isAuthenticated && (addressesLoading || customerProfilePending))
                }
                className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-primary text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-80"
              >
                {paytrMutation.isPending ? t('submitting') : t('submit')}
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-text-muted">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{t('securePayment')}</span>
              </div>
            </div>
          </div>
        </form>
      </Container>

      {showAddModal && (
        <AddressFormModal
          onClose={() => setShowAddModal(false)}
          onSuccess={async () => {
            await queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
            setShowAddModal(false);
          }}
        />
      )}
    </section>
  );
}
