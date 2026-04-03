'use client';

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'cark_cookie_consent';
const LEGACY_STORAGE_KEY = 'cark_analytics_consent';

export type CookieConsentValue = 'accepted' | 'rejected' | null;

type ContextValue = {
  consent: CookieConsentValue | undefined;
  setConsent: (value: CookieConsentValue) => void;
};

const CookieConsentContext = createContext<ContextValue | null>(null);

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<CookieConsentValue>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      let next: CookieConsentValue | null = null;
      const current = window.localStorage.getItem(STORAGE_KEY);
      if (current === 'accepted' || current === 'rejected') {
        next = current;
      } else {
        const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy === 'granted') {
          next = 'accepted';
          window.localStorage.setItem(STORAGE_KEY, 'accepted');
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        } else if (legacy === 'denied') {
          next = 'rejected';
          window.localStorage.setItem(STORAGE_KEY, 'rejected');
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      }
      if (next) setConsentState(next);
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  const setConsent = useCallback((value: CookieConsentValue) => {
    setConsentState(value);
    try {
      if (value) {
        window.localStorage.setItem(STORAGE_KEY, value);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const value: ContextValue = {
    consent: mounted ? consent : undefined,
    setConsent,
  };

  const showBannerPad = mounted && consent === null;

  return (
    <CookieConsentContext.Provider value={value}>
      <div className={showBannerPad ? 'pb-[min(7rem,22vh)]' : undefined}>{children}</div>
    </CookieConsentContext.Provider>
  );
}
