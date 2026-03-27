'use server';

import {
  getDraftOrder,
  getPriceRule,
  lookupDiscountCode,
  updateDraftOrderAppliedDiscount,
} from '@/lib/shopify/admin';

export interface InvoiceSummary {
  subtotal: number;
  shipping: { title: string; price: number } | null;
  discountAmount: number;
  total: number;
  appliedCode: string | null;
}

type ActionResult = { ok: true; summary: InvoiceSummary } | { ok: false; error: string };

function toSummary(draft: {
  total_price: string;
  shipping_line: { title: string; price: string } | null;
  applied_discount: { title: string; description?: string | null; amount: string } | null;
  line_items: Array<{
    price: string;
    quantity: number;
    applied_discount?: { title?: string | null } | null;
  }>;
}): InvoiceSummary {
  const subtotal = draft.line_items.reduce((sum, item) => {
    const price = parseFloat(item.price ?? '0');
    return sum + (Number.isFinite(price) ? price : 0) * item.quantity;
  }, 0);
  const total = parseFloat(draft.total_price);
  const appliedDiscountAmount = parseFloat(draft.applied_discount?.amount ?? '0');
  const derivedDiscountAmount = Number.isFinite(total) ? Math.max(0, subtotal - total) : 0;
  const discountAmount = Math.max(appliedDiscountAmount, derivedDiscountAmount);
  const firstLineTitle =
    draft.line_items.find((item) => item.applied_discount?.title)?.applied_discount?.title ?? null;

  return {
    subtotal,
    shipping: draft.shipping_line
      ? { title: draft.shipping_line.title, price: parseFloat(draft.shipping_line.price) }
      : null,
    discountAmount,
    total,
    appliedCode: draft.applied_discount?.title ?? draft.applied_discount?.description ?? firstLineTitle ?? null,
  };
}

function isDiscountAllowed(draft: {
  allow_discount_codes_in_checkout?: boolean | null;
  'allow_discount_codes_in_checkout?'?: boolean | null;
}): boolean {
  return Boolean(
    draft.allow_discount_codes_in_checkout ?? draft['allow_discount_codes_in_checkout?'] ?? false,
  );
}

export async function applyInvoiceDiscountAction(
  draftOrderId: string,
  code: string,
): Promise<ActionResult> {
  try {
    const normalizedCode = code.trim().toUpperCase();
    if (!draftOrderId || !normalizedCode) return { ok: false, error: 'Eksik bilgi' };

    const draft = await getDraftOrder(draftOrderId);
    if (!draft) return { ok: false, error: 'Sipariş bulunamadı' };
    if (draft.status === 'completed') return { ok: false, error: 'Sipariş tamamlanmış' };
    if (!isDiscountAllowed(draft)) {
      return { ok: false, error: 'Bu siparişte indirim kodu kullanılamıyor' };
    }

    const lookup = await lookupDiscountCode(normalizedCode);
    if (!lookup) return { ok: false, error: 'Geçersiz indirim kodu' };

    const rule = await getPriceRule(lookup.price_rule_id);
    if (!rule || rule.value_type === 'shipping') {
      return { ok: false, error: 'Geçersiz indirim kodu' };
    }

    const updated = await updateDraftOrderAppliedDiscount({
      draftOrderId: draft.id,
      appliedDiscount: {
        title: normalizedCode,
        description: normalizedCode,
        value_type: rule.value_type,
        value: Math.abs(parseFloat(rule.value)).toString(),
      },
    });

    if (
      !updated.applied_discount ||
      updated.applied_discount.title.toUpperCase() !== normalizedCode
    ) {
      return { ok: false, error: 'Geçersiz indirim kodu' };
    }

    return { ok: true, summary: toSummary(updated) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'İndirim uygulanamadı';
    return { ok: false, error: msg };
  }
}

export async function removeInvoiceDiscountAction(draftOrderId: string): Promise<ActionResult> {
  if (!draftOrderId) return { ok: false, error: 'Eksik bilgi' };

  const draft = await getDraftOrder(draftOrderId);
  if (!draft) return { ok: false, error: 'Sipariş bulunamadı' };
  if (draft.status === 'completed') return { ok: false, error: 'Sipariş tamamlanmış' };

  const updated = await updateDraftOrderAppliedDiscount({
    draftOrderId: draft.id,
    appliedDiscount: null,
  });

  return { ok: true, summary: toSummary(updated) };
}
