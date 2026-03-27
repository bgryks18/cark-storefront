'use client';

import { useEffect } from 'react';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

import { useRouter } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';

export function LoginPageClient() {
  const t = useTranslations('auth.login');
  const { data: session, status } = useSession();
  const router = useRouter();

  const { mutate: startShopifySignIn, isPending, isError } = useMutation({
    mutationKey: ['auth', 'shopify-customer-sign-in'],
    mutationFn: async () => {
      await signIn('shopify-customer');
    },
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('shopifyOAuth') !== '1') return;
    window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    startShopifySignIn();
  }, [startShopifySignIn]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (session?.shopifyAccessToken) {
      router.replace('/account');
      return;
    }
    void signOut({ redirect: false });
  }, [session, status, router]);

  if (status === 'loading' || (status === 'authenticated' && session?.shopifyAccessToken)) return null;

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-sm">
          <div className="rounded-2xl border border-card-border bg-card p-8 text-center">
            <h1 className="mb-3 text-2xl font-bold text-black-dark">{t('title')}</h1>
            <p className="mb-8 text-sm text-text-muted">{t('description')}</p>
            {isError ? (
              <p className="mb-4 text-sm text-error-text" role="alert">
                {t('signInFailed')}
              </p>
            ) : null}
            <button
              type="button"
              disabled={isPending}
              onClick={() => startShopifySignIn()}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:pointer-events-none disabled:opacity-70"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
              ) : (
                <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden />
              )}
              {isPending ? t('signingIn') : t('submit')}
            </button>
            <p className="mt-4 text-xs text-text-muted">{t('secureNote')}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
