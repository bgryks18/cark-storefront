import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Package, User } from 'lucide-react';

import { authOptions } from '@/lib/auth';
import { getCustomer } from '@/lib/shopify/queries/customer';
import { flattenConnection, formatMoney } from '@/lib/shopify/normalize';
import { formatDate, formatMonthYear } from '@/lib/utils/date';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { AccountSignOut } from '@/components/account/AccountSignOut';

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.shopifyAccessToken) {
    redirect(locale === 'en' ? '/en/login' : '/login');
  }

  const t = await getTranslations('account');
  const tNav = await getTranslations('nav');

  const customer = await getCustomer(session.shopifyAccessToken);
  if (!customer) redirect(locale === 'en' ? '/en/login' : '/login');

  const orders = flattenConnection(customer.orders).slice(0, 5);

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black-dark sm:text-3xl">{t('title')}</h1>
          <AccountSignOut label={tNav('logout')} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Siparişler */}
          <div className="rounded-2xl border border-card-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-base">{t('orders')}</h2>
              {orders.length > 0 && (
                <Link href="/account/orders" className="text-sm text-primary hover:underline">
                  Tümünü gör
                </Link>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Package className="h-10 w-10 text-text-muted" strokeWidth={1.25} />
                <p className="text-sm text-text-muted">{t('noOrders')}</p>
                <Link
                  href="/collections"
                  className="mt-1 inline-flex h-10 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Alışverişe başla
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/orders/${encodeURIComponent(btoa(order.id))}`}
                    className="flex items-center justify-between py-3 text-sm transition-colors hover:bg-primary-hover"
                  >
                    <div>
                      <p className="font-medium text-text-base">{order.name}</p>
                      <p className="text-xs text-text-muted">
                        {formatDate(order.processedAt, locale)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatMoney(order.totalPrice)}</p>
                      <p className="text-xs capitalize text-text-muted">
                        {order.financialStatus.toLowerCase()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Profil */}
          <div className="h-fit rounded-2xl border border-card-border bg-card p-6">
            <h2 className="mb-4 text-base font-semibold text-text-base">{t('profile')}</h2>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-hover">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-text-base">{customer.displayName}</p>
                  <p className="text-text-muted">{customer.email}</p>
                </div>
              </div>

              {customer.phone && (
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="text-text-muted">Telefon</span>
                  <span className="text-text-base">{customer.phone}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-text-muted">Üyelik tarihi</span>
                <span className="text-text-base">
                  {formatMonthYear(customer.createdAt, locale)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
