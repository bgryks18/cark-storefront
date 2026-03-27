import { NextRequest } from 'next/server';

import { verifyPayTRNotification } from '@/lib/paytr';
import { completeDraftOrder, deleteDraftOrder } from '@/lib/shopify/admin';

// merchantOid formatı: CARK{timestamp}{random}_{draftOrderId}
function parseDraftOrderId(merchantOid: string): number | null {
  const idx = merchantOid.lastIndexOf('_');
  if (idx === -1) return null;
  const id = parseInt(merchantOid.slice(idx + 1), 10);
  return isNaN(id) ? null : id;
}

async function sendAdminNotification(payload: {
  name: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  description: string;
}): Promise<void> {
  try {
    await fetch('https://api.carkzimpara.com/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, description: payload.description.substring(0, 2000) }),
    });
  } catch (err) {
    console.error('PayTR notify: admin bildirimi gönderilemedi', err);
  }
}

// PayTR'ın beklediği yanıt: düz "OK" metni
function ok() {
  return new Response('OK', { headers: { 'Content-Type': 'text/plain' } });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const merchantOid = formData.get('merchant_oid') as string;
  const status = formData.get('status') as string;
  const totalAmount = formData.get('total_amount') as string;
  const hash = formData.get('hash') as string;

  if (!verifyPayTRNotification(merchantOid, status, totalAmount, hash)) {
    console.error('PayTR notify: geçersiz hash', { merchantOid });
    return new Response('INVALID', { status: 400 });
  }

  const draftOrderId = parseDraftOrderId(merchantOid);

  if (!draftOrderId) {
    console.error('PayTR notify: draft order ID ayrıştırılamadı', { merchantOid });
    return ok();
  }

  if (status !== 'success') {
    void deleteDraftOrder(draftOrderId);
    return ok();
  }

  // Ödeme başarılı — önce OK dön, sonra arka planda complete et
  void completeDraftOrder(draftOrderId).catch((err: unknown) => {
    console.error('PayTR notify: draft order tamamlanamadı', merchantOid, err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    const tutar = (parseInt(totalAmount) / 100).toFixed(2);
    const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? 'carkstore.myshopify.com';
    void sendAdminNotification({
      name: '⚠️ SİPARİŞ TAMAMLANAMADI',
      lastName: merchantOid,
      phoneNumber: '0000000000',
      email: 'info@carkzimpara.com',
      description:
        `⚠️ Ödeme alındı ama sipariş tamamlanamadı!\n\n` +
        `PayTR Sipariş No: ${merchantOid}\n` +
        `Ödenen Tutar: ${tutar} TL\n` +
        `Shopify Draft Order: https://${domain}/admin/draft_orders/${draftOrderId}\n\n` +
        `Hata: ${errorMsg}\n\n` +
        `Shopify admin panelinden draft order'ı manuel olarak tamamlayın.`,
    });
  });

  return ok();
}
