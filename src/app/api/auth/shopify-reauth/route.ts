import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import {
  attachShopifyLogoutFlowCookie,
  attachShopifyLogoutLocaleCookie,
} from '@/lib/auth/shopifyLogoutLocaleCookie';
import { appBaseUrl, localeFromSearchParam, loginUrlWithShopifyOAuth } from '@/lib/siteUrls';

const shopId = process.env.SHOPIFY_SHOP_ID;
const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;

/**
 * "Shopify ile giriş" öncesi: mümkünse Shopify IdP oturumunu kapatır (id_token_hint),
 * sonra yerel NextAuth oturumunu siler ve login sayfasında OAuth yeniden başlar.
 *
 * Customer Account API → Logout URI: {NEXTAUTH_URL}/api/auth/logout (sorgusuz)
 */
export async function GET(request: NextRequest) {
  const base = appBaseUrl(request);
  const locale = localeFromSearchParam(request.nextUrl.searchParams.get('locale'));
  const loginUrl = loginUrlWithShopifyOAuth(base, locale);
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

  if (!secret || !shopId || !clientId) {
    return NextResponse.redirect(loginUrl);
  }

  const token = await getToken({ req: request, secret });
  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  const afterIdpBridge = `${base}/api/auth/logout`;

  if (token.shopifyIdToken) {
    const logout = new URL(`https://shopify.com/authentication/${shopId}/logout`);
    logout.searchParams.set('client_id', clientId);
    logout.searchParams.set('id_token_hint', token.shopifyIdToken);
    logout.searchParams.set('post_logout_redirect_uri', afterIdpBridge);
    const res = NextResponse.redirect(logout.toString());
    attachShopifyLogoutLocaleCookie(res, locale);
    attachShopifyLogoutFlowCookie(res, 'reauth');
    return res;
  }

  const res = NextResponse.redirect(afterIdpBridge);
  attachShopifyLogoutLocaleCookie(res, locale);
  attachShopifyLogoutFlowCookie(res, 'reauth');
  return res;
}
