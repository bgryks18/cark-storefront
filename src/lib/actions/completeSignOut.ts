'use server';

import { headers } from 'next/headers';

import { isSameOriginAsApp } from '@/lib/auth/signOutTransferToken';

function appOrigin(): string {
  const u = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!u) throw new Error('missing site url');
  return new URL(u).origin;
}

/**
 * NextAuth oturumunu sunucuda kapatır (çerezleri istekle iletir).
 * Dönüş URL’si yalnızca uygulama kökenine izin verilir.
 */
export async function completeSignOut(
  callbackUrl: string,
): Promise<{ ok: true; url: string } | { ok: false }> {
  try {
    if (!isSameOriginAsApp(callbackUrl, appOrigin())) {
      return { ok: false };
    }
    const base = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '');
    if (!base) return { ok: false };

    const cookieHeader = (await headers()).get('cookie') ?? '';
    const csrfRes = await fetch(`${base}/api/auth/csrf`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!csrfRes.ok) return { ok: false };

    const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
    if (!csrfJson.csrfToken) return { ok: false };

    const body = new URLSearchParams({
      csrfToken: csrfJson.csrfToken,
      callbackUrl,
      json: 'true',
    });
    const out = await fetch(`${base}/api/auth/signout`, {
      method: 'POST',
      headers: {
        cookie: cookieHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      cache: 'no-store',
    });
    const data = (await out.json().catch(() => ({}))) as { url?: string };
    if (!out.ok) return { ok: false };
    return { ok: true, url: data.url ?? callbackUrl };
  } catch {
    return { ok: false };
  }
}
