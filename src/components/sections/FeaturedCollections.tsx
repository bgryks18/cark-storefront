import { getCollections } from '@/lib/shopify/queries/collection';
import { flattenConnection } from '@/lib/shopify/normalize';
import { CollectionCard } from '@/components/ui/CollectionCard';

export async function FeaturedCollections() {
  const connection = await getCollections(4);
  const collections = flattenConnection(connection);

  if (collections.length === 0) return null;

  return (
    <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      {collections.map((collection) => (
        <li key={collection.id}>
          <CollectionCard collection={collection} />
        </li>
      ))}
    </ul>
  );
}
