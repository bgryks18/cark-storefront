import { getProducts } from '@/lib/shopify/queries/product';
import { flattenConnection } from '@/lib/shopify/normalize';
import { ProductCard } from '@/components/ui/ProductCard';

export async function FeaturedProducts() {
  const connection = await getProducts({ first: 8, sortKey: 'BEST_SELLING' });
  const products = flattenConnection(connection);

  if (products.length === 0) return null;

  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
