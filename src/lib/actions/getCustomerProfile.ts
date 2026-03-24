'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getCustomerAccount } from '@/lib/shopify/customerAccount';

export type CustomerProfile = {
  firstName: string;
  lastName: string;
  email: string;
};

export async function getCustomerProfileAction(): Promise<CustomerProfile | null> {
  const session = await getServerSession(authOptions);
  if (!session?.shopifyAccessToken || !session.user?.email) return null;

  const customer = await getCustomerAccount(session.shopifyAccessToken);
  if (!customer) return null;

  return {
    firstName: customer.firstName ?? '',
    lastName: customer.lastName ?? '',
    email: session.user.email,
  };
}
