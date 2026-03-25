'use server';

import { revalidatePath } from 'next/cache';
import { getLocale, getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { routing } from '@/i18n/routing';
import {
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  getCustomerAddresses,
} from '@/lib/shopify/customerAccount';


export type AddressActionState =
  | { ok: true; message: string }
  | { ok: false; message: string }
  | null;

function revalidateAddressPaths(locale: string) {
  const base = locale === routing.defaultLocale ? '/account' : `/${locale}/account`;
  revalidatePath(base);
  revalidatePath(`${base}/addresses`);
}

/**
 * Hem "ekle" hem "düzenle" için tek action.
 * Formda gizli `addressId` alanı varsa güncelleme, yoksa ekleme yapar.
 */
export async function saveAddressAction(
  _prev: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const t = await getTranslations('account.addresses');
  const session = await getServerSession(authOptions);
  if (!session?.shopifyAccessToken) {
    return { ok: false, message: t('errors.unauthorized') };
  }

  const addressId = (formData.get('addressId') as string | null)?.trim() || null;
  const firstName = (formData.get('firstName') as string | null)?.trim() || '';
  const lastName = (formData.get('lastName') as string | null)?.trim() || '';
  const address1 = (formData.get('address1') as string | null)?.trim() || '';
  const address2 = (formData.get('address2') as string | null)?.trim() || '';
  const city = (formData.get('city') as string | null)?.trim() || '';
  const zip = (formData.get('zip') as string | null)?.trim() || '';
  let phone = (formData.get('phone') as string | null)?.trim() || '';
  if (phone && !phone.startsWith('+')) {
    phone = phone.startsWith('0') ? '+9' + phone : '+90' + phone;
  }
  const makeDefault = formData.get('makeDefault') === 'on';

  if (!firstName || !lastName || !address1 || !city) {
    return { ok: false, message: t('errors.required') };
  }

  const input = {
    firstName,
    lastName,
    address1,
    ...(address2 ? { address2 } : {}),
    city,
    ...(zip ? { zip } : {}),
    ...(phone ? { phoneNumber: phone } : {}),
    territoryCode: 'TR',
  };

  const locale = await getLocale();

  let result;
  if (addressId) {
    result = await updateCustomerAddress(session.shopifyAccessToken, addressId, input, makeDefault);
  } else {
    result = await createCustomerAddress(session.shopifyAccessToken, input);
    if (result.ok && makeDefault && result.addressId) {
      const defaultResult = await updateCustomerAddress(
        session.shopifyAccessToken,
        result.addressId,
        {},
        true,
      );
      if (!defaultResult.ok) {
        result = defaultResult;
      }
    }
  }

  if (!result.ok) {
    return { ok: false, message: result.message || t('errors.saveFailed') };
  }

  revalidateAddressPaths(locale);
  return { ok: true, message: addressId ? t('updated') : t('saved') };
}

export async function getAddressesAction(): Promise<{ addresses: import('@/lib/shopify/types').ShopifyAddress[]; defaultAddressId: string | null } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.shopifyAccessToken) return null;
  return getCustomerAddresses(session.shopifyAccessToken);
}

export async function deleteAddressAction(addressId: string): Promise<{ ok: boolean }> {
  const session = await getServerSession(authOptions);
  if (!session?.shopifyAccessToken) return { ok: false };

  const result = await deleteCustomerAddress(session.shopifyAccessToken, addressId);
  if (!result.ok) return { ok: false };

  const locale = await getLocale();
  revalidateAddressPaths(locale);
  return { ok: true };
}

export async function setDefaultAddressAction(addressId: string): Promise<{ ok: boolean }> {
  const session = await getServerSession(authOptions);
  if (!session?.shopifyAccessToken) return { ok: false };

  const result = await updateCustomerAddress(session.shopifyAccessToken, addressId, {}, true);
  if (!result.ok) return { ok: false };

  const locale = await getLocale();
  revalidateAddressPaths(locale);
  return { ok: true };
}
