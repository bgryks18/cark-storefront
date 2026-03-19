'use client';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight, ShoppingBag, Trash2 } from 'lucide-react';

import { formatMoney, getCartLines } from '@/lib/shopify/normalize';

import { useCart } from '@/hooks/useCart';
import { useModal } from '@/hooks/useModal';

import { QuantityCounter } from '@/components/cart/QuantityCounter';
import { Container } from '@/components/ui/Container';

const PAGE_SIZE = 10;

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [removeErrors, setRemoveErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const t = useTranslations('cart');
  const { confirm } = useModal();
  const { cart, cartId, isLoading, isRemoving, removeFromCart } = useCart();
  const lines = getCartLines(cart);

  const totalPages = Math.max(1, Math.ceil(lines.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedLines = lines.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [lines.length, totalPages, page]);

  async function handleRemove(lineId: string) {
    const ok = await confirm({
      title: t('removeConfirmTitle'),
      message: t('removeConfirmMessage'),
      confirmLabel: t('removeConfirmLabel'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const { userErrors } = await removeFromCart(lineId);
      if (userErrors.length > 0) {
        const err = userErrors[0];
        let msg: string;
        switch (err.code) {
          case 'INVALID_MERCHANDISE_LINE':
            msg = 'Ürün zaten sepette bulunamadı.';
            break;
          case 'SERVICE_UNAVAILABLE':
            msg = 'Servis geçici olarak kullanılamıyor. Lütfen tekrar deneyin.';
            break;
          case 'VALIDATION_CUSTOM':
          default:
            msg = err.message;
        }
        setRemoveErrors((prev) => ({ ...prev, [lineId]: msg }));
        setTimeout(
          () =>
            setRemoveErrors((prev) => {
              const next = { ...prev };
              delete next[lineId];
              return next;
            }),
          3000,
        );
      }
    } catch {
      setRemoveErrors((prev) => ({ ...prev, [lineId]: 'Ürün silinemedi. Lütfen tekrar deneyin.' }));
      setTimeout(
        () =>
          setRemoveErrors((prev) => {
            const next = { ...prev };
            delete next[lineId];
            return next;
          }),
        3000,
      );
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || (!cart && (isLoading || !!cartId))) {
    return (
      <section key="skeleton" className="py-8 sm:py-12">
        <Container>
          <div className="mb-8 h-8 w-36 animate-pulse rounded-lg bg-skeleton" />
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
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
            <div className="h-52 animate-pulse rounded-2xl bg-skeleton" />
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
            <h1 className="text-2xl font-bold text-black-dark">Sepetiniz boş</h1>
            <p className="text-text-muted">Henüz sepetinize ürün eklemediniz.</p>
            <Link
              href="/collections"
              className="mt-2 inline-flex h-11 items-center rounded-xl bg-primary px-8 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Alışverişe devam et
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  const subtotal = cart.cost.subtotalAmount;
  const total = cart.cost.totalAmount;
  const tax = cart.cost.totalTaxAmount;

  return (
    <section key="content" className="animate-fade-in py-8 sm:py-12">
      <Container>
        <h1 className="mb-8 text-2xl font-bold text-black-dark sm:text-3xl">Sepetim</h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* ─── Ürün listesi ─────────────────────────────────────────────── */}
          <div className="flex flex-col">
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
                        />

                        <div className="relative">
                          <button
                            onClick={() => handleRemove(line.id)}
                            disabled={isRemoving}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-transparent text-text-muted transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          {removeErrors[line.id] && (
                            <p className="absolute top-full left-0 mt-1.5 whitespace-nowrap text-xs text-red-500">
                              {removeErrors[line.id]}
                            </p>
                          )}
                        </div>

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
          <div className="h-fit rounded-2xl border border-card-border bg-card p-6">
            <h2 className="mb-4 text-base font-semibold text-text-base">Sipariş Özeti</h2>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Ara toplam</span>
                <span className="font-medium text-text-base">{formatMoney(subtotal)}</span>
              </div>
              {tax && (
                <div className="flex justify-between">
                  <span className="text-text-muted">KDV</span>
                  <span className="font-medium text-text-base">{formatMoney(tax)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-border pt-3 text-base">
                <span className="font-semibold text-text-base">Toplam</span>
                <span className="font-bold text-primary">{formatMoney(total)}</span>
              </div>
            </div>

            <a
              href={cart.checkoutUrl}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Ödemeye geç
            </a>

            <Link
              href="/collections"
              className="mt-3 flex h-10 w-full items-center justify-center rounded-xl text-sm text-text-muted transition-colors hover:text-primary"
            >
              Alışverişe devam et
            </Link>
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
