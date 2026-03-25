import { getServerSession } from 'next-auth/next';
import { getLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

import { authOptions } from '@/lib/auth';
import { getCustomerAvatarUrlFromAdmin } from '@/lib/shopify/adminCustomerAvatar';
import { getCustomerAccount, getCustomerAddresses } from '@/lib/shopify/customerAccount';

import { MapPin } from 'lucide-react';

import { AccountAvatarUpload } from '@/components/account/AccountAvatarUpload';
import { AccountFetchError } from '@/components/account/AccountFetchError';
import { AccountLoginRequired } from '@/components/account/AccountLoginRequired';
import { AccountProfileForm } from '@/components/account/AccountProfileForm';
import { Container } from '@/components/ui/Container';
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb';

export async function generateMetadata() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'account' });
  return { title: t('profileEditPageTitle') };
}

export default async function AccountProfileEditPage() {
  const session = await getServerSession(authOptions);

  const t = await getTranslations('account');
  const tNav = await getTranslations('nav');

  if (!session?.shopifyAccessToken) {
    return <AccountLoginRequired />;
  }

  const [customer, addressResult, avatarUrl] = await Promise.all([
    getCustomerAccount(session.shopifyAccessToken),
    getCustomerAddresses(session.shopifyAccessToken),
    session.user?.email != null ? getCustomerAvatarUrlFromAdmin(session.user.email) : Promise.resolve(null),
  ]);

  if (!customer) {
    return <AccountFetchError message={t('errors.loadFailed')} signOutLabel={tNav('logout')} />;
  }

  const defaultAddress = addressResult?.addresses.find(
    (a) => a.id === addressResult.defaultAddressId,
  ) ?? addressResult?.addresses[0] ?? null;

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <PageBreadcrumb
          crumbs={[{ label: t('title'), href: '/account' }]}
          title={t('profileEditPageTitle')}
        />

        <div className="mx-auto max-w-3xl space-y-4">
          <div className="rounded-2xl border border-card-border bg-card p-6">
            <AccountAvatarUpload initialAvatarUrl={avatarUrl} />
            <AccountProfileForm
              key={`${customer.firstName ?? ''}|${customer.lastName ?? ''}`}
              initialFirstName={customer.firstName ?? ''}
              initialLastName={customer.lastName ?? ''}
            />
          </div>

          <Link
            href="/account/addresses"
            className="flex items-center justify-between rounded-2xl border border-card-border bg-card p-5 transition-colors hover:bg-primary-hover"
          >
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-text-base">{t('addresses.title')}</p>
                {defaultAddress ? (
                  <p className="text-xs text-text-muted">
                    {[defaultAddress.address1, defaultAddress.city].filter(Boolean).join(', ')}
                  </p>
                ) : (
                  <p className="text-xs text-text-muted">{t('addresses.manageHint')}</p>
                )}
              </div>
            </div>
            <span className="text-xs text-primary">→</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
