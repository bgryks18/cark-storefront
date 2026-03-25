'use server';

import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { getOrderByIdAndEmail } from '@/lib/shopify/admin';
import { getCustomerAccount, getCustomerOrders } from '@/lib/shopify/customerAccount';
import { flattenConnection } from '@/lib/shopify/normalize';

export async function trackOrder(email: string, orderId: string) {
  return getOrderByIdAndEmail(orderId, email);
}

export async function getOrdersAction() {
  const session = await getServerSession(authOptions);
  if (!session?.shopifyAccessToken) return null;

  return getCustomerOrders(session.shopifyAccessToken);
}

export async function getOrderDetailAction(encodedId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.shopifyAccessToken) return null;

  let decodedId: string;
  try {
    decodedId = atob(decodeURIComponent(encodedId));
  } catch {
    return null;
  }

  const customer = await getCustomerAccount(session.shopifyAccessToken);
  if (!customer) return null;

  const order = flattenConnection(customer.orders).find((o) => o.id === decodedId) ?? null;
  if (!order) return null;

  return { ...order, lineItems: flattenConnection(order.lineItems) };
}
