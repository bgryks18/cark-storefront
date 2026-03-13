import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Package } from 'lucide-react';

import { authOptions } from '@/lib/auth';
import { getCustomer } from '@/lib/shopify/queries/customer';
import { flattenConnection, formatMoney } from '@/lib/shopify/normalize';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.shopifyAccessToken) {
    redirect(locale === 'en' ? '/en/login' : '/login');
  }

  const t = await getTranslations('account');

  const customer = await getCustomer(session.shopifyAccessToken);
  if (!customer) redirect(locale === 'en' ? '/en/login' : '/login');

  const orders = flattenConnection(customer.orders);

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

        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Package className="h-16 w-16 text-text-muted" strokeWidth={1.25} />
            <p className="text-text-muted">{t('noOrders')}</p>
            <Link
              href="/collections"
              className="inline-flex h-11 items-center rounded-xl bg-primary px-8 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Alışverişe başla
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
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${encodeURIComponent(btoa(order.id))}`}
                  className="grid grid-cols-4 gap-4 px-6 py-4 text-sm transition-colors hover:bg-primary-hover"
                >
                  <span className="font-medium text-primary">{order.name}</span>
                  <span className="text-text-muted">
                    {new Date(order.processedAt).toLocaleDateString(
                      locale === 'tr' ? 'tr-TR' : 'en-US',
                      { year: 'numeric', month: 'short', day: 'numeric' },
                    )}
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
