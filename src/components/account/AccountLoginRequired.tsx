'use client';

import { useTranslations } from 'next-intl';
import { LogIn } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';

export function AccountLoginRequired() {
  const t = useTranslations('account');
  const tNav = useTranslations('nav');

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <LogIn className="h-16 w-16 text-text-muted" strokeWidth={1.25} />
          <p className="text-text-muted">{t('loginRequired')}</p>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-xl bg-primary px-8 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            {tNav('login')}
          </Link>
        </div>
      </Container>
    </section>
  );
}
