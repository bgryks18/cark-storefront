'use client';

import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { useCart } from '@/hooks/useCart';

export default function CheckoutSuccessPage() {
  const t = useTranslations('checkout.success');
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green/10">
            <CheckCircle2 className="h-10 w-10 text-green" strokeWidth={1.5} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-text-base sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-3 text-text-muted">
              {t('description')}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            <Link
              href="/collections"
              className="flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              {t('continueShopping')}
            </Link>
            <Link
              href="/"
              className="flex h-11 items-center justify-center rounded-xl border border-card-border text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover"
            >
              {t('backHome')}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
