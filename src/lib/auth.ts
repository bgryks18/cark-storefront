import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { createCustomerAccessToken, getCustomer } from '@/lib/shopify/queries/customer';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'E-posta', type: 'email' },
        password: { label: 'Şifre', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        try {
          const { accessToken } = await createCustomerAccessToken(
            credentials.email,
            credentials.password,
          );
          const customer = await getCustomer(accessToken);
          if (!customer) return null;
          return {
            id: customer.id,
            email: customer.email,
            name: customer.displayName,
            shopifyAccessToken: accessToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'shopifyAccessToken' in user) {
        token.shopifyAccessToken = user.shopifyAccessToken as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.shopifyAccessToken) {
        session.shopifyAccessToken = token.shopifyAccessToken as string;
      }
      return session;
    },
  },
};
