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
    shopifyAccessToken?: string;
  }
}
