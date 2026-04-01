import { type NextRequest, NextResponse } from 'next/server';

import { flattenConnection } from '@/lib/shopify/normalize';
import { getCollection } from '@/lib/shopify/queries/collection';
import type { SortKey } from '@/lib/shopify/types';

const SORT_MAP: Record<string, { sortKey: SortKey; reverse: boolean }> = {
  manual: { sortKey: 'MANUAL', reverse: false },
  bestSelling: { sortKey: 'BEST_SELLING', reverse: false },
  titleAsc: { sortKey: 'TITLE', reverse: false },
  titleDesc: { sortKey: 'TITLE', reverse: true },
  priceAsc: { sortKey: 'PRICE', reverse: false },
  priceDesc: { sortKey: 'PRICE', reverse: true },
  createdDesc: { sortKey: 'CREATED', reverse: true },
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get('handle') ?? '';
  const after = searchParams.get('after') ?? undefined;
  const sort = searchParams.get('sort') ?? 'manual';
  const locale = searchParams.get('locale') ?? 'tr';
  const filterParams = searchParams.getAll('filter');

  const { sortKey, reverse } = SORT_MAP[sort] ?? SORT_MAP.manual;
  const filters = filterParams.flatMap((f) => {
    try { return [JSON.parse(f) as Record<string, unknown>]; } catch { return []; }
  });

  try {
    const collection = await getCollection({
      handle,
      first: 8,
      after,
      sortKey,
      reverse,
      locale,
      filters: filters.length ? filters : undefined,
    });

    if (!collection) return NextResponse.json({ error: 'Koleksiyon bulunamadı' }, { status: 404 });

    return NextResponse.json({
      products: flattenConnection(collection.products),
      pageInfo: collection.products.pageInfo,
    });
  } catch {
    return NextResponse.json({ error: 'Ürünler alınamadı' }, { status: 500 });
  }
}
