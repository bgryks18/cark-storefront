import { getServerSession } from 'next-auth/next';
import { getLocale, getTranslations } from 'next-intl/server';

import { authOptions } from '@/lib/auth';

import { AccountAddressList } from '@/components/account/AccountAddressList';
import { AccountLoginRequired } from '@/components/account/AccountLoginRequired';
import { Container } from '@/components/ui/Container';
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb';

export async function generateMetadata() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'account.addresses' });
  return { title: t('title') };
}

export default async function AccountAddressesPage() {
  const session = await getServerSession(authOptions);

  const t = await getTranslations('account');
  const tAddr = await getTranslations('account.addresses');

  if (!session?.shopifyAccessToken) {
    return <AccountLoginRequired />;
  }

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <PageBreadcrumb
          crumbs={[{ label: t('title'), href: '/account' }]}
          title={tAddr('title')}
        />

        <div className="mx-auto max-w-4xl rounded-2xl border border-card-border bg-card p-6">
          <AccountAddressList />
        </div>
      </Container>
    </section>
  );
}
