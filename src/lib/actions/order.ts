'use server';

import { getOrderByIdAndEmail } from '@/lib/shopify/admin';

export async function trackOrder(email: string, orderId: string) {
  return getOrderByIdAndEmail(orderId, email);
}
