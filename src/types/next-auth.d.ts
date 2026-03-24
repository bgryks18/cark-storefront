import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    shopifyAccessToken?: string;
  }

  interface User {
    shopifyAccessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    shopifyAccessToken?: string | null;
    shopifyRefreshToken?: string;
    shopifyTokenExpiry?: number;
    /** Son OAuth yanıtındaki id_token — Shopify IdP çıkışı (end_session) için gerekli */
    shopifyIdToken?: string;
    error?: string;
  }
}
