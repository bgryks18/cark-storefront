import type { NextResponse } from 'next/server';

/** Shopify logout → /api/auth/logout dönüşünde dil (URL’de query kullanmıyoruz) */
export const SHOPIFY_LOGOUT_LOCALE_COOKIE = 'shopify_logout_locale';

/** Çıkış sonrası yönlendirme: reauth | home | login — tek Logout URI için query yerine çerez */
export const SHOPIFY_LOGOUT_FLOW_COOKIE = 'shopify_logout_flow';

export type ShopifyLogoutFlow = 'reauth' | 'home' | 'login';

const FLOW_VALUES: readonly ShopifyLogoutFlow[] = ['reauth', 'home', 'login'];

function cookieSecure(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.NEXTAUTH_URL?.startsWith('https://') === true
  );
}

function setShortLived(res: NextResponse, name: string, value: string): void {
  res.cookies.set(name, value, {
    path: '/',
    maxAge: 120,
    sameSite: 'lax',
    httpOnly: true,
    secure: cookieSecure(),
  });
}

export function attachShopifyLogoutLocaleCookie(res: NextResponse, locale: string): void {
  setShortLived(res, SHOPIFY_LOGOUT_LOCALE_COOKIE, locale);
}

export function attachShopifyLogoutFlowCookie(res: NextResponse, flow: ShopifyLogoutFlow): void {
  setShortLived(res, SHOPIFY_LOGOUT_FLOW_COOKIE, flow);
}

export function parseShopifyLogoutFlow(value: string | undefined): ShopifyLogoutFlow {
  if (value && (FLOW_VALUES as readonly string[]).includes(value)) {
    return value as ShopifyLogoutFlow;
  }
  return 'reauth';
}
