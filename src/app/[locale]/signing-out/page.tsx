import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';

import { SigningOutClient } from '@/components/auth/SigningOutClient';
import { isSameOriginAsApp, parseSignOutTransferToken } from '@/lib/auth/signOutTransferToken';

interface SigningOutPageProps {
  searchParams: Promise<{ c?: string }>;
}

function appOriginForValidation(): string {
  const u = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (u) {
    try {
      return new URL(u).origin;
    } catch {
      /* fall through */
    }
  }
  return '';
}

export default async function SigningOutPage({ searchParams }: SigningOutPageProps) {
  const { c } = await searchParams;
  const locale = await getLocale();
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!c || !secret) {
    redirect(locale === 'en' ? '/en' : '/');
  }

  const rawUrl = parseSignOutTransferToken(c);
  const origin = appOriginForValidation();
  if (!rawUrl || !origin || !isSameOriginAsApp(rawUrl, origin)) {
    redirect(locale === 'en' ? '/en' : '/');
  }

  return <SigningOutClient callbackUrl={rawUrl} />;
}

export async function generateMetadata() {
  return { title: 'Signing out' };
}
