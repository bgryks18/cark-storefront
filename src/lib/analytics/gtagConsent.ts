/** Google Consent Mode v2 — güncelleme yüklenene kadar kısa aralıklarla dener */
export function applyGtagConsentUpdate(granted: boolean, opts?: { onApplied?: () => void }): void {
  if (typeof window === 'undefined') return;

  const payload = granted
    ? {
        ad_storage: 'granted' as const,
        analytics_storage: 'granted' as const,
        ad_user_data: 'granted' as const,
        ad_personalization: 'granted' as const,
      }
    : {
        ad_storage: 'denied' as const,
        analytics_storage: 'denied' as const,
        ad_user_data: 'denied' as const,
        ad_personalization: 'denied' as const,
      };

  function tryOnce(): boolean {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', payload);
      opts?.onApplied?.();
      return true;
    }
    return false;
  }

  if (tryOnce()) return;

  let attempts = 0;
  const maxAttempts = 50;
  const id = window.setInterval(() => {
    attempts += 1;
    if (tryOnce() || attempts >= maxAttempts) {
      window.clearInterval(id);
    }
  }, 100);
}
