import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { buildPayTRUrl, getPayTRToken } from '@/lib/paytr';
import { createDraftOrder, deleteDraftOrder, getDraftOrder, getShippingRates, updateDraftOrderNote } from '@/lib/shopify/admin';
import { getCustomerAccount } from '@/lib/shopify/customerAccount';
import { getCartLines } from '@/lib/shopify/normalize';
import { getCart } from '@/lib/shopify/queries/cart';

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
  draftOrderId?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as InitBody;

  // Invoice akışı: draft order zaten var, cart'a gerek yok
  if (body.draftOrderId) {
    const draft = await getDraftOrder(body.draftOrderId);
    if (!draft) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    if (draft.status === 'completed') return NextResponse.json({ error: 'Sipariş zaten tamamlandı' }, { status: 400 });

    const draftOrderId = draft.id;
    const email = draft.email;
    const firstName = draft.shipping_address?.first_name ?? '';
    const lastName = draft.shipping_address?.last_name ?? '';
    const phone = draft.phone ?? draft.shipping_address?.phone ?? draft.billing_address?.phone ?? '';
    const address = `${draft.shipping_address?.address1 ?? ''}, ${draft.shipping_address?.city ?? ''}${draft.shipping_address?.zip ? ' ' + draft.shipping_address.zip : ''}`;

    if (!email || !phone || !draft.shipping_address?.address1 || !draft.shipping_address?.city) {
      return NextResponse.json(
        { error: 'Draft order müşteri bilgileri eksik (e-posta, telefon, adres zorunludur)' },
        { status: 400 },
      );
    }

    const totalPrice = parseFloat(draft.total_price);
    const totalKurus = Math.round(totalPrice * 100);
    if (!Number.isFinite(totalPrice) || totalKurus <= 0) {
      return NextResponse.json(
        { error: 'Bu fatura için ödenecek tutar 0.00 olduğu için ödeme başlatılamıyor' },
        { status: 400 },
      );
    }

    // Discount/line-level farklarda PayTR parametre tutarlılığı için tek kalem gönderilir.
    const basket = [
      {
        name: `Invoice ${draft.name}`.substring(0, 100),
        price: totalPrice.toFixed(2),
        quantity: 1,
      },
    ];

    const baseOid = `CARK${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const merchantOid = `${baseOid}_${draftOrderId}`;
    void updateDraftOrderNote(draft.id, `PayTR: ${merchantOid}`);
    const userIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
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
        userAddress: address,
        userPhone: phone,
        okUrl: `${siteUrl}/checkout/success?source=invoice`,
        failUrl: `${siteUrl}/checkout/failure?source=invoice`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PayTR hatası';
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    return NextResponse.json({ paytrUrl: buildPayTRUrl(token) });
  }

  const { cartId, phone, address, city, zip, shippingTitle } = body;

  // Authenticated ise isim, soyisim ve email session/Shopify'dan al, manipülasyonu önle
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? body.email;
  let firstName = body.firstName;
  let lastName = body.lastName;
  if (session?.shopifyAccessToken) {
    const customer = await getCustomerAccount(session.shopifyAccessToken);
    if (customer) {
      firstName = customer.firstName ?? firstName;
      lastName = customer.lastName ?? lastName;
    }
  }

  if (
    !cartId ||
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !address ||
    !city ||
    !shippingTitle
  ) {
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

  const userIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

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
