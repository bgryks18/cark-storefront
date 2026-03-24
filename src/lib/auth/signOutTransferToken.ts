import { createHmac, timingSafeEqual } from 'crypto';

const MAX_AGE_MS = 5 * 60 * 1000;

function secret(): string {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? '';
}

export function createSignOutTransferToken(callbackUrl: string): string | null {
  const s = secret();
  if (!s) return null;
  const payload = Buffer.from(
    JSON.stringify({ u: callbackUrl, exp: Date.now() + MAX_AGE_MS }),
    'utf-8',
  ).toString('base64url');
  const sig = createHmac('sha256', s).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function parseSignOutTransferToken(token: string): string | null {
  const s = secret();
  if (!s || !token) return null;
  const lastDot = token.lastIndexOf('.');
  if (lastDot <= 0) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac('sha256', s).update(payload).digest('base64url');
  try {
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }
  let data: { u?: string; exp?: number };
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as { u?: string; exp?: number };
  } catch {
    return null;
  }
  if (typeof data.u !== 'string' || typeof data.exp !== 'number') return null;
  if (Date.now() > data.exp) return null;
  return data.u;
}

export function isSameOriginAsApp(callbackUrl: string, appOrigin: string): boolean {
  try {
    return new URL(callbackUrl).origin === new URL(appOrigin).origin;
  } catch {
    return false;
  }
}
