'use client';

import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { Link, useRouter } from '@/i18n/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader } from 'lucide-react';

import { registerCustomer } from '@/lib/actions/customer';

import { Container } from '@/components/ui/Container';
import { ErrorBox } from '@/components/ui/ErrorBox';

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      await registerCustomer({
        email: values.email,
        password: values.password,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
      });
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (result?.error) throw new Error('signin_failed');
    },
    onSuccess: () => router.push('/account'),
  });

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    mutation.mutate({
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      password: (form.elements.namedItem('password') as HTMLInputElement).value,
    });
  }

  function getErrorMessage() {
    const message = mutation.error instanceof Error ? mutation.error.message : '';
    if (message === 'signin_failed') return tErrors('generic');
    if (message.toLowerCase().includes('already') || message.includes('CUSTOMER_DISABLED'))
      return tErrors('emailInUse');
    return tErrors('generic');
  }

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-card-border bg-card p-8">
            <h1 className="mb-6 text-2xl font-bold text-black-dark">{t('title')}</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mutation.isError && <ErrorBox>{getErrorMessage()}</ErrorBox>}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-base">{t('firstName')}</label>
                  <input
                    type="text"
                    name="firstName"
                    autoComplete="given-name"
                    className="h-10 rounded-lg border border-card-border bg-background px-3 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-base">{t('lastName')}</label>
                  <input
                    type="text"
                    name="lastName"
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
                  required
                  autoComplete="new-password"
                  minLength={5}
                  className="h-10 rounded-lg border border-card-border bg-background px-3 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="mt-2 flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending ? <Loader className="h-4 w-4 animate-spin" /> : t('submit')}
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
