import crypto from 'crypto';

const PAYTR_TOKEN_URL = 'https://www.paytr.com/odeme/api/get-token';

function getConfig() {
  return {
    merchantId: process.env.PAYTR_MERCHANT_ID!,
    merchantKey: process.env.PAYTR_MERCHANT_KEY!,
    merchantSalt: process.env.PAYTR_MERCHANT_SALT!,
    testMode: process.env.NODE_ENV !== 'production' ? '1' : '0',
  };
}

export interface PayTRBasketItem {
  name: string;
  price: string; // "29.90" gibi string
  quantity: number;
}

interface TokenParams {
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmountKurus: number;
  basket: PayTRBasketItem[];
  userName: string;
  userAddress: string;
  userPhone: string;
  okUrl: string;
  failUrl: string;
}

export async function getPayTRToken(params: TokenParams): Promise<string> {
  const { merchantId, merchantKey, merchantSalt, testMode } = getConfig();
  const {
    userIp, merchantOid, email, paymentAmountKurus,
    basket, userName, userAddress, userPhone, okUrl, failUrl,
  } = params;

  const noInstallment = '1';
  const maxInstallment = '0';
  const currency = 'TL';

  const userBasket = Buffer.from(
    JSON.stringify(basket.map(i => [i.name, i.price, i.quantity])),
  ).toString('base64');

  const hashStr = `${merchantId}${userIp}${merchantOid}${email}${paymentAmountKurus}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}${merchantSalt}`;

  const paytrToken = crypto
    .createHmac('sha256', merchantKey)
    .update(hashStr)
    .digest('base64');

  const body = new URLSearchParams({
    merchant_id: merchantId,
    user_ip: userIp,
    merchant_oid: merchantOid,
    email,
    payment_amount: String(paymentAmountKurus),
    user_basket: userBasket,
    no_installment: noInstallment,
    max_installment: maxInstallment,
    currency,
    test_mode: testMode,
    user_name: userName,
    user_address: userAddress,
    user_phone: userPhone,
    merchant_ok_url: okUrl,
    merchant_fail_url: failUrl,
    paytr_token: paytrToken,
    debug_on: testMode,
    lang: 'tr',
    timeout_limit: '30',
  });

  const response = await fetch(PAYTR_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const rawText = await response.text();
  console.log('[PayTR token response]', response.status, rawText);

  let data: { status: string; token?: string; reason?: string };
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`PayTR geçersiz yanıt: ${rawText.substring(0, 200)}`);
  }

  if (data.status !== 'success' || !data.token) {
    throw new Error(data.reason ?? 'PayTR token alınamadı');
  }

  return data.token;
}

export function buildPayTRUrl(token: string): string {
  return `https://www.paytr.com/odeme/guvenli/${token}`;
}

export function verifyPayTRNotification(
  merchantOid: string,
  status: string,
  totalAmount: string,
  receivedHash: string,
): boolean {
  const { merchantKey, merchantSalt } = getConfig();
  const hashStr = `${merchantOid}${merchantSalt}${status}${totalAmount}`;
  const expectedHash = crypto
    .createHmac('sha256', merchantKey)
    .update(hashStr)
    .digest('base64');
  return expectedHash === receivedHash;
}
