'use client';

import { useLocale } from 'next-intl';

import { Container } from '@/components/ui/Container';

export function AccountFetchError({ message, signOutLabel }: { message: string; signOutLabel: string }) {
  const locale = useLocale();
  const href = `/api/auth/shopify-customer-logout?locale=${encodeURIComponent(locale)}&dest=login`;

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <div className="mx-auto max-w-lg rounded-2xl border border-card-border bg-card p-6 text-center">
          <p className="text-sm text-text-muted">{message}</p>
          <a
            href={href}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            {signOutLabel}
          </a>
        </div>
      </Container>
    </section>
  );
}
