'use server';

import { createCustomer } from '@/lib/shopify/queries/customer';

export type CustomerCreateInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export async function registerCustomer(input: CustomerCreateInput) {
  return createCustomer(input);
}
