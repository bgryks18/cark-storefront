'use server';

import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { getOrderByIdAndEmail } from '@/lib/shopify/admin';
import { getCustomerAccount } from '@/lib/shopify/customerAccount';
import { flattenConnection } from '@/lib/shopify/normalize';

export async function trackOrder(email: string, orderId: string) {
  return getOrderByIdAndEmail(orderId, email);
}

export async function getOrdersAction() {
  const session = await getServerSession(authOptions);
  if (!session?.shopifyAccessToken) return null;

  const customer = await getCustomerAccount(session.shopifyAccessToken);
  if (!customer) return null;

  return flattenConnection(customer.orders);
}
