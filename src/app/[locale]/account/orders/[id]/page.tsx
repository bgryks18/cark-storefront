'use client';

import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useParams } from 'next/navigation';

import { Link } from '@/i18n/navigation';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';

import { getOrderDetailAction } from '@/lib/actions/order';
import { formatMoney } from '@/lib/shopify/normalize';
import { formatDate } from '@/lib/utils/date';

import { AccountLoginRequired } from '@/components/account/AccountLoginRequired';
import { Container } from '@/components/ui/Container';
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb';

function ItemRowSkeleton() {
  return (
    <div className="flex gap-4 py-4">
      <div className="h-16 w-16 shrink-0 animate-pulse rounded-lg bg-skeleton" />
      <div className="flex flex-1 flex-col justify-center gap-2">
        <div className="h-3.5 w-48 animate-pulse rounded bg-skeleton" />
        <div className="h-3 w-24 animate-pulse rounded bg-skeleton" />
        <div className="h-3 w-10 animate-pulse rounded bg-skeleton" />
      </div>
      <div className="h-4 w-16 shrink-0 animate-pulse self-start rounded bg-skeleton" />
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="mb-1 h-4 w-28 animate-pulse rounded bg-skeleton" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-3 w-full animate-pulse rounded bg-skeleton" />
      ))}
      <div className="h-3 w-28 animate-pulse rounded bg-skeleton" />
      <div className="h-4 w-full animate-pulse rounded bg-skeleton" />
    </div>
  );
}

export default function OrderDetailPage() {
  const t = useTranslations('account');
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const { status, data: session } = useSession();

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => getOrderDetailAction(id),
    enabled: status === 'authenticated',
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  if (status === 'unauthenticated') {
    return <AccountLoginRequired />;
  }

  const isPageLoading = status === 'loading' || isLoading;

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <PageBreadcrumb
          crumbs={[
            { label: t('title'), href: '/account' },
            { label: t('orders'), href: '/account/orders' },
          ]}
          title={isPageLoading ? '…' : (order?.name ?? '—')}
        />

        {isError || (order === null && !isPageLoading) ? (
          <p className="text-sm text-error-text">{t('errors.loadFailed')}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <div className="min-w-0 rounded-2xl border border-card-border bg-card p-6">
              <h2 className="mb-4 text-base font-semibold text-text-base">{t('orderItems')}</h2>
              {isPageLoading ? (
                <div className="flex flex-col divide-y divide-border">
                  <ItemRowSkeleton />
                  <ItemRowSkeleton />
                  <ItemRowSkeleton />
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {order?.lineItems.map((item, i) => (
                    <div key={i} className="flex gap-4 py-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-skeleton">
                        {item.variant?.image ? (
                          <Image
                            src={item.variant.image.url}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-6 w-6 text-text-muted" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                        <p className="text-sm font-medium text-text-base">{item.title}</p>
                        {item.variant && item.variant.title !== 'Default Title' && (
                          <p className="text-xs text-text-muted">{item.variant.title}</p>
                        )}
                        <p className="text-xs text-text-muted">x{item.quantity}</p>
                      </div>
                      {item.variant && (
                        <p className="shrink-0 text-sm font-semibold text-primary">
                          {formatMoney(item.variant.price)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="order-first min-w-0 h-fit rounded-2xl border border-card-border bg-card p-6 md:order-0">
              {isPageLoading ? (
                <SidebarSkeleton />
              ) : (
                order && (
                  <>
                    <h2 className="mb-4 text-base font-semibold text-text-base">{order.name}</h2>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted">{t('orderDate')}</span>
                        <span className="text-text-base">
                          {formatDate(order.processedAt, locale)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">{t('orderStatus')}</span>
                        <span className="text-text-base">
                          {t(
                            `financialStatus.${order.financialStatus.toLowerCase() as 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided'}`,
                          )}
                        </span>
                      </div>
                      {order.subtotalPrice && (
                        <div className="flex justify-between border-t border-border pt-2">
                          <span className="text-text-muted">{t('subtotal')}</span>
                          <span className="text-text-base">{formatMoney(order.subtotalPrice)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-text-muted">{t('shippingCost')}</span>
                        <span className="text-text-base">
                          {formatMoney(order.totalShippingPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-2">
                        <Link
                          href={`/order-tracking?order=${encodeURIComponent(order.id.split('/').pop() ?? '')}&email=${encodeURIComponent(session?.user?.email ?? '')}`}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          {t('trackOrder')}
                        </Link>
                      </div>
                      <div className="flex justify-between border-t border-border pt-2 text-base">
                        <span className="font-semibold text-text-base">{t('orderTotal')}</span>
                        <span className="font-bold text-primary">
                          {formatMoney(order.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
