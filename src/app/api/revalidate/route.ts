import crypto from 'crypto';
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const secret = process.env.SHOPIFY_REVALIDATION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'SHOPIFY_REVALIDATION_SECRET tanımlanmamış' }, { status: 500 });
  }

  const hmac = req.headers.get('x-shopify-hmac-sha256');
  const body = await req.text();

  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64');

  if (hmac !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const topic = req.headers.get('x-shopify-topic') ?? '';

  let data: { handle?: string } = {};
  try {
    data = JSON.parse(body) as { handle?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (topic.startsWith('products/')) {
    revalidateTag('products', 'max');
    if (data.handle) revalidateTag(`product-${data.handle}`, 'max');
  } else if (topic.startsWith('collections/')) {
    revalidateTag('collections', 'max');
    if (data.handle) revalidateTag(`collection-${data.handle}`, 'max');
  }

  return NextResponse.json({ revalidated: true, topic });
}
