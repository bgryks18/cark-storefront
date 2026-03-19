import { ADDRESS_FRAGMENT, IMAGE_FRAGMENT, MONEY_FRAGMENT } from '../fragments';
import { shopifyFetch } from '../client';

import type { CustomerCreateInput, CustomerUserError, ShopifyCustomer } from '../types';

// ─── Queries & Mutations ──────────────────────────────────────────────────────

const CUSTOMER_QUERY = `#graphql
  query Customer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      email
      firstName
      lastName
      displayName
      phone
      acceptsMarketing
      createdAt
      defaultAddress { ...AddressFields }
      addresses(first: 10) {
        edges {
          cursor
          node { ...AddressFields }
        }
        pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
      }
      orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          cursor
          node {
            id
            name
            processedAt
            financialStatus
            fulfillmentStatus
            totalPrice { ...MoneyFields }
            subtotalPrice { ...MoneyFields }
            totalShippingPrice { ...MoneyFields }
            lineItems(first: 50) {
              edges {
                cursor
                node {
                  title
                  quantity
                  variant {
                    id
                    title
                    price { ...MoneyFields }
                    image { ...ImageFields }
                  }
                }
              }
              pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
            }
          }
        }
        pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
      }
    }
  }
  ${ADDRESS_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;

const CUSTOMER_CREATE_MUTATION = `#graphql
  mutation CustomerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
      }
      customerUserErrors {
        field
        message
        code
      }
    }
  }
`;

const CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION = `#graphql
  mutation CustomerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        field
        message
        code
      }
    }
  }
`;

const CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION = `#graphql
  mutation CustomerAccessTokenDelete($customerAccessToken: String!) {
    customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
      deletedAccessToken
      userErrors { field message }
    }
  }
`;

const CUSTOMER_UPDATE_MUTATION = `#graphql
  mutation CustomerUpdate(
    $customerAccessToken: String!
    $customer: CustomerUpdateInput!
  ) {
    customerUpdate(
      customerAccessToken: $customerAccessToken
      customer: $customer
    ) {
      customer {
        id
        email
        firstName
        lastName
        phone
        acceptsMarketing
      }
      customerUserErrors { field message code }
    }
  }
`;

const CUSTOMER_RECOVER_MUTATION = `#graphql
  mutation CustomerRecover($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors { field message code }
    }
  }
`;

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

function throwIfCustomerErrors(errors: CustomerUserError[], context: string): void {
  if (errors.length > 0) {
    const messages = errors.map((e) => e.message).join(', ');
    throw new Error(`[Customer ${context}] ${messages}`);
  }
}

// ─── Fonksiyonlar ─────────────────────────────────────────────────────────────

export async function getCustomer(customerAccessToken: string): Promise<ShopifyCustomer | null> {
  const data = await shopifyFetch<{ customer: ShopifyCustomer | null }>(
    CUSTOMER_QUERY,
    { customerAccessToken },
    { cache: 'no-store' },
  );

  return data.customer;
}

export async function createCustomer(
  input: CustomerCreateInput,
): Promise<{ id: string; email: string }> {
  const data = await shopifyFetch<{
    customerCreate: {
      customer: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
      customerUserErrors: CustomerUserError[];
    };
  }>(CUSTOMER_CREATE_MUTATION, { input }, { cache: 'no-store' });

  throwIfCustomerErrors(data.customerCreate.customerUserErrors, 'create');

  if (!data.customerCreate.customer) {
    throw new Error('[Customer create] Müşteri oluşturulamadı');
  }

  return data.customerCreate.customer;
}

export async function createCustomerAccessToken(
  email: string,
  password: string,
): Promise<{ accessToken: string; expiresAt: string }> {
  const data = await shopifyFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: { accessToken: string; expiresAt: string } | null;
      customerUserErrors: CustomerUserError[];
    };
  }>(CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION, { input: { email, password } }, { cache: 'no-store' });

  throwIfCustomerErrors(data.customerAccessTokenCreate.customerUserErrors, 'accessTokenCreate');

  if (!data.customerAccessTokenCreate.customerAccessToken) {
    throw new Error('[Customer] Giriş başarısız');
  }

  return data.customerAccessTokenCreate.customerAccessToken;
}

export async function deleteCustomerAccessToken(accessToken: string): Promise<void> {
  await shopifyFetch(CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION, {
    customerAccessToken: accessToken,
  }, { cache: 'no-store' });
}

export async function updateCustomer(
  customerAccessToken: string,
  customer: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    acceptsMarketing?: boolean;
  },
): Promise<void> {
  const data = await shopifyFetch<{
    customerUpdate: {
      customer: { id: string } | null;
      customerUserErrors: CustomerUserError[];
    };
  }>(CUSTOMER_UPDATE_MUTATION, { customerAccessToken, customer }, { cache: 'no-store' });

  throwIfCustomerErrors(data.customerUpdate.customerUserErrors, 'update');
}

export async function recoverCustomerPassword(email: string): Promise<void> {
  const data = await shopifyFetch<{
    customerRecover: { customerUserErrors: CustomerUserError[] };
  }>(CUSTOMER_RECOVER_MUTATION, { email }, { cache: 'no-store' });

  throwIfCustomerErrors(data.customerRecover.customerUserErrors, 'recover');
}
