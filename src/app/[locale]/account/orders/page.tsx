'use client';

import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';

import { getOrdersAction } from '@/lib/actions/order';
import { formatMoney } from '@/lib/shopify/normalize';
import { formatDateShort } from '@/lib/utils/date';

import { AccountLoginRequired } from '@/components/account/AccountLoginRequired';
import { Container } from '@/components/ui/Container';

function OrderRowSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4 px-6 py-4">
      <div className="h-4 w-16 animate-pulse rounded bg-skeleton" />
      <div className="h-4 w-24 animate-pulse rounded bg-skeleton" />
      <div className="h-4 w-20 animate-pulse rounded bg-skeleton" />
      <div className="ml-auto h-4 w-16 animate-pulse rounded bg-skeleton" />
    </div>
  );
}

export default function OrdersPage() {
  const t = useTranslations('account');
  const locale = useLocale();
  const { status } = useSession();

  const {
    data: orders,
    isLoading: isOrdersLoading,
    isError,
  } = useQuery({
    queryKey: ['customer-orders'],
    queryFn: getOrdersAction,
    enabled: status === 'authenticated',
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  if (status === 'unauthenticated') {
    return <AccountLoginRequired />;
  }

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <div className="mb-8 flex items-center gap-2 text-sm">
          <Link href="/account" className="text-text-muted hover:text-primary">
            {t('title')}
          </Link>
          <span className="text-text-muted">/</span>
          <h1 className="text-2xl font-bold text-black-dark">{t('orders')}</h1>
        </div>

        {status === 'loading' || isOrdersLoading ? (
          <div className="overflow-hidden rounded-2xl border border-card-border bg-card">
            <div className="grid grid-cols-4 gap-4 border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <span>{t('orderNumber')}</span>
              <span>{t('orderDate')}</span>
              <span>{t('orderStatus')}</span>
              <span className="text-right">{t('orderTotal')}</span>
            </div>
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <OrderRowSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : isError || orders == null ? (
          <p className="text-sm text-error-text">{t('errors.loadFailed')}</p>
        ) : orders!.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Package className="h-16 w-16 text-text-muted" strokeWidth={1.25} />
            <p className="text-text-muted">{t('noOrders')}</p>
            <Link
              href="/collections"
              className="inline-flex h-11 items-center rounded-xl bg-primary px-8 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              {t('startShopping')}
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-card-border bg-card">
            <div className="grid grid-cols-4 gap-4 border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <span>{t('orderNumber')}</span>
              <span>{t('orderDate')}</span>
              <span>{t('orderStatus')}</span>
              <span className="text-right">{t('orderTotal')}</span>
            </div>
            <div className="divide-y divide-border">
              {orders!.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${encodeURIComponent(btoa(order.id))}`}
                  className="grid grid-cols-4 gap-4 px-6 py-4 text-sm transition-colors hover:bg-primary-hover"
                >
                  <span className="font-medium text-primary">{order.name}</span>
                  <span className="text-text-muted">
                    {formatDateShort(order.processedAt, locale)}
                  </span>
                  <span className="capitalize text-text-base">
                    {order.financialStatus.toLowerCase()}
                  </span>
                  <span className="text-right font-semibold text-text-base">
                    {formatMoney(order.totalPrice)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
