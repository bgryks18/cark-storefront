import { NextResponse } from 'next/server';

import { getShippingRates } from '@/lib/shopify/admin';

// Shopify rate isminden açıklama eşleştirme (sadece bu dosyada yönetilir)
const RATE_DESCRIPTIONS: Record<string, string> = {
  Standart: '3-5 iş günü',
  Hızlı: '1-2 iş günü',
};

export async function GET() {
  try {
    const rates = await getShippingRates();
    const result = rates.map((r) => ({
      ...r,
      description: RATE_DESCRIPTIONS[r.title] ?? '',
    }));
    return NextResponse.json({ rates: result });
  } catch {
    return NextResponse.json({ error: 'Kargo seçenekleri alınamadı' }, { status: 502 });
  }
}
