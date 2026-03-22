'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';
import { Loader } from 'lucide-react';

import { signIn } from 'next-auth/react';

import { Link, useRouter } from '@/i18n/navigation';

import { ErrorBox } from '@/components/ui/ErrorBox';
import { Container } from '@/components/ui/Container';
import { registerCustomer } from '@/lib/actions/customer';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await registerCustomer({
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
      });
      const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (result?.error) {
        setError(tErrors('generic'));
        setLoading(false);
      } else {
        router.push('/account');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.toLowerCase().includes('already') || message.includes('CUSTOMER_DISABLED')) {
        setError(tErrors('emailInUse'));
      } else {
        setError(tErrors('generic'));
      }
      setLoading(false);
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

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-base">{t('firstName')}</label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    autoComplete="given-name"
                    className="h-10 rounded-lg border border-card-border bg-background px-3 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-base">{t('lastName')}</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    autoComplete="family-name"
                    className="h-10 rounded-lg border border-card-border bg-background px-3 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-base">{t('email')}</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="h-10 rounded-lg border border-card-border bg-background px-3 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-base">{t('password')}</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  minLength={5}
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
              {t('hasAccount')}{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                {t('loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
