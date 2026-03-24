import { getServerSession } from 'next-auth/next';
import { getLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

import { authOptions } from '@/lib/auth';

import { AccountAddressList } from '@/components/account/AccountAddressList';
import { AccountLoginRequired } from '@/components/account/AccountLoginRequired';
import { Container } from '@/components/ui/Container';

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
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm">
          <Link href="/account" className="text-text-muted hover:text-primary">
            {t('title')}
          </Link>
          <span className="text-text-muted" aria-hidden>
            /
          </span>
          <h1 className="text-2xl font-bold text-black-dark">{tAddr('title')}</h1>
        </div>

        <div className="mx-auto max-w-4xl rounded-2xl border border-card-border bg-card p-6">
          <AccountAddressList />
        </div>
      </Container>
    </section>
  );
}
