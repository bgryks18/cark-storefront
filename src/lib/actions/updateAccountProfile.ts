'use server';

import { revalidatePath } from 'next/cache';
import { getLocale, getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { routing } from '@/i18n/routing';
import { updateCustomerAccountProfile } from '@/lib/shopify/customerAccount';

const MAX_NAME_LEN = 50;

export type AccountProfileFormState =
  | { ok: true; message: string }
  | { ok: false; message: string }
  | null;

export async function submitAccountProfile(
  _prev: AccountProfileFormState,
  formData: FormData,
): Promise<AccountProfileFormState> {
  const t = await getTranslations('account.profileEdit');
  const session = await getServerSession(authOptions);
  if (!session?.shopifyAccessToken) {
    return { ok: false, message: t('errors.unauthorized') };
  }

  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();

  if (!firstName || !lastName) {
    return { ok: false, message: t('errors.required') };
  }
  if (firstName.length > MAX_NAME_LEN || lastName.length > MAX_NAME_LEN) {
    return { ok: false, message: t('errors.nameTooLong') };
  }

  const result = await updateCustomerAccountProfile(session.shopifyAccessToken, { firstName, lastName });
  if (!result.ok) {
    const generic = t('errors.shopify');
    if (
      result.message === 'request_failed' ||
      result.message === 'invalid_response' ||
      result.message === 'no_customer'
    ) {
      return { ok: false, message: generic };
    }
    return { ok: false, message: result.message };
  }

  const locale = await getLocale();
  const accountBase = locale === routing.defaultLocale ? '/account' : `/${locale}/account`;
  revalidatePath(accountBase);
  revalidatePath(`${accountBase}/profile`);

  return { ok: true, message: t('saved') };
}
