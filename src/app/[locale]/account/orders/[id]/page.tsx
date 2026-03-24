import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';

import { authOptions } from '@/lib/auth';
import { getCustomerAccount } from '@/lib/shopify/customerAccount';
import { flattenConnection, formatMoney } from '@/lib/shopify/normalize';
import { formatDate } from '@/lib/utils/date';
import { Link } from '@/i18n/navigation';
import { AccountFetchError } from '@/components/account/AccountFetchError';
import { Container } from '@/components/ui/Container';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  const t = await getTranslations('account');
  const tNav = await getTranslations('nav');

  if (!session?.shopifyAccessToken) {
    redirect(locale === 'en' ? '/en/login' : '/login');
  }

  const customer = await getCustomerAccount(session.shopifyAccessToken);
  if (!customer) {
    return (
      <AccountFetchError message={t('errors.loadFailed')} signOutLabel={tNav('logout')} />
    );
  }

  let decodedId: string;
  try {
    decodedId = atob(decodeURIComponent(id));
  } catch {
    notFound();
  }

  const order = flattenConnection(customer.orders).find((o) => o.id === decodedId!) ?? null;
  if (!order) notFound();

  const lineItems = flattenConnection(order.lineItems);

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <div className="mb-8 flex items-center gap-2 text-sm">
          <Link href="/account" className="text-text-muted hover:text-primary">
            {t('title')}
          </Link>
          <span className="text-text-muted">/</span>
          <Link href="/account/orders" className="text-text-muted hover:text-primary">
            {t('orders')}
          </Link>
          <span className="text-text-muted">/</span>
          <span className="font-medium text-text-base">{order.name}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Ürünler */}
          <div className="rounded-2xl border border-card-border bg-card p-6">
            <h2 className="mb-4 text-base font-semibold text-text-base">Ürünler</h2>
            <div className="flex flex-col divide-y divide-border">
              {lineItems.map((item, i) => (
                <div key={i} className="flex gap-4 py-4">
                  {item.variant?.image && (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-skeleton">
                      <Image
                        src={item.variant.image.url}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <p className="truncate text-sm font-medium text-text-base">{item.title}</p>
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
          </div>

          {/* Sipariş özeti */}
          <div className="h-fit rounded-2xl border border-card-border bg-card p-6">
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
                <span className="capitalize text-text-base">
                  {order.financialStatus.toLowerCase()}
                </span>
              </div>
              {order.subtotalPrice && (
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-text-muted">Ara toplam</span>
                  <span className="text-text-base">{formatMoney(order.subtotalPrice)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-muted">Kargo</span>
                <span className="text-text-base">{formatMoney(order.totalShippingPrice)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base">
                <span className="font-semibold text-text-base">{t('orderTotal')}</span>
                <span className="font-bold text-primary">{formatMoney(order.totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
