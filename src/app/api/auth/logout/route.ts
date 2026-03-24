import { NextRequest, NextResponse } from 'next/server';

import {
  SHOPIFY_LOGOUT_FLOW_COOKIE,
  SHOPIFY_LOGOUT_LOCALE_COOKIE,
  parseShopifyLogoutFlow,
} from '@/lib/auth/shopifyLogoutLocaleCookie';
import { createSignOutTransferToken } from '@/lib/auth/signOutTransferToken';
import {
  appBaseUrl,
  homeUrlAbsolute,
  localeFromSearchParam,
  loginUrlPlain,
  loginUrlWithShopifyOAuth,
  signingOutPath,
} from '@/lib/siteUrls';

/**
 * Shopify IdP post_logout_redirect_uri. Yalnızca 302 — HTML/JSON gövde yok.
 * Hedef: temalı /signing-out?c=… (token yoksa locale ana sayfa).
 *
 * Customer Account API → Logout URI: {NEXTAUTH_URL}/api/auth/logout
 */
export async function GET(request: NextRequest) {
  const base = appBaseUrl(request);
  const fromCookie = request.cookies.get(SHOPIFY_LOGOUT_LOCALE_COOKIE)?.value;
  const locale = localeFromSearchParam(fromCookie ?? request.nextUrl.searchParams.get('locale'));
  const flow = parseShopifyLogoutFlow(request.cookies.get(SHOPIFY_LOGOUT_FLOW_COOKIE)?.value);

  let targetUrl: string;
  switch (flow) {
    case 'home':
      targetUrl = homeUrlAbsolute(base, locale);
      break;
    case 'login':
      targetUrl = loginUrlPlain(base, locale);
      break;
    default:
      targetUrl = loginUrlWithShopifyOAuth(base, locale);
  }

  const token = createSignOutTransferToken(targetUrl);
  const path = signingOutPath(locale);
  const redirectTo = new URL(path, `${base}/`);

  let res: NextResponse;
  if (token) {
    redirectTo.searchParams.set('c', token);
    res = NextResponse.redirect(redirectTo.toString());
  } else {
    res = NextResponse.redirect(homeUrlAbsolute(base, locale));
  }

  res.cookies.delete(SHOPIFY_LOGOUT_LOCALE_COOKIE);
  res.cookies.delete(SHOPIFY_LOGOUT_FLOW_COOKIE);
  return res;
}
