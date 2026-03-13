'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { useCart } from '@/hooks/useCart';
import { getCartLines } from '@/lib/shopify/normalize';
import { formatMoney } from '@/lib/shopify/normalize';

export default function CartPage() {
  const { cart, isLoading, removeFromCart, updateQuantity } = useCart();
  const lines = getCartLines(cart);

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
    <section className="py-8 sm:py-12">
      <Container>
        <h1 className="mb-8 text-2xl font-bold text-black-dark sm:text-3xl">Sepetim</h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* ─── Ürün listesi ─────────────────────────────────────────────── */}
          <div className="flex flex-col divide-y divide-border">
            {lines.map((line) => {
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
                    <Link
                      href={`/products/${product.handle}`}
                      className="font-medium text-text-base hover:text-primary truncate"
                    >
                      {product.title}
                    </Link>

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
                      <div className="flex items-center gap-1 rounded-lg border border-card-border">
                        <button
                          onClick={() => {
                            if (line.quantity <= 1) {
                              removeFromCart(line.id);
                            } else {
                              updateQuantity(line.id, line.quantity - 1);
                            }
                          }}
                          disabled={isLoading}
                          className="flex h-8 w-8 items-center justify-center text-text-muted transition-colors hover:text-text-base disabled:opacity-50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-text-base">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(line.id, line.quantity + 1)}
                          disabled={isLoading}
                          className="flex h-8 w-8 items-center justify-center text-text-muted transition-colors hover:text-text-base disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(line.id)}
                        disabled={isLoading}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <p className="ml-auto text-sm font-semibold text-text-base">
                        {formatMoney(line.cost.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
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
