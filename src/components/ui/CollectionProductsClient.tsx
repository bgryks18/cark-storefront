'use client';

import { useEffect, useRef, useState } from 'react';

import { sortVariantCardsByCollectionSort } from '@/lib/shopify/normalize';
import type { CollectionVariantCard } from '@/lib/shopify/types';
import { PRODUCT_CARD_GRID_CLASS } from '@/lib/ui/productCardGrid';

import { ProductCard, ProductCardSkeleton } from '@/components/ui/ProductCard';

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface Props {
  initialItems: CollectionVariantCard[];
  initialPageInfo: PageInfo;
  handle: string;
  sort: string;
  locale: string;
  activeFilters: string[];
  noProductsText: string;
}

export function CollectionProductsClient({
  initialItems,
  initialPageInfo,
  handle,
  sort,
  locale,
  activeFilters,
  noProductsText,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(initialItems);
    setPageInfo(initialPageInfo);
  }, [initialItems, initialPageInfo]);

  useEffect(() => {
    if (!pageInfo.hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) {
          void loadMore();
        }
      },
      { rootMargin: '200px' },
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageInfo.hasNextPage, pageInfo.endCursor, loading]);

  async function loadMore() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        handle,
        sort,
        locale,
        after: pageInfo.endCursor ?? '',
      });
      activeFilters.forEach((f) => params.append('filter', f));

      const res = await fetch(`/api/collection-products?${params.toString()}`);
      const data = (await res.json()) as { items: CollectionVariantCard[]; pageInfo: PageInfo };
      setItems((prev) =>
        sortVariantCardsByCollectionSort([...prev, ...data.items], sort),
      );
      setPageInfo(data.pageInfo);
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return <p className="py-16 text-center text-text-muted">{noProductsText}</p>;
  }

  return (
    <>
      <ul className={PRODUCT_CARD_GRID_CLASS}>
        {items.map(({ product, variant }) => (
          <li key={`${product.id}-${variant.id}`}>
            <ProductCard product={product} variant={variant} headingLevel="h2" />
          </li>
        ))}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <li key={`skeleton-${i}`}>
              <ProductCardSkeleton />
            </li>
          ))}
      </ul>

      {pageInfo.hasNextPage && <div ref={sentinelRef} className="h-1" />}
    </>
  );
}
