'use client';

import { useEffect, useState } from 'react';

import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import { useMutation } from '@tanstack/react-query';
import { Package, Truck } from 'lucide-react';

import { trackOrder } from '@/lib/actions/order';
import type {
  AdminAddress,
  AdminFulfillment,
  AdminOrder,
  AdminOrderLineItem,
} from '@/lib/shopify/admin';
import { formatPrice } from '@/lib/shopify/normalize';
import { formatDate, formatDateTime } from '@/lib/utils/date';

import { AlertBox } from '@/components/ui/AlertBox';
import { Container } from '@/components/ui/Container';
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb';

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colorMap: Record<string, string> = {
    paid: 'bg-green/10 text-green-dark border-green/20',
    fulfilled: 'bg-green/10 text-green-dark border-green/20',
    delivered: 'bg-green/10 text-green-dark border-green/20',
    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    processing: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    authorized: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    partial: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    in_transit: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    unfulfilled: 'bg-surface text-text-muted border-border',
    refunded: 'bg-error-bg text-error-text border-error-border',
    voided: 'bg-error-bg text-error-text border-error-border',
    restocked: 'bg-error-bg text-error-text border-error-border',
    partially_refunded: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  };
  const colorClass = colorMap[status] ?? 'bg-surface text-text-muted border-border';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${colorClass}`}
    >
      {label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{children}</p>
  );
}

function formatAddressLines(addr: AdminAddress | null): string[] {
  if (!addr) return [];
  const lines: string[] = [];
  const name = [addr.first_name, addr.last_name].filter(Boolean).join(' ');
  if (name) lines.push(name);
  if (addr.address1) lines.push(addr.address1);
  if (addr.address2) lines.push(addr.address2);
  const city = [addr.city, addr.province, addr.zip].filter(Boolean).join(' ');
  if (city) lines.push(city);
  if (addr.country) lines.push(addr.country);
  if (addr.phone) lines.push(addr.phone);
  return lines;
}

function formatGateway(gateway: string | null, manualLabel: string): string {
  if (!gateway) return '';
  if (gateway === 'manual') return manualLabel;
  return gateway.charAt(0).toUpperCase() + gateway.slice(1);
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonLine({ w = 'w-1/2' }: { w?: string }) {
  return <div className={`h-3.5 animate-pulse rounded bg-skeleton ${w}`} />;
}

function OrderSkeleton() {
  return (
    <div className="mx-auto mt-2 max-w-4xl space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <SkeletonLine w="w-24" />
            <SkeletonLine w="w-40" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-skeleton" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-skeleton" />
          </div>
        </div>
      </div>

      {/* 2x2 grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Timeline */}
        <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6 lg:col-span-2">
          <SkeletonLine w="w-32 mb-5" />
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 pb-4">
              <div className="flex flex-col items-center">
                <div className="mt-0.5 h-3 w-3 animate-pulse rounded-full bg-skeleton" />
                {i < 2 && <div className="my-1 w-px flex-1 bg-skeleton" />}
              </div>
              <div className="space-y-1.5">
                <SkeletonLine w="w-28" />
                <SkeletonLine w="w-20" />
              </div>
            </div>
          ))}
        </div>

        {/* Products */}
        <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6 lg:col-span-2">
          <SkeletonLine w="w-20 mb-5" />
          <div className="flex gap-3">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-skeleton sm:h-20 sm:w-20" />
            <div className="flex-1 space-y-2 pt-1">
              <SkeletonLine w="w-3/4" />
              <SkeletonLine w="w-1/2" />
              <SkeletonLine w="w-1/3" />
            </div>
          </div>
          <div className="mt-5 space-y-2 border-t border-border pt-4">
            <SkeletonLine w="w-full" />
            <SkeletonLine w="w-full" />
            <SkeletonLine w="w-full" />
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
          <SkeletonLine w="w-32 mb-5" />
          <div className="space-y-4">
            <div className="space-y-1.5">
              <SkeletonLine w="w-16" />
              <SkeletonLine w="w-40" />
            </div>
            <div className="space-y-1.5">
              <SkeletonLine w="w-24" />
              <SkeletonLine w="w-32" />
              <SkeletonLine w="w-28" />
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
          <SkeletonLine w="w-16 mb-5" />
          <div className="space-y-1.5">
            <SkeletonLine w="w-24" />
            <SkeletonLine w="w-32" />
            <SkeletonLine w="w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface TimelineStep {
  label: string;
  date: string | null;
  active: boolean;
}

export function OrderTrackingClient() {
  const t = useTranslations('orderTracking');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [displayOrder, setDisplayOrder] = useState<AdminOrder | null>(null);

  const emailParam = searchParams.get('email') ?? '';
  const orderParam = searchParams.get('order') ?? '';

  const mutation = useMutation({
    mutationFn: ({ email, orderId }: { email: string; orderId: string }) =>
      trackOrder(email, orderId),
    onSuccess: (data) => setDisplayOrder(data as AdminOrder | null),
    onError: () => setDisplayOrder(null),
  });

  useEffect(() => {
    if (emailParam && orderParam) {
      mutation.mutate({ email: emailParam, orderId: orderParam });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = mutation.isPending || mutation.isIdle;
  const hasError = mutation.isError;
  const isNotFound = mutation.isSuccess && displayOrder === null;

  const order = displayOrder;
  const currency = order?.total_shipping_price_set.shop_money.currency_code ?? 'TRY';
  const fmtLocale = locale === 'tr' ? 'tr-TR' : 'en-US';
  const fp = (amount: string | number) => formatPrice(amount, currency, fmtLocale);

  const fulfillmentKey = (order?.fulfillment_status ?? 'unfulfilled') as
    | 'unfulfilled'
    | 'partial'
    | 'fulfilled'
    | 'restocked';

  const financialKey = (order?.financial_status ?? 'pending') as
    | 'pending'
    | 'authorized'
    | 'partially_paid'
    | 'paid'
    | 'partially_refunded'
    | 'refunded'
    | 'voided';

  const timelineSteps: TimelineStep[] = [];
  if (order) {
    timelineSteps.push({ label: t('timeline.confirmed'), date: order.created_at, active: false });
    for (const f of order.fulfillments) {
      timelineSteps.push({ label: t('timeline.shipped'), date: f.created_at, active: false });
      const ss = f.shipment_status;
      if (ss && ['in_transit', 'out_for_delivery', 'delivered'].includes(ss)) {
        timelineSteps.push({ label: t('timeline.inTransit'), date: null, active: false });
      }
      if (ss && ['out_for_delivery', 'delivered'].includes(ss)) {
        timelineSteps.push({ label: t('timeline.outForDelivery'), date: null, active: false });
      }
      if (ss === 'delivered') {
        timelineSteps.push({ label: t('timeline.delivered'), date: null, active: false });
      }
    }
    if (timelineSteps.length > 0) timelineSteps[timelineSteps.length - 1].active = true;
    timelineSteps.reverse();
  }

  const totalRefunded =
    order?.refunds
      .flatMap((r) => r.transactions)
      .filter((tx) => tx.status === 'success' && (tx.kind === 'refund' || tx.kind === 'void'))
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0) ?? 0;

  const totalQty = order?.line_items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  // Params eksikse yönlendirme mesajı
  if (!emailParam || !orderParam) {
    return (
      <section className="py-12 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl">
            <PageBreadcrumb crumbs={[]} title={t('title')} />
            <p className="-mt-4 mb-8 text-sm text-text-muted">{t('missingParams')}</p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <PageBreadcrumb crumbs={[]} title={t('title')} />

          {/* Loading */}
          {isLoading && <OrderSkeleton />}

          {/* Error */}
          {hasError && <AlertBox>{t('errorGeneric')}</AlertBox>}

          {/* Not found */}
          {isNotFound && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-card-border bg-card px-6 py-12 text-center">
              <Package className="h-12 w-12 text-text-muted" strokeWidth={1.25} />
              <p className="text-sm text-text-muted">{t('notFound')}</p>
            </div>
          )}

          {/* Order result */}
          {order && (
            <div className="space-y-4">
              {/* Header */}
              <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-black-dark">{order.name}</h2>
                    <p className="mt-0.5 text-sm text-text-muted">
                      {formatDateTime(order.created_at, locale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      status={order.financial_status}
                      label={t(`financialStatus.${financialKey}`)}
                    />
                    <StatusBadge
                      status={order.fulfillment_status ?? 'processing'}
                      label={t(`fulfillmentStatus.${fulfillmentKey}`)}
                    />
                  </div>
                </div>
              </div>

              {/* 2x2 grid */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Timeline */}
                <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6 lg:col-span-2">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
                    {t('shipmentTimeline')}
                  </h3>
                  {order.fulfillments.map((f: AdminFulfillment) =>
                    f.tracking_url ? (
                      <div
                        key={f.id}
                        className="mb-4 flex items-center justify-between rounded-xl border border-card-border bg-surface px-4 py-3"
                      >
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
                  <div>
                    {timelineSteps.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`mt-0.5 h-3 w-3 shrink-0 rounded-full border-2 ${step.active ? 'border-primary bg-primary' : 'border-border bg-surface'}`}
                          />
                          {i < timelineSteps.length - 1 && (
                            <div className="my-1 w-px flex-1 bg-border" />
                          )}
                        </div>
                        <div className={`pb-4 ${i === timelineSteps.length - 1 ? 'pb-0' : ''}`}>
                          <p
                            className={`text-sm font-medium ${step.active ? 'text-black-dark' : 'text-text-muted'}`}
                          >
                            {step.label}
                          </p>
                          {step.date && (
                            <p className="text-xs text-text-muted">
                              {formatDate(step.date, locale)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Products + price */}
                <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6 lg:col-span-2">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
                    {t('products')}
                  </h3>
                  <div className="space-y-4">
                    {order.line_items.map((item: AdminOrderLineItem, i: number) => (
                      <div key={i} className="flex gap-3">
                        <div className="relative shrink-0">
                          <div className="h-14 w-14 overflow-hidden rounded-xl border border-card-border bg-skeleton sm:h-16 sm:w-16">
                            {item.image?.src ? (
                              <Image
                                src={item.image.src}
                                alt={item.image.alt ?? item.title}
                                width={64}
                                height={64}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-skeleton">
                                <Package className="h-6 w-6 text-text-muted" strokeWidth={1.5} />
                              </div>
                            )}
                          </div>
                          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-dark text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col justify-center gap-0.5">
                          <p className="text-sm font-medium text-text-base">{item.title}</p>
                          {item.variant_title && (
                            <p className="text-xs text-text-muted">{item.variant_title}</p>
                          )}
                          <p className="text-xs text-text-muted">
                            {t('unitPrice')}: {fp(item.price)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-sm font-semibold text-text-base">
                            {fp(parseFloat(item.price) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-2 border-t border-border pt-4">
                    <div className="flex justify-between text-sm text-text-muted">
                      <span>
                        {t('subtotal')} · {totalQty} {t('products').toLowerCase()}
                      </span>
                      <span>{fp(order.subtotal_price)}</span>
                    </div>
                    {parseFloat(order.total_discounts) > 0 && (
                      <div className="flex justify-between text-sm text-green-dark">
                        <span>{t('discounts')}</span>
                        <span>-{fp(order.total_discounts)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-text-muted">
                      <span>{t('shipping')}</span>
                      <span>{fp(order.total_shipping_price_set.shop_money.amount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-text-base">
                      <span>{t('total')}</span>
                      <span>{fp(order.total_price)}</span>
                    </div>
                    {totalRefunded > 0 && (
                      <div className="flex justify-between text-sm text-error-text">
                        <span>{t('refundedAmount')}</span>
                        <span>-{fp(totalRefunded)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact + shipping address */}
                <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
                  <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-text-muted">
                    {t('orderInfo')}
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <SectionLabel>{t('contactInfo')}</SectionLabel>
                      <p className="text-sm text-text-base">{order.email}</p>
                    </div>
                    {order.shipping_address && (
                      <div>
                        <SectionLabel>{t('shippingAddress')}</SectionLabel>
                        {formatAddressLines(order.shipping_address).map((line, i) => (
                          <p key={i} className="text-sm text-text-base">
                            {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment + billing + shipping method */}
                <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
                  <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-text-muted">
                    &nbsp;
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <SectionLabel>{t('paymentMethod')}</SectionLabel>
                      <p className="text-sm font-medium text-text-base">
                        {formatGateway(order.payment_gateway, t('gatewayManual'))}
                      </p>
                      <p className="text-sm text-text-muted">
                        {fp(order.total_price)} {currency}
                      </p>
                      <p className="text-sm text-text-muted">
                        {formatDate(order.created_at, locale)}
                      </p>
                    </div>
                    {order.billing_address && (
                      <div>
                        <SectionLabel>{t('billingAddress')}</SectionLabel>
                        {formatAddressLines(order.billing_address).map((line, i) => (
                          <p key={i} className="text-sm text-text-base">
                            {line}
                          </p>
                        ))}
                      </div>
                    )}
                    {order.shipping_lines.length > 0 && (
                      <div>
                        <SectionLabel>{t('shippingMethod')}</SectionLabel>
                        <p className="text-sm text-text-base">{order.shipping_lines[0].title}</p>
                      </div>
                    )}
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
