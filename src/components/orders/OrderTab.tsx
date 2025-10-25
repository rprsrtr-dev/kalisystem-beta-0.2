import { Store, OrderStatus } from '@/types';
import { SupplierCard } from './SupplierCard';
import { useOrders } from '@/hooks/useOrders';

interface OrderTabProps {
  store: Store;
  status: OrderStatus;
}

export function OrderTab({ store, status }: OrderTabProps) {
  const { orders } = useOrders(store, status);

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {orders.map((order) => (
          <SupplierCard
            key={order.id}
            order={order}
            store={store}
            isManagerView={status !== 'dispatching'}
          />
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No orders in {status.replace('_', ' ')} status.
        </div>
      )}
    </div>
  );
}
