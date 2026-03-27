'use client';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight, Loader, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';

import { formatMoney, getCartLines } from '@/lib/shopify/normalize';
import { CartErrorCode } from '@/lib/shopify/queries/cart';

import { useCart } from '@/hooks/useCart';
import { useModal } from '@/hooks/useModal';

import { QuantityCounter } from '@/components/cart/QuantityCounter';
import { Container } from '@/components/ui/Container';
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb';

const PAGE_SIZE = 10;

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [lineErrors, setLineErrors] = useState<Record<string, string | null>>({});
  const t = useTranslations('cart');
  const { confirm } = useModal();
  const {
    cart,
    cartId,
    isLoading,
    isRemoving,
    isAnyItemLoading,
    removeFromCart,
    applyDiscountCode,
    removeDiscountCode,
    isApplyingDiscount,
  } = useCart();
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [discountError, setDiscountError] = useState<string | null>(null);
  const lines = getCartLines(cart);

  const totalPages = Math.max(1, Math.ceil(lines.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedLines = lines.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [lines.length, totalPages, page]);

  function handleRemove(lineId: string) {
    confirm({
      title: t('removeConfirmTitle'),
      message: t('removeConfirmMessage'),
      confirmLabel: t('removeConfirmLabel'),
      variant: 'danger',
      action: async () => {
        const { userErrors } = await removeFromCart(lineId);
        if (userErrors.length > 0) {
          const err = userErrors[0];
          let msg: string;
          switch (err.code) {
            case CartErrorCode.INVALID_MERCHANDISE_LINE:
              msg = t('errors.lineNotFound');
              break;
            case CartErrorCode.SERVICE_UNAVAILABLE:
              msg = t('errors.serviceUnavailable');
              break;
            case CartErrorCode.VALIDATION_CUSTOM:
            default:
              msg = err.message;
          }
          throw new Error(msg);
        }
      },
    });
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || (!cart && (isLoading || !!cartId))) {
    return (
      <section key="skeleton" className="py-8 sm:py-12">
        <Container>
          <div className="mb-8 h-8 w-36 animate-pulse rounded-lg bg-skeleton" />
          <div className="grid gap-8 md:grid-cols-[1fr_360px]">
            <div className="flex flex-col divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 py-5 sm:gap-6">
                  <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-skeleton sm:h-24 sm:w-24" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-skeleton" />
                    <div className="h-3 w-1/4 animate-pulse rounded bg-skeleton" />
                    <div className="h-4 w-1/5 animate-pulse rounded bg-skeleton" />
                  </div>
                </div>
              ))}
            </div>
            <div className="order-first md:order-0 h-52 animate-pulse rounded-2xl bg-skeleton" />
          </div>
        </Container>
      </section>
    );
  }

  if (!cart || lines.length === 0) {
    return (
      <section className="py-16 sm:py-24">
        <Container>
          <div className="flex flex-col items-center gap-4 text-center">
            <ShoppingBag className="h-16 w-16 text-text-muted" strokeWidth={1.25} />
            <h1 className="text-2xl font-bold text-black-dark">{t('empty')}</h1>
            <p className="text-text-muted">{t('emptyDescription')}</p>
            <Link
              href="/collections"
              className="mt-2 inline-flex h-11 items-center rounded-xl bg-primary px-8 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              {t('continueShopping')}
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  const subtotal = cart.cost.subtotalAmount;
  const total = cart.cost.totalAmount;
  const appliedCodes = (cart.discountCodes ?? []).filter((d) => d.applicable);
  const discountSavings = lines.reduce((sum, line) => {
    const lineDiscount = (line.discountAllocations ?? []).reduce(
      (s, a) => s + parseFloat(a.discountedAmount.amount),
      0,
    );
    return sum + lineDiscount;
  }, 0);

  async function handleApplyDiscount() {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    setDiscountError(null);
    const { cart: updated } = await applyDiscountCode(code);
    const applied = updated.discountCodes.find((d) => d.code === code);
    if (!applied?.applicable) {
      await removeDiscountCode(code);
      setDiscountError(t('discountInvalid'));
    } else {
      setDiscountInput('');
      setDiscountOpen(false);
      setDiscountError(null);
    }
  }

  return (
    <section key="content" className="animate-fade-in py-8 sm:py-12">
      <Container>
        <PageBreadcrumb crumbs={[]} title={t('title')} />

        <div className="grid gap-8 md:grid-cols-[1fr_360px]">
          {/* ─── Ürün listesi ─────────────────────────────────────────────── */}
          <div className="flex flex-col min-w-0">
            <div className="flex flex-col divide-y divide-border">
              {pagedLines.map((line) => {
                const product = line.merchandise.product;
                const image = product.featuredImage;
                const options = line.merchandise.selectedOptions.filter(
                  (o) => o.value !== 'Default Title',
                );

                return (
                  <div key={line.id} className="flex gap-4 py-5 sm:gap-6">
                    {/* Görsel */}
                    <Link href={`/products/${product.handle}`} className="shrink-0">
                      <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-skeleton sm:h-24 sm:w-24">
                        {image && (
                          <Image
                            src={image.url}
                            alt={image.altText ?? product.title}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        )}
                      </div>
                    </Link>

                    {/* Bilgi */}
                    <div className="flex flex-1 flex-col gap-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <Link
                          href={`/products/${product.handle}`}
                          className="font-medium text-text-base hover:text-primary truncate"
                        >
                          {product.title}
                        </Link>
                        {line.merchandise.sku && (
                          <span className="shrink-0 text-tiny font-normal text-text-muted h-full inline-flex items-center">
                            {line.merchandise.sku}
                          </span>
                        )}
                      </div>

                      {options.length > 0 && (
                        <p className="text-xs text-text-muted">
                          {options.map((o) => o.value).join(' / ')}
                        </p>
                      )}

                      <p className="text-sm font-semibold text-primary">
                        {formatMoney(line.cost.amountPerQuantity)}
                      </p>

                      {/* Miktar + sil */}
                      <div className="mt-auto flex items-center gap-3">
                        <QuantityCounter
                          lineId={line.id}
                          quantity={line.quantity}
                          maxQuantity={(() => {
                            const stock = line.merchandise.quantityAvailable ?? Infinity;
                            const rule = line.merchandise.quantityRule?.maximum ?? Infinity;
                            const effective = Math.min(stock, rule);
                            return effective === Infinity ? null : effective;
                          })()}
                          onError={(msg) => setLineErrors((prev) => ({ ...prev, [line.id]: msg }))}
                        />

                        <button
                          onClick={() => handleRemove(line.id)}
                          disabled={isRemoving}
                          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent text-error dark:text-text-muted transition-colors hover:border-error-border hover:bg-error-bg hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        {lineErrors[line.id] && (
                          <p className="text-xs text-error whitespace-nowrap">
                            {lineErrors[line.id]}
                          </p>
                        )}

                        <p className="ml-auto text-sm font-semibold text-text-base">
                          {formatMoney(line.cost.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ─── Pagination ───────────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-1">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={safePage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {getPageNumbers(safePage, totalPages).map((item, idx) =>
                  item === '...' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="flex h-9 w-9 items-center justify-center text-sm text-text-muted"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                        item === safePage
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-text-muted hover:bg-surface-hover'
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}

                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={safePage === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* ─── Sipariş özeti ────────────────────────────────────────────── */}
          <div className="relative h-full order-first md:order-0">
            <div className="sticky top-33 max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin rounded-2xl border border-card-border bg-card p-6">
              <h2 className="mb-4 text-base font-semibold text-text-base">{t('summary.title')}</h2>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">{t('summary.subtotal')}</span>
                  <span className="font-medium text-text-base">
                    {formatMoney({
                      amount: (parseFloat(subtotal.amount) + discountSavings).toFixed(2),
                      currencyCode: subtotal.currencyCode,
                    })}
                  </span>
                </div>
                {discountSavings > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">{t('summary.discount')}</span>
                    <span className="font-medium text-success">
                      -
                      {formatMoney({
                        amount: discountSavings.toFixed(2),
                        currencyCode: subtotal.currencyCode,
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* ─── İndirim kodu ─────────────────────────────────────── */}
              <div className="mt-4 border-t border-border pt-4">
                {/* Uygulanan kodlar */}
                {appliedCodes.length > 0 &&
                  (() => {
                    return (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {appliedCodes.map((d) => (
                          <span
                            key={d.code}
                            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            <Tag className="h-3 w-3 shrink-0" />
                            {d.code}
                            {discountSavings > 0 && (
                              <span className="text-success">
                                -
                                {formatMoney({
                                  amount: discountSavings.toFixed(2),
                                  currencyCode: total.currencyCode,
                                })}
                              </span>
                            )}
                            <button
                              onClick={() => removeDiscountCode(d.code)}
                              disabled={isApplyingDiscount}
                              className="ml-0.5 cursor-pointer opacity-60 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {isApplyingDiscount ? (
                                <Loader className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </button>
                          </span>
                        ))}
                      </div>
                    );
                  })()}

                {/* Accordion toggle — only show when no code is applied */}
                {appliedCodes.length === 0 && (
                  <button
                    onClick={() => {
                      setDiscountOpen((o) => !o);
                      setDiscountError(null);
                    }}
                    className="flex w-full cursor-pointer items-center justify-between text-sm text-text-muted hover:text-text-base transition-colors"
                  >
                    <span>{t('discount')}</span>
                    <Plus
                      className={`h-4 w-4 transition-transform ${discountOpen ? 'rotate-45' : ''}`}
                    />
                  </button>
                )}

                {discountOpen && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                      placeholder={t('discountCodePlaceholder')}
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={handleApplyDiscount}
                      disabled={isApplyingDiscount || !discountInput.trim()}
                      className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isApplyingDiscount ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        t('applyDiscount')
                      )}
                    </button>
                    {discountError && <p className="text-xs text-error">{discountError}</p>}
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-between border-t border-border pt-3 text-base">
                <span className="font-semibold text-text-base">{t('summary.total')}</span>
                <span className="font-bold text-primary">{formatMoney(total)}</span>
              </div>
              <p className="mt-1.5 text-xs text-text-muted">{t('summary.taxNote')}</p>

              {isLoading || isRemoving || isAnyItemLoading || isApplyingDiscount ? (
                <button
                  disabled
                  className="mt-6 flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-primary text-base font-semibold text-white opacity-70"
                >
                  {t('checkout')}
                </button>
              ) : (
                <Link
                  href="/checkout"
                  className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  {t('checkout')}
                </Link>
              )}

              <Link
                href="/collections"
                className="mt-3 flex h-10 w-full items-center justify-center rounded-xl text-sm text-text-muted transition-colors hover:text-primary"
              >
                {t('continueShopping')}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}
