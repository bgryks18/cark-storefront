'use server';

import { createCustomer } from '@/lib/shopify/queries/customer';
import {
  mapCustomerUserErrorToAuthKey,
  pickPrimaryCustomerUserError,
  type RegisterAuthErrorKey,
} from '@/lib/shopify/customerAuthErrors';

import type { CustomerUserError } from '@/lib/shopify/types';

export type CustomerCreateInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export type RegisterCustomerResult =
  | { ok: true; customer: { id: string; email: string } }
  | { ok: false; code: RegisterAuthErrorKey };

function classifyRegisterFailure(errors: CustomerUserError[]): RegisterCustomerResult {
  const primary = pickPrimaryCustomerUserError(errors);
  return { ok: false, code: mapCustomerUserErrorToAuthKey(primary) };
}

export async function registerCustomer(input: CustomerCreateInput): Promise<RegisterCustomerResult> {
  const result = await createCustomer(input);
  if (!result.ok) {
    return classifyRegisterFailure(result.errors);
  }
  return { ok: true, customer: result.customer };
}
