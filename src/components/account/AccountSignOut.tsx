'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function AccountSignOut({ label }: { label: string }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-gray-light hover:text-text-base"
    >
      <LogOut className="h-4 w-4" />
      {label}
    </button>
  );
}
