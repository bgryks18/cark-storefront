import { type NextRequest, NextResponse } from 'next/server';

import { flattenConnection } from '@/lib/shopify/normalize';
import { getProducts } from '@/lib/shopify/queries/product';

export async function GET(req: NextRequest) {
  const after = req.nextUrl.searchParams.get('after') ?? undefined;
  const first = 8;

  try {
    const connection = await getProducts({ first, after, sortKey: 'BEST_SELLING' });
    return NextResponse.json({
      products: flattenConnection(connection),
      pageInfo: connection.pageInfo,
    });
  } catch {
    return NextResponse.json({ error: 'Ürünler alınamadı' }, { status: 500 });
  }
}
