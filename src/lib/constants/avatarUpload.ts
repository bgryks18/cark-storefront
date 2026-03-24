/** Uygulama üst sınırı — client + server doğrulaması; Next `serverActions.bodySizeLimit` bundan büyük olmalı */
export const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp' as const;

export const AVATAR_MIME_SET = new Set(['image/jpeg', 'image/png', 'image/webp']);
