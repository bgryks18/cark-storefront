import { Suspense } from 'react';

import { OrderTrackingClient } from './OrderTrackingClient';

export default function OrderTrackingPage() {
  return (
    <Suspense>
      <OrderTrackingClient />
    </Suspense>
  );
}
