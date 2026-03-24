import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

import {
  attachShopifyLogoutFlowCookie,
  attachShopifyLogoutLocaleCookie,
  type ShopifyLogoutFlow,
} from '@/lib/auth/shopifyLogoutLocaleCookie';
import { appBaseUrl, localeFromSearchParam } from '@/lib/siteUrls';

const shopId = process.env.SHOPIFY_SHOP_ID;
const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;

type LogoutDest = 'home' | 'login';

/**
 * Müşteri çıkışı: mümkünse Shopify IdP oturumunu da kapatır, sonra NextAuth köprüsüne döner.
 * Navbar / hesap çıkışı buradan başlamalı.
 *
 * Query: locale (tr|en), dest=home|login (varsayılan home)
 */
export async function GET(request: NextRequest) {
  const base = appBaseUrl(request);
  const locale = localeFromSearchParam(request.nextUrl.searchParams.get('locale'));
  const destParam = request.nextUrl.searchParams.get('dest');
  const dest: LogoutDest = destParam === 'login' ? 'login' : 'home';
  const flow: ShopifyLogoutFlow = dest === 'login' ? 'login' : 'home';
  const afterUrl = `${base}/api/auth/logout`;

  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

  const redirectWithBridgeState = (url: string) => {
    const res = NextResponse.redirect(url);
    attachShopifyLogoutLocaleCookie(res, locale);
    attachShopifyLogoutFlowCookie(res, flow);
    return res;
  };

  if (!secret || !shopId || !clientId) {
    return redirectWithBridgeState(afterUrl);
  }

  const token = await getToken({ req: request, secret });

  if (!token) {
    return redirectWithBridgeState(afterUrl);
  }

  if (token.shopifyIdToken) {
    const logout = new URL(`https://shopify.com/authentication/${shopId}/logout`);
    logout.searchParams.set('client_id', clientId);
    logout.searchParams.set('id_token_hint', token.shopifyIdToken);
    logout.searchParams.set('post_logout_redirect_uri', afterUrl);
    return redirectWithBridgeState(logout.toString());
  }

  return redirectWithBridgeState(afterUrl);
}
