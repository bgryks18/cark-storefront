import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';

import { formatPrice, variantNumericId } from '@/lib/shopify/normalize';
import type { ProductVariant, ShopifyProduct } from '@/lib/shopify/types';
import { cn } from '@/lib/utils/cn';

import { AddToCartButton } from '@/components/ui/AddToCartButton';

type ProductCardProduct = Pick<
  ShopifyProduct,
  'handle' | 'title' | 'vendor' | 'featuredImage' | 'priceRange' | 'availableForSale' | 'variants'
>;

interface ProductCardProps {
  product: ProductCardProduct;
  /** Koleksiyon ızgarası: tek satır = tek varyant */
  variant?: ProductVariant;
  className?: string;
  headingLevel?: 'h2' | 'h3';
}

export function ProductCard({ product, variant, className, headingLevel: Heading = 'h3' }: ProductCardProps) {
  const tCommon = useTranslations('common');
  const v = variant ?? product.variants.edges[0]?.node;
  const price = variant ? variant.price : product.priceRange.minVariantPrice;
  const displayImage = variant?.image?.url ? variant.image : product.featuredImage;
  const inStock = variant ? variant.availableForSale : product.availableForSale;
  const variantLine =
    variant &&
    variant.selectedOptions.map((o) => o.value).filter(Boolean).join(' · ');

  const productHref = variant
    ? `/products/${product.handle}?variant=${variantNumericId(variant.id)}`
    : `/products/${product.handle}`;

  return (
    <div
      className={cn('group/card relative rounded-xl border border-card-border bg-card', className)}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-skeleton">
        <Link href={productHref} className="block h-full w-full">
          {displayImage ? (
            <Image
              src={displayImage.url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 33vw, 25vw"
            />
          ) : (
            <div className="h-full w-full bg-skeleton" />
          )}
        </Link>

        {!inStock && (
          <span className="absolute left-3 top-3 rounded bg-gray-dark px-2 py-0.5 text-xs font-medium text-white">
            {tCommon('soldOut')}
          </span>
        )}

        {v && (
          <AddToCartButton
            variantId={v.id}
            availableForSale={inStock}
            className="absolute bottom-3 right-3 opacity-0 transition-opacity duration-150 group-hover/card:opacity-100"
          />
        )}
      </div>

      <Link href={productHref} className="block p-4 sm:p-5">
        {product.vendor && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
            {product.vendor}
          </p>
        )}
        <Heading className="line-clamp-2 font-medium text-text-base">{product.title}</Heading>
        {variantLine && (
          <p className="mt-1 line-clamp-2 text-sm text-text-muted">{variantLine}</p>
        )}
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
