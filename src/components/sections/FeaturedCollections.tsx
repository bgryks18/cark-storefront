import { getCollections } from '@/lib/shopify/queries/collection';
import { PRODUCT_CARD_GRID_CLASS } from '@/lib/ui/productCardGrid';
import { flattenConnection } from '@/lib/shopify/normalize';
import { CollectionCard } from '@/components/ui/CollectionCard';

export async function FeaturedCollections() {
  const connection = await getCollections(4);
  const collections = flattenConnection(connection);

  if (collections.length === 0) return null;

  return (
    <ul className={PRODUCT_CARD_GRID_CLASS}>
      {collections.map((collection) => (
        <li key={collection.id}>
          <CollectionCard collection={collection} />
        </li>
      ))}
    </ul>
  );
}
