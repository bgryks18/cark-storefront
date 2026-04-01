import { type NextRequest, NextResponse } from 'next/server';

import { getShippingRates } from '@/lib/shopify/admin';

export async function GET(req: NextRequest) {
  const subtotalParam = req.nextUrl.searchParams.get('subtotal');
  const cartSubtotal = subtotalParam ? parseFloat(subtotalParam) : undefined;

  try {
    const rates = await getShippingRates(cartSubtotal);
    return NextResponse.json({ rates });
  } catch {
    return NextResponse.json({ error: 'Kargo seçenekleri alınamadı' }, { status: 502 });
  }
}
