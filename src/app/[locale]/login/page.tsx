import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LoginPageClient } from './LoginPageClient';

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.login' });

  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

export default function LoginPage() {
  return <LoginPageClient />;
}
