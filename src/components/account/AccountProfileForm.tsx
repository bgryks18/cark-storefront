'use client';

import { useActionState, useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';

import {
  type AccountProfileFormState,
  submitAccountProfile,
} from '@/lib/actions/updateAccountProfile';

const inputClass =
  'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-base outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/25';

type AccountProfileFormProps = {
  initialFirstName: string;
  initialLastName: string;
};

export function AccountProfileForm({ initialFirstName, initialLastName }: AccountProfileFormProps) {
  const t = useTranslations('account.profileEdit');
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    submitAccountProfile,
    null as AccountProfileFormState,
  );
  const didRefresh = useRef(false);

  useEffect(() => {
    if (!state?.ok) {
      didRefresh.current = false;
    }
  }, [state]);

  useEffect(() => {
    if (state?.ok && !didRefresh.current) {
      didRefresh.current = true;
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-base">{t('formTitle')}</span>
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          aria-label={pending ? t('saving') : undefined}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-1.5" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-white"
                  style={{ animation: `navDot 1s ease-in-out ${i * 0.15}s infinite` }}
                />
              ))}
            </span>
          ) : (
            t('save')
          )}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="account-firstName" className="text-xs font-medium text-text-muted">
            {t('firstName')} <span className="text-error-text">*</span>
          </label>
          <input
            id="account-firstName"
            name="firstName"
            type="text"
            required
            maxLength={50}
            autoComplete="given-name"
            defaultValue={initialFirstName}
            disabled={pending}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="account-lastName" className="text-xs font-medium text-text-muted">
            {t('lastName')} <span className="text-error-text">*</span>
          </label>
          <input
            id="account-lastName"
            name="lastName"
            type="text"
            required
            maxLength={50}
            autoComplete="family-name"
            defaultValue={initialLastName}
            disabled={pending}
            className={inputClass}
          />
        </div>
      </div>

      {state?.ok ? (
        <p className="text-sm text-success" role="status">
          {state.message}
        </p>
      ) : state?.ok === false ? (
        <p className="text-sm text-error-text" role="alert">
          {state.message}
        </p>
      ) : null}

    </form>
  );
}
