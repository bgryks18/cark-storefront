'use client';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { Container } from '@/components/ui/Container';

// Module-level flag: remount sonrası da loading state'i korur
let pendingNavigation = false;

export function NavigationSpinner() {
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const [loading, setLoading] = useState(() => pendingNavigation);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a');
      if (anchor && anchor.href && !anchor.target && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const url = new URL(anchor.href);
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
          pendingNavigation = true;
          setLoading(true);
        }
      }
    };
    const handleNavigationStart = () => {
      pendingNavigation = true;
      setLoading(true);
    };
    document.addEventListener('click', handleClick);
    window.addEventListener('navigation-start', handleNavigationStart);
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('navigation-start', handleNavigationStart);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      pendingNavigation = false;
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed bottom-6 z-50 w-full" role="status" aria-live="polite" aria-label={tCommon('navigating')}>
      <Container className="flex justify-end w-full max-w-360">
        <div className="flex items-center gap-1 bg-surface rounded-full px-3 py-2 shadow-md" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-primary"
              style={{ animation: `navDot 1s ease-in-out ${i * 0.15}s infinite` }}
            />
          ))}
        </div>
      </Container>
    </div>
  );
}
