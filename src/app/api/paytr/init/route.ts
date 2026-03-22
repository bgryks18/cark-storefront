import { NextRequest, NextResponse } from 'next/server';

import { getCart } from '@/lib/shopify/queries/cart';
import { getCartLines } from '@/lib/shopify/normalize';
import { getPayTRToken, buildPayTRUrl } from '@/lib/paytr';
import { createDraftOrder, deleteDraftOrder, getShippingRates } from '@/lib/shopify/admin';

interface InitBody {
  cartId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  shippingTitle: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as InitBody;
  const { cartId, firstName, lastName, email, phone, address, city, zip, shippingTitle } = body;

  if (!cartId || !firstName || !lastName || !email || !phone || !address || !city || !shippingTitle) {
    return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
  }

  const cart = await getCart(cartId);
  if (!cart || getCartLines(cart).length === 0) {
    return NextResponse.json({ error: 'Sepet bulunamadı veya boş' }, { status: 400 });
  }

  // Kargo ücretini Shopify'dan doğrula — client'a güvenme
  const rates = await getShippingRates();
  const shipping = rates.find((r) => r.title === shippingTitle);
  if (!shipping) {
    return NextResponse.json({ error: 'Geçersiz kargo seçeneği' }, { status: 400 });
  }

  const lines = getCartLines(cart);

  // PayTR'a göndereceğimiz tutar: ürün toplamı + kargo (kuruş cinsinden)
  const subtotalTL = parseFloat(cart.cost.totalAmount.amount);
  const totalTL = subtotalTL + shipping.price;
  const totalKurus = Math.round(totalTL * 100);

  const lineItems = lines.map((line) => ({
    variantId: line.merchandise.id,
    quantity: line.quantity,
    price: line.cost.amountPerQuantity.amount,
    title: `${line.merchandise.product.title}${line.merchandise.title !== 'Default Title' ? ' - ' + line.merchandise.title : ''}`,
  }));

  const basket = [
    ...lines.map((line) => ({
      name: line.merchandise.product.title.substring(0, 100),
      price: parseFloat(line.cost.amountPerQuantity.amount).toFixed(2),
      quantity: line.quantity,
    })),
    {
      name: shipping.title,
      price: shipping.price.toFixed(2),
      quantity: 1,
    },
  ];

  // Önce Shopify'da draft order oluştur
  const baseOid = `CARK${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  let draftOrderId: number;
  try {
    const draft = await createDraftOrder({
      lineItems,
      email,
      firstName,
      lastName,
      phone,
      address,
      city,
      zip,
      shippingTitle: shipping.title,
      shippingPrice: shipping.price.toFixed(2),
      merchantOid: baseOid,
    });
    draftOrderId = draft.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sipariş hazırlanamadı';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Draft order ID'yi merchantOid'e göm: CARK..._{draftOrderId}
  const merchantOid = `${baseOid}_${draftOrderId}`;

  const userIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://carkzimpara.com';

  let token: string;
  try {
    token = await getPayTRToken({
      userIp,
      merchantOid,
      email,
      paymentAmountKurus: totalKurus,
      basket,
      userName: `${firstName} ${lastName}`,
      userAddress: `${address}, ${city}${zip ? ' ' + zip : ''}`,
      userPhone: phone,
      okUrl: `${siteUrl}/checkout/success`,
      failUrl: `${siteUrl}/checkout/failure`,
    });
  } catch (err) {
    // PayTR token alınamadıysa draft order'ı temizle
    void deleteDraftOrder(draftOrderId);
    const msg = err instanceof Error ? err.message : 'PayTR hatası';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  return NextResponse.json({ paytrUrl: buildPayTRUrl(token) });
}
