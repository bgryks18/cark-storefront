import { NextRequest, NextResponse } from 'next/server';

import { getCompletedOrderName } from '@/lib/shopify/admin';

export async function GET(req: NextRequest) {
  const draftId = req.nextUrl.searchParams.get('draftId');
  if (!draftId) return NextResponse.json({ error: 'Missing draftId' }, { status: 400 });

  const result = await getCompletedOrderName(draftId);
  if (!result) return NextResponse.json({ error: 'Not ready' }, { status: 404 });

  return NextResponse.json(result);
}
