import Image from 'next/image';

import { Link } from '@/i18n/navigation';

import type { ShopifyCollection } from '@/lib/shopify/types';
import { cn } from '@/lib/utils/cn';

interface CollectionCardProps {
  collection: Pick<ShopifyCollection, 'handle' | 'title' | 'description' | 'image'>;
  className?: string;
}

export function CollectionCard({ collection, className }: CollectionCardProps) {
  return (
    <Link
      href={`/collections/${collection.handle}`}
      className={cn('block rounded-xl border border-card-border bg-card', className)}
    >
      {/* Görsel */}
      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-skeleton">
        {collection.image ? (
          <Image
            src={collection.image.url}
            alt={collection.image.altText ?? collection.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="h-full w-full bg-skeleton" />
        )}
      </div>

      {/* Bilgi */}
      <div className="p-4 sm:p-5">
        <h3 className="truncate font-semibold text-text-base">{collection.title}</h3>
        {collection.description && (
          <p className="mt-1 line-clamp-2 text-sm text-text-muted">{collection.description}</p>
        )}
      </div>
    </Link>
  );
}

export function CollectionCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-card-border bg-card', className)}>
      <div className="aspect-video animate-pulse bg-skeleton" />
      <div className="p-4 sm:p-5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-skeleton" />
        <div className="mt-2 h-3 w-2/5 animate-pulse rounded bg-skeleton" />
      </div>
    </div>
  );
}
