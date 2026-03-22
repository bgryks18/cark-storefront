'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { Search, Package, CheckCircle, Truck, Loader2 } from 'lucide-react';

import type { AdminOrder, AdminOrderLineItem, AdminFulfillment } from '@/lib/shopify/admin';
import { Container } from '@/components/ui/Container';
import { ErrorBox } from '@/components/ui/ErrorBox';

async function fetchOrder(email: string, orderId: string): Promise<AdminOrder | null> {
  const res = await fetch('/api/order-tracking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, orderId }),
  });

  const data = (await res.json()) as { order: AdminOrder | null; error?: string };

  if (!res.ok || data.error) throw new Error(data.error ?? 'server_error');

  return data.order;
}

function formatPrice(amount: string, currency = 'TRY', locale: string) {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency,
  }).format(parseFloat(amount));
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colorMap: Record<string, string> = {
    paid: 'bg-green/10 text-green-dark border-green/20',
    fulfilled: 'bg-green/10 text-green-dark border-green/20',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    authorized: 'bg-blue-50 text-blue-700 border-blue-200',
    partial: 'bg-blue-50 text-blue-700 border-blue-200',
    unfulfilled: 'bg-gray-light text-gray-dark border-gray-light',
    refunded: 'bg-error-bg text-error-text border-error-border',
    voided: 'bg-error-bg text-error-text border-error-border',
    restocked: 'bg-error-bg text-error-text border-error-border',
  };

  const colorClass = colorMap[status] ?? 'bg-gray-light text-gray-dark border-gray-light';

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}

interface FormValues {
  email: string;
  orderId: string;
}

export function OrderTrackingClient() {
  const t = useTranslations('orderTracking');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [displayOrder, setDisplayOrder] = useState<AdminOrder | null>(null);

  const emailParam = searchParams.get('email') ?? '';
  const orderParam = searchParams.get('order') ?? '';

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { email: emailParam, orderId: orderParam },
  });

  const mutation = useMutation({
    mutationFn: ({ email, orderId }: FormValues) => fetchOrder(email, orderId),
    onSuccess: (data) => setDisplayOrder(data),
    onError: () => setDisplayOrder(null),
  });

  // Parametreler doluysa sayfa yüklendiğinde otomatik sorgula
  useEffect(() => {
    if (emailParam && orderParam) {
      mutation.mutate({ email: emailParam, orderId: orderParam });
    }
    // Sadece mount'ta çalışsın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const order = displayOrder;
  const shippingCurrency = order?.total_shipping_price_set.shop_money.currency_code ?? 'TRY';

  const fulfillmentKey = (order?.fulfillment_status ?? 'unfulfilled') as
    | 'unfulfilled' | 'partial' | 'fulfilled' | 'restocked';

  const financialKey = (order?.financial_status ?? 'pending') as
    | 'pending' | 'authorized' | 'partially_paid' | 'paid'
    | 'partially_refunded' | 'refunded' | 'voided';

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <div className="mx-auto max-w-xl">
          {/* Başlık */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold text-black-dark">{t('title')}</h1>
            <p className="text-sm text-text-muted">{t('description')}</p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="mb-8 rounded-2xl border border-card-border bg-card p-5 sm:p-6"
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-base">
                  {t('email')}
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  {...register('email', { required: true })}
                  className={`h-11 w-full rounded-xl border bg-surface px-4 text-sm text-text-base placeholder:text-text-muted focus:outline-none focus:ring-1 ${errors.email ? 'border-error focus:border-error focus:ring-error' : 'border-card-border focus:border-primary focus:ring-primary'}`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-base">
                  {t('orderId')}
                </label>
                <input
                  type="text"
                  placeholder={t('orderIdPlaceholder')}
                  {...register('orderId', { required: true })}
                  className={`h-11 w-full rounded-xl border bg-surface px-4 text-sm text-text-base placeholder:text-text-muted focus:outline-none focus:ring-1 ${errors.orderId ? 'border-error focus:border-error focus:ring-error' : 'border-card-border focus:border-primary focus:ring-primary'}`}
                />
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {mutation.isPending ? t('submitting') : t('submit')}
              </button>
            </div>
          </form>

          {/* Hata */}
          {mutation.isError && (
            <ErrorBox className="mb-6">{t('errorGeneric')}</ErrorBox>
          )}

          {/* Bulunamadı */}
          {mutation.isSuccess && order === null && (
            <div className={`flex flex-col items-center gap-3 rounded-2xl border border-card-border bg-card px-6 py-12 text-center transition-opacity duration-200 ${mutation.isPending ? 'pointer-events-none opacity-30' : 'opacity-100'}`}>
              <Package className="h-12 w-12 text-text-muted" strokeWidth={1.25} />
              <p className="text-sm text-text-muted">{t('notFound')}</p>
            </div>
          )}

          {/* Sipariş bulundu */}
          {order && (
            <div className={`space-y-4 transition-opacity duration-200 ${mutation.isPending ? 'pointer-events-none opacity-30' : 'opacity-100'}`}>
              {/* Özet kartı */}
              <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold text-black-dark">{order.id}</h2>
                  <span className="text-xs text-text-muted">
                    {new Date(order.created_at).toLocaleDateString(
                      locale === 'tr' ? 'tr-TR' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' },
                    )}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-muted">
                      <CheckCircle className="h-4 w-4" />
                      {t('paymentStatus')}
                    </span>
                    <StatusBadge
                      status={order.financial_status}
                      label={t(`financialStatus.${financialKey}`)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-muted">
                      <Truck className="h-4 w-4" />
                      {t('shippingStatus')}
                    </span>
                    <StatusBadge
                      status={order.fulfillment_status ?? 'unfulfilled'}
                      label={t(`fulfillmentStatus.${fulfillmentKey}`)}
                    />
                  </div>

                  {/* Kargo takip linki */}
                  {order.fulfillments?.map((f: AdminFulfillment, i: number) =>
                    f.tracking_url ? (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-card-border bg-surface px-4 py-3">
                        <span className="text-sm text-text-muted">
                          {f.tracking_company ?? t('shippingStatus')}
                          {f.tracking_number && (
                            <span className="ml-2 font-mono text-xs text-text-base">
                              {f.tracking_number}
                            </span>
                          )}
                        </span>
                        <a
                          href={f.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          {t('trackShipment')}
                        </a>
                      </div>
                    ) : null,
                  )}
                </div>
              </div>

              {/* Ürünler */}
              <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
                  {t('products')}
                </h3>
                <div className="divide-y divide-border">
                  {order.line_items.map((item: AdminOrderLineItem, i: number) => (
                    <div key={i} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-light text-xs font-semibold text-gray-dark">
                          {item.quantity}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-text-base">{item.title}</p>
                          {item.variant_title && (
                            <p className="text-xs text-text-muted">{item.variant_title}</p>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-text-base">
                        {formatPrice(
                          (parseFloat(item.price) * item.quantity).toFixed(2),
                          shippingCurrency,
                          locale,
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Fiyat özeti */}
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between text-sm text-text-muted">
                    <span>{t('subtotal')}</span>
                    <span>{formatPrice(order.subtotal_price, shippingCurrency, locale)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-text-muted">
                    <span>{t('shipping')}</span>
                    <span>
                      {formatPrice(
                        order.total_shipping_price_set.shop_money.amount,
                        shippingCurrency,
                        locale,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-text-base">
                    <span>{t('total')}</span>
                    <span>{formatPrice(order.total_price, shippingCurrency, locale)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
