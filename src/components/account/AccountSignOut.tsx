'use client';

import { useLocale } from 'next-intl';
import { LogOut } from 'lucide-react';

export function AccountSignOut({ label }: { label: string }) {
  const locale = useLocale();
  const href = `/api/auth/shopify-customer-logout?locale=${encodeURIComponent(locale)}&dest=home`;

  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-gray-light hover:text-text-base"
    >
      <LogOut className="h-4 w-4" />
      {label}
    </a>
  );
}
