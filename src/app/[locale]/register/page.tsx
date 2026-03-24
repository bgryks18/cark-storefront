'use client';

import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { Container } from '@/components/ui/Container';

export default function RegisterPage() {
  const t = useTranslations('auth.register');

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-sm">
          <div className="rounded-2xl border border-card-border bg-card p-8 text-center">
            <h1 className="mb-3 text-2xl font-bold text-black-dark">{t('title')}</h1>
            <p className="mb-8 text-sm text-text-muted">{t('description')}</p>
            <button
              onClick={() => signIn('shopify-customer')}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              {t('submit')}
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
