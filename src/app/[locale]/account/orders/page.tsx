'use client';

import { useMemo, useState } from 'react';

import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronLeft, ChevronRight, Package } from 'lucide-react';

import dayjs from 'dayjs';

import { getOrdersAction } from '@/lib/actions/order';
import { formatMoney } from '@/lib/shopify/normalize';
import { formatDateShort } from '@/lib/utils/date';

import { AccountLoginRequired } from '@/components/account/AccountLoginRequired';
import { Container } from '@/components/ui/Container';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  'paid',
  'pending',
  'authorized',
  'partially_paid',
  'partially_refunded',
  'refunded',
  'voided',
] as const;

type FinancialStatus = (typeof STATUS_OPTIONS)[number];

function OrderRowSkeleton() {
  return (
    <div className="px-4 py-3 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6 sm:py-4">
      {/* col 1: name + item count */}
      <div className="flex items-center justify-between sm:block">
        <div className="h-5 w-16 animate-pulse rounded bg-skeleton" />
        <div className="mt-1 hidden h-4 w-12 animate-pulse rounded bg-skeleton sm:block" />
        {/* mobile: total sağda */}
        <div className="h-5 w-16 animate-pulse rounded bg-skeleton sm:hidden" />
      </div>
      {/* col 2: date | col 3: statuses stacked | col 4: total */}
      <div className="mt-1 flex items-center justify-between sm:contents">
        <div className="h-5 w-24 animate-pulse rounded bg-skeleton sm:self-center" />
        <div className="sm:block">
          <div className="h-5 w-20 animate-pulse rounded bg-skeleton" />
          <div className="mt-1 hidden h-4 w-24 animate-pulse rounded bg-skeleton sm:block" />
        </div>
        <div className="hidden h-5 w-16 animate-pulse rounded bg-skeleton sm:block sm:self-center sm:justify-self-end" />
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const t = useTranslations('account');
  const locale = useLocale();
  const { status } = useSession();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FinancialStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const {
    data: orders,
    isLoading: isOrdersLoading,
    isError,
  } = useQuery({
    queryKey: ['customer-orders'],
    queryFn: getOrdersAction,
    enabled: status === 'authenticated',
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const filtered = useMemo(() => {
    if (!orders) return [];
    const from = dateFrom ? dayjs(dateFrom).startOf('day') : null;
    const to = dateTo ? dayjs(dateTo).endOf('day') : null;
    return orders.filter((order) => {
      const matchesSearch =
        search === '' || order.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || order.financialStatus.toLowerCase() === statusFilter;
      const orderDate = dayjs(order.processedAt);
      const matchesDate =
        (from === null || orderDate.isAfter(from) || orderDate.isSame(from)) &&
        (to === null || orderDate.isBefore(to) || orderDate.isSame(to));
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilter(value: FinancialStatus | 'all') {
    setStatusFilter(value);
    setPage(1);
  }

  function handleDateFrom(value: string) {
    setDateFrom(value);
    setPage(1);
  }

  function handleDateTo(value: string) {
    setDateTo(value);
    setPage(1);
  }

  if (status === 'unauthenticated') {
    return <AccountLoginRequired />;
  }

  const isPageLoading = status === 'loading' || isOrdersLoading;

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <PageBreadcrumb crumbs={[{ label: t('title'), href: '/account' }]} title={t('orders')} />

        {isPageLoading ? (
          <div className="overflow-hidden rounded-2xl border border-card-border bg-card">
            <div className="hidden grid-cols-4 gap-4 border-b border-border px-6 pb-3 pt-6 text-xs font-semibold uppercase tracking-wide text-text-muted sm:grid">
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
        ) : orders.length === 0 ? (
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
          <>
            {/* Search + Filter */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-col gap-1 sm:max-w-64">
                <span className="text-xs font-medium text-text-muted">{t('orderNumber')}</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={t('searchOrders')}
                  className="h-10 w-full rounded-xl border border-border bg-card px-4 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1 sm:w-48">
                <span className="text-xs font-medium text-text-muted">{t('filterStatus')}</span>
                <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value as FinancialStatus | 'all')}
                  className="h-10 w-full appearance-none rounded-xl border border-border bg-card pl-3 pr-9 text-sm text-text-base focus:border-primary focus:outline-none"
                >
                  <option value="all">{t('allStatuses')}</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {t(`financialStatus.${s}`)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
                </div>
              </div>
              <DateRangeFilter
                from={dateFrom}
                to={dateTo}
                onFromChange={handleDateFrom}
                onToChange={handleDateTo}
                labelFrom={t('dateFrom')}
                labelTo={t('dateTo')}
                clearLabel={t('clearDates')}
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-card-border bg-card">
              <div className="hidden grid-cols-4 gap-4 border-b border-border px-6 pb-3 pt-6 text-xs font-semibold uppercase tracking-wide text-text-muted sm:grid">
                <span>{t('orderNumber')}</span>
                <span>{t('orderDate')}</span>
                <span>{t('orderStatus')}</span>
                <span className="text-right">{t('orderTotal')}</span>
              </div>

              {paginated.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Package className="h-10 w-10 text-text-muted" strokeWidth={1.25} />
                  <p className="text-sm text-text-muted">{t('noOrdersFound')}</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {paginated.map((order) => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${encodeURIComponent(btoa(order.id))}`}
                      className="block px-4 py-3 text-sm transition-colors hover:bg-primary-hover sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6 sm:py-4"
                    >
                      {/* col 1: name + item count */}
                      <div className="flex items-center justify-between sm:block">
                        <span className="font-medium text-primary">{order.name}</span>
                        <p className="mt-0.5 hidden text-xs text-text-muted sm:block">
                          {t('itemCount', { count: order.itemCount })}
                        </p>
                        {/* mobile: total sağda */}
                        <span className="font-semibold text-text-base sm:hidden">
                          {formatMoney(order.totalPrice)}
                        </span>
                      </div>
                      {/* col 2: date | col 3: statuses | col 4: total */}
                      <div className="mt-0.5 flex items-center justify-between sm:contents">
                        <span className="text-xs text-text-muted sm:self-center sm:text-sm">
                          {formatDateShort(order.processedAt, locale)}
                          <span className="ml-1.5 sm:hidden">
                            · {t('itemCount', { count: order.itemCount })}
                          </span>
                        </span>
                        <div className="sm:block">
                          <span className="text-xs text-text-base sm:text-sm">
                            {t(`financialStatus.${order.financialStatus.toLowerCase() as FinancialStatus}`)}
                          </span>
                          <p className="hidden text-xs text-text-muted sm:block">
                            {t(`fulfillmentStatus.${order.fulfillmentStatus.toLowerCase() as 'unfulfilled' | 'partial' | 'fulfilled' | 'restocked'}`)}
                          </p>
                        </div>
                        <span className="hidden text-right font-semibold text-text-base sm:block sm:self-center sm:justify-self-end">
                          {formatMoney(order.totalPrice)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-muted transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-40"
                  aria-label={t('prevPage')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isActive = p === currentPage;
                  const isVisible =
                    p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                  const showLeftEllipsis = p === 2 && currentPage > 3;
                  const showRightEllipsis = p === totalPages - 1 && currentPage < totalPages - 2;

                  if (!isVisible) {
                    if (showLeftEllipsis || showRightEllipsis) {
                      return (
                        <span key={p} className="flex h-9 w-9 items-center justify-center text-sm text-text-muted">
                          …
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={[
                        'flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-white'
                          : 'border border-border text-text-muted hover:bg-primary-hover',
                      ].join(' ')}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-muted transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-40"
                  aria-label={t('nextPage')}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </Container>
    </section>
  );
}
