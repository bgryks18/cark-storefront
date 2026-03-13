import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['tr', 'en'],
  defaultLocale: 'tr',
  // "/" → Türkçe (prefix yok), "/en" → İngilizce
  localePrefix: {
    mode: 'as-needed',
  },
});

export type Locale = (typeof routing.locales)[number];
