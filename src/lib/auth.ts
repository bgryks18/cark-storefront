import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

import { refreshCustomerAccountToken } from '@/lib/shopify/customerAccount';

const shopId = process.env.SHOPIFY_SHOP_ID!;

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'shopify-customer',
      name: 'Shopify',
      type: 'oauth',
      clientId: process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID,
      authorization: {
        url: `https://shopify.com/authentication/${shopId}/oauth/authorize`,
        params: { scope: 'openid email customer-account-api:full' },
      },
      token: {
        url: `https://shopify.com/authentication/${shopId}/oauth/token`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async request(context: any) {
          const { params, checks, provider } = context as {
            params: Record<string, string | undefined>;
            checks: { code_verifier?: string };
            provider: { clientId?: string; callbackUrl?: string };
          };
          const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code: params.code ?? '',
            redirect_uri: provider.callbackUrl ?? '',
            client_id: provider.clientId ?? '',
          });
          if (checks.code_verifier) body.set('code_verifier', checks.code_verifier);
          const res = await fetch(`https://shopify.com/authentication/${shopId}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
          });
          const tokens = await res.json();
          return { tokens };
        },
      },
      userinfo: {
        async request({ tokens }: { tokens: { id_token?: string; access_token?: string } }) {
          if (tokens.id_token) {
            return JSON.parse(
              Buffer.from(tokens.id_token.split('.')[1], 'base64').toString('utf-8'),
            ) as { sub: string; email?: string; given_name?: string; family_name?: string };
          }
          return { sub: String(tokens.access_token) };
        },
      },
      profile(profile: { sub: string; email?: string; given_name?: string; family_name?: string }) {
        const name =
          [profile.given_name, profile.family_name].filter(Boolean).join(' ') ||
          profile.email ||
          '';
        return { id: profile.sub, email: profile.email ?? '', name };
      },
      checks: ['pkce', 'state'],
    },
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, account, user }): Promise<JWT> {
      // İlk giriş
      if (account) {
        token.shopifyAccessToken = account.access_token as string | undefined;
        token.shopifyRefreshToken = account.refresh_token ?? undefined;
        if (typeof account.id_token === 'string') {
          token.shopifyIdToken = account.id_token;
        }
        const exp = account.expires_at as number | undefined;
        if (exp) {
          token.shopifyTokenExpiry = exp < 1e12 ? exp * 1000 : exp;
        } else {
          token.shopifyTokenExpiry = Date.now() + 3600 * 1000;
        }
        if (user) {
          if (typeof user.email === 'string') token.email = user.email;
          if (typeof user.name === 'string') token.name = user.name;
        }
        return token;
      }

      // Token hâlâ geçerli
      if (Date.now() < (token.shopifyTokenExpiry ?? 0)) {
        return token;
      }

      // Token süresi dolmuş — yenile
      if (token.shopifyRefreshToken) {
        const refreshed = await refreshCustomerAccountToken(token.shopifyRefreshToken);
        if (refreshed) {
          token.shopifyAccessToken = refreshed.access_token;
          token.shopifyRefreshToken = refreshed.refresh_token ?? token.shopifyRefreshToken;
          token.shopifyTokenExpiry = Date.now() + refreshed.expires_in * 1000;
          return token;
        }
      }

      // Yenileme başarısız
      token.shopifyAccessToken = null;
      token.error = 'RefreshTokenError';
      return token;
    },

    async session({ session, token }) {
      if (token.shopifyAccessToken) {
        session.shopifyAccessToken = token.shopifyAccessToken;
      } else {
        delete session.shopifyAccessToken;
      }
      return session;
    },
  },
};
