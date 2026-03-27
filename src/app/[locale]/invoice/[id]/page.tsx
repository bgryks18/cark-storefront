import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { Package } from 'lucide-react';

import type { AdminDraftOrder, AdminDraftOrderPricing } from '@/lib/shopify/admin';
import {
  getDraftOrder,
  getDraftOrderDiscountCodeGraphql,
  getDraftOrderPricingGraphql,
} from '@/lib/shopify/admin';
import { shopifyFetch } from '@/lib/shopify/client';

import { Container } from '@/components/ui/Container';
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb';

import { InvoiceSummaryCard } from './InvoiceSummaryCard';

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

type ProductImageMap = Map<number, { url: string; alt: string | null }>;

async function fetchProductImages(productIds: number[]): Promise<ProductImageMap> {
  const gids = Array.from(new Set(productIds)).map((id) => `gid://shopify/Product/${id}`);
  if (gids.length === 0) return new Map();

  try {
    const data = await shopifyFetch<{
      nodes: Array<{
        id?: string;
        featuredImage?: { url: string; altText: string | null } | null;
      } | null>;
    }>(
      `#graphql
        query InvoiceProductImages($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              featuredImage { url altText }
            }
          }
        }
      `,
      { ids: gids },
      { cache: 'no-store' },
    );

    return new Map(
      (data.nodes ?? [])
        .filter((n): n is NonNullable<typeof n> => Boolean(n?.id && n.featuredImage))
        .map((n) => [
          parseInt(n.id!.split('/').pop()!, 10),
          { url: n.featuredImage!.url, alt: n.featuredImage!.altText },
        ]),
    );
  } catch {
    return new Map();
  }
}

function resolveInvoiceSummary(
  draft: AdminDraftOrder,
  pricing: AdminDraftOrderPricing | null,
  discountCode: string | null,
  fallbackDiscountLabel: string,
) {
  const lineItemSubtotal = draft.line_items.reduce((sum, item) => {
    const price = parseFloat(item.price ?? '0');
    return sum + (Number.isFinite(price) ? price : 0) * item.quantity;
  }, 0);

  const subtotal = parseFloat(pricing?.originalSubtotalPrice ?? String(lineItemSubtotal));
  const total = parseFloat(pricing?.totalPrice ?? draft.total_price);

  const discountAmount = parseFloat(
    pricing?.discountAmount ??
      draft.applied_discount?.amount ??
      String(Math.max(0, subtotal - (Number.isFinite(total) ? total : 0))),
  );

  const firstLineItemDiscountTitle =
    draft.line_items.find((i) => i.applied_discount?.title)?.applied_discount?.title ?? null;

  const appliedCode =
    discountCode ??
    pricing?.appliedDiscount?.title ??
    pricing?.lineItemDiscountTitle ??
    firstLineItemDiscountTitle ??
    draft.applied_discount?.title ??
    draft.applied_discount?.description ??
    (discountAmount > 0 || pricing?.hasDiscountSignal ? fallbackDiscountLabel : null);

  const allowDiscountCodes = Boolean(
    draft.allow_discount_codes_in_checkout ?? draft['allow_discount_codes_in_checkout?'] ?? false,
  );

  return { subtotal, total, discountAmount, appliedCode, allowDiscountCodes };
}

export default async function InvoicePage({ params }: Props) {
  const { id, locale } = await params;
  const [draft, pricing, draftDiscountCode, t] = await Promise.all([
    getDraftOrder(id),
    getDraftOrderPricingGraphql(id),
    getDraftOrderDiscountCodeGraphql(id),
    getTranslations({ locale, namespace: 'invoice' }),
  ]);

  if (!draft || draft.status === 'completed') notFound();

  const productImageMap = await fetchProductImages(
    draft.line_items
      .map((item) => item.product_id)
      .filter((pid): pid is number => typeof pid === 'number'),
  );

  const { subtotal, total, discountAmount, appliedCode, allowDiscountCodes } =
    resolveInvoiceSummary(draft, pricing, draftDiscountCode, t('discount'));

  return (
    <section className="py-12 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <PageBreadcrumb crumbs={[]} title={t('title')} />
          <p className="-mt-4 mb-8 text-sm text-text-muted">
            {t('orderNo')} {draft.name}
          </p>

          {/* Ürünler */}
          <div className="rounded-2xl border border-card-border bg-surface p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
              {t('products')}
            </h2>
            <ul className="divide-y divide-card-border">
              {draft.line_items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex flex-1 items-center gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-card-border bg-skeleton sm:h-24 sm:w-24">
                      {item.product_id && productImageMap.get(item.product_id) ? (
                        <Image
                          src={productImageMap.get(item.product_id)!.url}
                          alt={productImageMap.get(item.product_id)!.alt ?? item.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <Package
                          className="absolute inset-0 m-auto h-5 w-5 text-text-muted"
                          strokeWidth={1.5}
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-base">{item.title}</p>
                      {item.variant_title && item.variant_title !== 'Default Title' && (
                        <p className="text-xs text-text-muted">{item.variant_title}</p>
                      )}
                      <p className="text-xs text-text-muted">
                        {t('quantity')} {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-text-base">
                    {(parseFloat(item.price) * item.quantity).toFixed(2)} ₺
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Teslimat adresi */}
          {draft.shipping_address && (
            <div className="mt-4 rounded-2xl border border-card-border bg-surface p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                {t('deliveryAddress')}
              </h2>
              <p className="text-sm text-text-base">
                {draft.shipping_address.first_name} {draft.shipping_address.last_name}
              </p>
              <p className="text-sm text-text-muted">{draft.shipping_address.address1}</p>
              <p className="text-sm text-text-muted">
                {draft.shipping_address.city}
                {draft.shipping_address.zip ? ` ${draft.shipping_address.zip}` : ''}
              </p>
              {(draft.phone ?? draft.shipping_address.phone) && (
                <p className="text-sm text-text-muted">
                  {draft.phone ?? draft.shipping_address.phone}
                </p>
              )}
            </div>
          )}

          {/* Ödeme / indirim */}
          <div className="mt-6">
            <InvoiceSummaryCard
              draftOrderId={id}
              allowDiscountCodes={allowDiscountCodes}
              canRemoveDiscount={allowDiscountCodes && Boolean(draft.applied_discount?.title)}
              initial={{
                subtotal,
                shipping: draft.shipping_line
                  ? {
                      title: draft.shipping_line.title,
                      price: parseFloat(draft.shipping_line.price),
                    }
                  : null,
                discountAmount,
                total,
                appliedCode,
              }}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
