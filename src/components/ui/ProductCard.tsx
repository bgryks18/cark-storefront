import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';

import { formatPrice } from '@/lib/shopify/normalize';
import type { ShopifyProduct } from '@/lib/shopify/types';
import { cn } from '@/lib/utils/cn';

import { AddToCartButton } from '@/components/ui/AddToCartButton';

interface ProductCardProps {
  product: Pick<
    ShopifyProduct,
    'handle' | 'title' | 'vendor' | 'featuredImage' | 'priceRange' | 'availableForSale' | 'variants'
  >;
  className?: string;
  headingLevel?: 'h2' | 'h3';
}

export function ProductCard({ product, className, headingLevel: Heading = 'h3' }: ProductCardProps) {
  const tCommon = useTranslations('common');
  const price = product.priceRange.minVariantPrice;
  const firstVariant = product.variants.edges[0]?.node;

  return (
    <div
      className={cn('group/card relative rounded-xl border border-card-border bg-card', className)}
    >
      {/* Görsel */}
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-skeleton">
        <Link href={`/products/${product.handle}`} className="block h-full w-full">
          {product.featuredImage ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="h-full w-full bg-skeleton" />
          )}
        </Link>

        {!product.availableForSale && (
          <span className="absolute left-3 top-3 rounded bg-gray-dark px-2 py-0.5 text-xs font-medium text-white">
            {tCommon('soldOut')}
          </span>
        )}

        {firstVariant && (
          <AddToCartButton
            variantId={firstVariant.id}
            availableForSale={product.availableForSale}
            className="absolute bottom-3 right-3 opacity-0 transition-opacity duration-150 group-hover/card:opacity-100"
          />
        )}
      </div>

      {/* Bilgi */}
      <Link href={`/products/${product.handle}`} className="block p-4 sm:p-5">
        {product.vendor && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
            {product.vendor}
          </p>
        )}
        <Heading className="line-clamp-2 font-medium text-text-base">{product.title}</Heading>
        <p className="mt-2 font-semibold text-primary">
          {formatPrice(price.amount, price.currencyCode)}
        </p>
      </Link>
    </div>
  );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-card-border bg-card', className)}>
      <div className="aspect-square animate-pulse bg-skeleton" />
      <div className="min-h-33 space-y-2 p-4 sm:min-h-35 sm:p-5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-skeleton" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-skeleton" />
        <div className="h-4 w-1/4 animate-pulse rounded bg-skeleton" />
      </div>
    </div>
  );
}
