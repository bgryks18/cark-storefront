'use server';

import { revalidatePath } from 'next/cache';
import { getLocale, getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { invalidateShopifyAdminTokenCache } from '@/lib/shopify/admin';
import { routing } from '@/i18n/routing';
import { saveCustomerAvatarForSessionEmail } from '@/lib/shopify/adminCustomerAvatar';

function isStagedUploadAccessError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes('stageduploadscreate') || (m.includes('access denied') && m.includes('staged'));
}

export type AvatarUploadState = { ok: true; message: string } | { ok: false; message: string } | null;

export async function submitCustomerAvatar(
  _prev: AvatarUploadState,
  formData: FormData,
): Promise<AvatarUploadState> {
  const t = await getTranslations('account.avatar');

  try {
    const session = await getServerSession(authOptions);
    if (!session?.shopifyAccessToken || !session.user?.email) {
      return { ok: false, message: t('errors.unauthorized') };
    }

    const file = formData.get('avatar');
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: t('errors.noFile') };
    }

    const result = await saveCustomerAvatarForSessionEmail(session.user.email, file);

    if (!result.ok) {
    switch (result.code) {
      case 'config':
        return { ok: false, message: t('errors.adminConfig') };
      case 'session':
        return { ok: false, message: t('errors.unauthorized') };
      case 'validation':
        return {
          ok: false,
          message:
            result.message === 'file_too_large'
              ? t('errors.fileTooLarge')
              : result.message === 'invalid_type'
                ? t('errors.invalidType')
                : result.message === 'read_failed'
                  ? t('errors.readFailed')
                  : t('errors.noFile'),
        };
      case 'not_found':
        return { ok: false, message: t('errors.customerNotFound') };
      case 'shopify':
      default:
        if (isStagedUploadAccessError(result.message)) {
          invalidateShopifyAdminTokenCache();
          return { ok: false, message: t('errors.missingWriteFilesScope') };
        }
        if (result.message === 'file_create_timeout') {
          return { ok: false, message: t('errors.fileCreateTimeout') };
        }
        if (result.message === 'file_processing_failed') {
          return { ok: false, message: t('errors.fileProcessingFailed') };
        }
        if (result.message === 'file_create_no_media') {
          return { ok: false, message: t('errors.fileCreateNoMedia') };
        }
        return {
          ok: false,
          message: t('errors.shopifyDetail', { detail: result.message }),
        };
    }
    }

    const locale = await getLocale();
    const base = locale === routing.defaultLocale ? '/account' : `/${locale}/account`;
    revalidatePath(base);
    revalidatePath(`${base}/profile`);

    return { ok: true, message: t('saved') };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/body exceeded|body size|too large|payload too large|\d+\s*mb/i.test(msg)) {
      return { ok: false, message: t('errors.fileTooLarge') };
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('[submitCustomerAvatar]', e);
    }
    return { ok: false, message: t('errors.unexpected') };
  }
}
