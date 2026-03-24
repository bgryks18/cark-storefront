'use client';

import { useState } from 'react';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

import { ModalProvider } from '@/contexts/ModalContext';

interface ProvidersProps {
  children: React.ReactNode;
  /** Sunucudan gelirse ilk boyamada client /api/auth/session beklenmez */
  session: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 dakika
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  /** Oturum aç/kapa sonrası sunucu session'ı değişir; SessionProvider iç state'i prop ile senkron tutmaz — key ile remount. */
  const sessionKey = session?.shopifyAccessToken ? 'shopify' : 'guest';

  return (
    <SessionProvider key={sessionKey} session={session} refetchOnWindowFocus={false}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
        <QueryClientProvider client={queryClient}>
          <ModalProvider>{children}</ModalProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
