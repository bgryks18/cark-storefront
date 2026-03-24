import { getServerSession } from 'next-auth/next';
import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Link } from '@/i18n/navigation';

import { authOptions } from '@/lib/auth';
import { getCustomerAvatarUrlFromAdmin } from '@/lib/shopify/adminCustomerAvatar';
import { getCustomerAccount, getCustomerAddresses } from '@/lib/shopify/customerAccount';

import { MapPin } from 'lucide-react';

import { AccountAvatarUpload } from '@/components/account/AccountAvatarUpload';
import { AccountFetchError } from '@/components/account/AccountFetchError';
import { AccountProfileForm } from '@/components/account/AccountProfileForm';
import { Container } from '@/components/ui/Container';

export async function generateMetadata() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'account' });
  return { title: t('profileEditPageTitle') };
}

export default async function AccountProfileEditPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  const t = await getTranslations('account');
  const tNav = await getTranslations('nav');

  if (!session?.shopifyAccessToken) {
    redirect(locale === 'en' ? '/en/login' : '/login');
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
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm">
          <Link href="/account" className="text-text-muted hover:text-primary">
            {t('title')}
          </Link>
          <span className="text-text-muted" aria-hidden>
            /
          </span>
          <h1 className="text-2xl font-bold text-black-dark">{t('profileEditPageTitle')}</h1>
        </div>

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
                    {[defaultAddress.address1, defaultAddress.city]
                      .filter(Boolean)
                      .join(', ')}
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
