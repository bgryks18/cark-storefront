import type { NextRequest } from 'next/server';

import { routing } from '@/i18n/routing';

export function appBaseUrl(request: NextRequest): string {
  const fromEnv = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return request.nextUrl.origin;
}

function loginPath(locale: string): string {
  return locale === routing.defaultLocale ? '/login' : `/${locale}/login`;
}

/** Giriş sayfası (OAuth bayrağı yok) */
export function loginUrlPlain(base: string, locale: string): string {
  return `${base}${loginPath(locale)}`;
}

/** Giriş + yeniden OAuth tetikleyici (shopify-reauth sonrası) */
export function loginUrlWithShopifyOAuth(base: string, locale: string): string {
  return `${base}${loginPath(locale)}?shopifyOAuth=1`;
}

/** Ana sayfa — next-intl localePrefix ile uyumlu */
export function homeUrlAbsolute(base: string, locale: string): string {
  if (locale === routing.defaultLocale) return `${base}/`;
  return `${base}/${locale}`;
}

export function localeFromSearchParam(value: string | null): string {
  if (value && (routing.locales as readonly string[]).includes(value)) return value;
  return routing.defaultLocale;
}

/** Oturum kapatma arayüzü — next-intl localePrefix ile uyumlu */
export function signingOutPath(locale: string): string {
  return locale === routing.defaultLocale ? '/signing-out' : `/${locale}/signing-out`;
}
