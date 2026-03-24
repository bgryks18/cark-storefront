'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import { Plus, User } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';

import { MAX_AVATAR_BYTES, AVATAR_ACCEPT, AVATAR_MIME_SET } from '@/lib/constants/avatarUpload';
import { submitCustomerAvatar, type AvatarUploadState } from '@/lib/actions/uploadCustomerAvatar';

type AccountAvatarUploadProps = {
  initialAvatarUrl: string | null;
};

export function AccountAvatarUpload({ initialAvatarUrl }: AccountAvatarUploadProps) {
  const t = useTranslations('account.avatar');
  const router = useRouter();
  const inputId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState(submitCustomerAvatar, null as AvatarUploadState);
  const [clientError, setClientError] = useState<string | null>(null);
  const didRefresh = useRef(false);

  useEffect(() => {
    if (!state?.ok) didRefresh.current = false;
  }, [state]);

  useEffect(() => {
    if (state?.ok && !didRefresh.current) {
      didRefresh.current = true;
      router.refresh();
      window.dispatchEvent(new CustomEvent('account-avatar-changed'));
    }
  }, [state, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > MAX_AVATAR_BYTES) {
      setClientError(t('errors.fileTooLarge'));
      e.target.value = '';
      return;
    }
    if (!AVATAR_MIME_SET.has(f.type)) {
      setClientError(t('errors.invalidType'));
      e.target.value = '';
      return;
    }

    formRef.current?.requestSubmit();
  }

  const errorMessage = clientError ?? (state?.ok === false ? state.message : null);
  const successMessage = state?.ok ? state.message : null;

  return (
    <form ref={formRef} action={formAction} className="mb-6 space-y-3 border-b border-border pb-6">
      <p className="text-xs font-medium text-text-muted">{t('title')}</p>

      <div className="flex flex-wrap items-start gap-4">
        <div className="relative shrink-0">
          <label
            htmlFor={inputId}
            className={[
              'group relative block h-20 w-20 cursor-pointer overflow-visible',
              pending ? 'pointer-events-none opacity-90' : '',
            ].join(' ')}
          >
            {/* overflow-hidden yalnızca dairede — rozet dışarı taşabilsin */}
            <div
              className={[
                'relative h-full w-full overflow-hidden rounded-full border-2 border-border bg-primary-hover transition-shadow',
                pending ? '' : 'group-hover:ring-2 group-hover:ring-primary/30',
              ].join(' ')}
            >
              {initialAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={initialAvatarUrl}
                  alt=""
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-primary">
                  <User className="h-9 w-9" strokeWidth={1.5} aria-hidden />
                </span>
              )}

              {pending ? (
                <span
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-[1px]"
                  aria-live="polite"
                  aria-label={t('uploading')}
                >
                  <span
                    className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"
                    aria-hidden
                  />
                </span>
              ) : null}
            </div>

            <span
              className="pointer-events-none absolute -right-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-white shadow-md"
              aria-hidden
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </span>
          </label>

          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            name="avatar"
            accept={AVATAR_ACCEPT}
            disabled={pending}
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
          <p className="text-xs text-text-muted">{t('hint')}</p>
          <button
            type="button"
            disabled={pending}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-9 w-fit items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-text-base transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-60"
          >
            {t('chooseFile')}
          </button>
        </div>
      </div>

      {successMessage ? (
        <p className="text-sm text-success" role="status">
          {successMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="text-sm text-error-text" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
