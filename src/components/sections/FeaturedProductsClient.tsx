'use client';

import { useEffect, useRef, useState } from 'react';

import type { ShopifyProduct } from '@/lib/shopify/types';

import { ProductCard, ProductCardSkeleton } from '@/components/ui/ProductCard';

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface Props {
  initialProducts: ShopifyProduct[];
  initialPageInfo: PageInfo;
}

export function FeaturedProductsClient({ initialProducts, initialPageInfo }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

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
      const res = await fetch(`/api/products?after=${pageInfo.endCursor ?? ''}`);
      const data = (await res.json()) as { products: ShopifyProduct[]; pageInfo: PageInfo };
      setProducts((prev) => [...prev, ...data.products]);
      setPageInfo(data.pageInfo);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
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
