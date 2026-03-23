import type { CustomerUserError } from '@/lib/shopify/types';

/** Shopify Storefront `CustomerErrorCode` + dahili kodlar (`createCustomer` catch). */
export const SHOPIFY_CUSTOMER_ERROR_CODES = [
  'ALREADY_ENABLED',
  'BAD_DOMAIN',
  'BLANK',
  'CONTAINS_HTML_TAGS',
  'CONTAINS_URL',
  'CUSTOMER_DISABLED',
  'INVALID',
  'INVALID_MULTIPASS_REQUEST',
  'NOT_FOUND',
  'PASSWORD_STARTS_OR_ENDS_WITH_WHITESPACE',
  'TAKEN',
  'TOKEN_INVALID',
  'TOO_LONG',
  'TOO_SHORT',
  'UNIDENTIFIED_CUSTOMER',
  'REQUEST_FAILED',
  'INVALID_RESPONSE',
  'NO_CUSTOMER',
  'UNKNOWN',
] as const;

/**
 * Birden fazla hata döndüğünde kullanıcıya tek mesaj: iş açısından en önemli kod öne alınır.
 */
const ERROR_RESOLUTION_ORDER: readonly string[] = [
  'CUSTOMER_DISABLED',
  'TAKEN',
  'ALREADY_ENABLED',
  'TOKEN_INVALID',
  'INVALID_MULTIPASS_REQUEST',
  'PASSWORD_STARTS_OR_ENDS_WITH_WHITESPACE',
  'BAD_DOMAIN',
  'CONTAINS_URL',
  'CONTAINS_HTML_TAGS',
  'TOO_SHORT',
  'TOO_LONG',
  'BLANK',
  'INVALID',
  'NOT_FOUND',
  'UNIDENTIFIED_CUSTOMER',
  'REQUEST_FAILED',
  'INVALID_RESPONSE',
  'NO_CUSTOMER',
];

export const REGISTER_AUTH_ERROR_KEYS = [
  'verifyEmail',
  'emailInUse',
  'alreadyEnabled',
  'passwordTooShort',
  'passwordTooLong',
  'passwordWhitespace',
  'emailInvalidDomain',
  'inputBlank',
  'inputInvalid',
  'inputTooShort',
  'inputTooLong',
  'inputContainsUrl',
  'inputContainsHtml',
  'tokenInvalid',
  'addressNotFound',
  'multipassInvalid',
  'unidentifiedCustomer',
  'shopifyUnavailable',
  'registrationFailed',
  'generic',
] as const;

export type RegisterAuthErrorKey = (typeof REGISTER_AUTH_ERROR_KEYS)[number];

export function isRegisterAuthErrorKey(value: string): value is RegisterAuthErrorKey {
  return (REGISTER_AUTH_ERROR_KEYS as readonly string[]).includes(value);
}

function isPasswordField(error: CustomerUserError): boolean {
  return (error.field ?? []).some((f) => /password/i.test(f));
}

export function pickPrimaryCustomerUserError(errors: CustomerUserError[]): CustomerUserError {
  if (errors.length === 0) {
    return { field: null, message: '', code: 'UNKNOWN' };
  }
  for (const code of ERROR_RESOLUTION_ORDER) {
    const found = errors.find((e) => e.code === code);
    if (found) return found;
  }
  return errors[0];
}

export function mapCustomerUserErrorToAuthKey(error: CustomerUserError): RegisterAuthErrorKey {
  switch (error.code) {
    case 'CUSTOMER_DISABLED':
      return 'verifyEmail';
    case 'TAKEN':
      return 'emailInUse';
    case 'ALREADY_ENABLED':
      return 'alreadyEnabled';
    case 'PASSWORD_STARTS_OR_ENDS_WITH_WHITESPACE':
      return 'passwordWhitespace';
    case 'BAD_DOMAIN':
      return 'emailInvalidDomain';
    case 'BLANK':
      return 'inputBlank';
    case 'INVALID':
      return 'inputInvalid';
    case 'CONTAINS_URL':
      return 'inputContainsUrl';
    case 'CONTAINS_HTML_TAGS':
      return 'inputContainsHtml';
    case 'TOKEN_INVALID':
      return 'tokenInvalid';
    case 'NOT_FOUND':
      return 'addressNotFound';
    case 'INVALID_MULTIPASS_REQUEST':
      return 'multipassInvalid';
    case 'UNIDENTIFIED_CUSTOMER':
      return 'unidentifiedCustomer';
    case 'TOO_SHORT':
      return isPasswordField(error) ? 'passwordTooShort' : 'inputTooShort';
    case 'TOO_LONG':
      return isPasswordField(error) ? 'passwordTooLong' : 'inputTooLong';
    case 'REQUEST_FAILED':
      return 'shopifyUnavailable';
    case 'INVALID_RESPONSE':
    case 'NO_CUSTOMER':
      return 'registrationFailed';
    case 'UNKNOWN':
    default:
      return 'generic';
  }
}
