'use client';

import { useMutation } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Loader2, LogOut } from 'lucide-react';
import { useEffect } from 'react';

import { Container } from '@/components/ui/Container';

import { completeSignOut } from '@/lib/actions/completeSignOut';

/** Tam yükleme: App Router önbelleği / SessionProvider iç state ile “çıkışlı” UI senkron kalsın. */
function hardNavigateAfterSignOut(url: string) {
  try {
    const target = new URL(url, window.location.origin);
    window.location.replace(target.href);
  } catch {
    window.location.replace(url);
  }
}

export function SigningOutClient({ callbackUrl }: { callbackUrl: string }) {
  const t = useTranslations('auth.signingOut');

  const { mutate: runSignOut, isPending, isError } = useMutation({
    mutationKey: ['auth', 'complete-signout'],
    mutationFn: async () => {
      const result = await completeSignOut(callbackUrl);
      if (!result.ok) throw new Error('signout');
      return result.url;
    },
    onSuccess: async (url) => {
      try {
        await signOut({ redirect: false });
      } catch {
        /* çerezler zaten completeSignOut ile silindi */
      }
      hardNavigateAfterSignOut(url);
    },
  });

  useEffect(() => {
    runSignOut();
  }, [runSignOut]);

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-sm">
          <div className="rounded-2xl border border-card-border bg-card p-8 text-center">
            <div className="mb-4 flex justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LogOut className="h-7 w-7" aria-hidden />
              </span>
            </div>
            <h1 className="mb-3 text-2xl font-bold text-black-dark">{t('title')}</h1>
            <p className="mb-6 text-sm text-text-muted">{t('description')}</p>
            {isPending ? (
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-text-muted">
                <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
                {t('inProgress')}
              </div>
            ) : null}
            {isError ? (
              <div className="space-y-4">
                <p className="text-sm text-error-text" role="alert">
                  {t('failed')}
                </p>
                <a
                  href={callbackUrl}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  {t('continueLink')}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
