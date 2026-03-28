import sanitizeHtml from 'sanitize-html';

/**
 * Shopify predictive search `styledText` (sorgu vurgusu HTML).
 * Sunucuda DOMPurify yerine kullandığımız sanitize-html ile aynı aile.
 */
export function sanitizeSearchStyledText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['mark', 'strong', 'em', 'b', 'i', 'span'],
    allowedAttributes: {
      span: ['class'],
      mark: ['class'],
    },
  });
}
