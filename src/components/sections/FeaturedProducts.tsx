import { flattenConnection } from '@/lib/shopify/normalize';
import { getProducts } from '@/lib/shopify/queries/product';

import { FeaturedProductsClient } from './FeaturedProductsClient';

export async function FeaturedProducts() {
  const connection = await getProducts({ first: 8, sortKey: 'BEST_SELLING' });
  const products = flattenConnection(connection);
  if (products.length === 0) return null;

  return (
    <FeaturedProductsClient initialProducts={products} initialPageInfo={connection.pageInfo} />
  );
}
