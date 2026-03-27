import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.carkzimpara.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/account', '/account/', '/cart', '/checkout', '/checkout/', '/login', '/search', '/signing-out'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
