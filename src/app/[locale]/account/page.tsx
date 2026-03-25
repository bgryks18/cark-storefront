import { getServerSession } from 'next-auth/next';
import { getLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { MapPin, Package, Pencil, Plus, User } from 'lucide-react';

import { authOptions } from '@/lib/auth';
import { getCustomerAvatarUrlFromAdmin } from '@/lib/shopify/adminCustomerAvatar';
import { getCustomerAccount, getCustomerAddresses } from '@/lib/shopify/customerAccount';
import { flattenConnection, formatMoney } from '@/lib/shopify/normalize';
import { formatDate, formatMonthYear } from '@/lib/utils/date';

import { AccountFetchError } from '@/components/account/AccountFetchError';
import { AccountLoginRequired } from '@/components/account/AccountLoginRequired';
import { AccountSignOut } from '@/components/account/AccountSignOut';
import { Container } from '@/components/ui/Container';

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  const t = await getTranslations('account');
  const tNav = await getTranslations('nav');

  if (!session?.shopifyAccessToken) {
    return <AccountLoginRequired />;
  }

  const [customerResult, addressSettled, avatarSettled] = await Promise.allSettled([
    getCustomerAccount(session.shopifyAccessToken),
    getCustomerAddresses(session.shopifyAccessToken),
    session.user?.email != null
      ? getCustomerAvatarUrlFromAdmin(session.user.email)
      : Promise.resolve(null),
  ]);

  const customer = customerResult.status === 'fulfilled' ? customerResult.value : null;
  const addressResult = addressSettled.status === 'fulfilled' ? addressSettled.value : null;
  const avatarUrl = avatarSettled.status === 'fulfilled' ? avatarSettled.value : null;

  if (!customer) {
    return <AccountFetchError message={t('errors.loadFailed')} signOutLabel={tNav('logout')} />;
  }

  const orders = flattenConnection(customer.orders).slice(0, 5);
  const addressCount = addressResult?.addresses.length ?? 0;
  const defaultAddress =
    addressResult?.addresses.find((a) => a.id === addressResult.defaultAddressId) ??
    addressResult?.addresses[0] ??
    null;

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black-dark sm:text-3xl">{t('title')}</h1>
          <span className="hidden md:block"><AccountSignOut label={tNav('logout')} /></span>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          {/* Siparişler */}
          <div className="rounded-2xl border border-card-border bg-card py-4 px-2">
            <div className="mb-4 flex items-center justify-between gap-2 px-3 sm:px-4 mx-1 sm:mx-1.5">
              <h2 className="text-base font-semibold text-text-base">{t('orders')}</h2>
              {orders.length > 0 && (
                <Link href="/account/orders" className="text-sm text-primary hover:underline">
                  {t('viewAll')}
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
                  {t('startShopping')}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/orders/${encodeURIComponent(btoa(order.id))}`}
                    className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-primary-hover sm:px-6"
                  >
                    <div>
                      <p className="font-medium text-text-base">{order.name}</p>
                      <p className="text-xs text-text-muted">
                        {formatDate(order.processedAt, locale)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatMoney(order.totalPrice)}</p>
                      <p className="text-xs text-text-muted">
                        {t(`financialStatus.${order.financialStatus.toLowerCase() as 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided'}`)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Profil */}
          <div className="order-first h-fit rounded-2xl border border-card-border bg-card p-6 md:order-0">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-text-base">{t('profile')}</h2>
              <Link
                href="/account/profile"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-primary-hover hover:text-primary"
                aria-label={t('editProfile')}
                title={t('editProfile')}
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-hover">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-text-base">{customer.displayName}</p>
                  <p className="text-text-muted">{customer.email}</p>
                </div>
              </div>

              {customer.phone && (
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="text-text-muted">{t('phone')}</span>
                  <span className="text-text-base">{customer.phone}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-text-muted">{t('memberSince')}</span>
                <span className="text-text-base">
                  {formatMonthYear(customer.createdAt, locale)}
                </span>
              </div>
            </div>
          </div>

          {/* Adresler */}
          <div className="h-fit rounded-2xl border border-card-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-text-base">{t('addresses.title')}</h2>
              <Link
                href="/account/addresses"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-primary-hover hover:text-primary"
                aria-label={t('addresses.add')}
                title={t('addresses.add')}
              >
                <Plus className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            {addressCount === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <MapPin className="h-8 w-8 text-text-muted" strokeWidth={1.25} />
                <p className="text-sm text-text-muted">{t('addresses.empty')}</p>
                <Link
                  href="/account/addresses"
                  className="mt-1 text-sm text-primary hover:underline"
                >
                  {t('addresses.add')}
                </Link>
              </div>
            ) : (
              <Link
                href="/account/addresses"
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:bg-primary-hover"
              >
                <div>
                  {defaultAddress && (
                    <p className="text-text-base">
                      {[defaultAddress.address1, defaultAddress.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-text-muted">
                    {t('addresses.count', { count: addressCount })}
                  </p>
                </div>
                <MapPin className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
