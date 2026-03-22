import { NextRequest, NextResponse } from 'next/server';

import { getOrderByIdAndEmail } from '@/lib/shopify/admin';

export async function POST(req: NextRequest) {
  const { email, orderId } = (await req.json()) as { email?: string; orderId?: string };

  if (!email || !orderId) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  try {
    const order = await getOrderByIdAndEmail(orderId, email);
    if (!order) {
      return NextResponse.json({ order: null });
    }
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 502 });
  }
}
