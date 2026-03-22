'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';
import { Loader } from 'lucide-react';

import { signIn } from 'next-auth/react';

import { Link, useRouter } from '@/i18n/navigation';

import { ErrorBox } from '@/components/ui/ErrorBox';
import { Container } from '@/components/ui/Container';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      setError(tErrors('invalidCredentials'));
      setLoading(false);
    } else {
      router.push('/account');
    }
  }

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-sm">
          <div className="rounded-2xl border border-card-border bg-card p-8">
            <h1 className="mb-6 text-2xl font-bold text-black-dark">{t('title')}</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <ErrorBox>{error}</ErrorBox>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-base">{t('email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-10 rounded-lg border border-card-border bg-background px-3 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-base">{t('password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-10 rounded-lg border border-card-border bg-background px-3 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {loading ? <Loader className="h-4 w-4 animate-spin" /> : t('submit')}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-text-muted">
              {t('noAccount')}{' '}
              <Link href="/register" className="font-medium text-primary hover:underline">
                {t('registerLink')}
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
