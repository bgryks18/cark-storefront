import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Tüm path'leri yakala, sadece Next.js internal ve statik dosyaları hariç tut
    '/((?!_next|_vercel|api|.*\\..*).*)',
  ],
};
