import { useState } from 'react';
import { Store, Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import { SupplierCard } from './SupplierCard';
import { PasteListDialog } from './PasteListDialog';
import { useOrders } from '@/hooks/useOrders';

interface DispatchingTabProps {
  store: Store;
}

export function DispatchingTab({ store }: DispatchingTabProps) {
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const { orders, createOrder } = useOrders(store, 'dispatching');

  const handleAddCard = () => {
    createOrder('sup1');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={handleAddCard}>
          <Plus className="w-4 h-4 mr-2" />
          Add Card
        </Button>
        <Button variant="outline" onClick={() => setShowPasteDialog(true)}>
          <FileText className="w-4 h-4 mr-2" />
          Paste List
        </Button>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <SupplierCard key={order.id} order={order} store={store} />
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No orders yet. Click "Add Card" to create a new order.
        </div>
      )}

      <PasteListDialog
        open={showPasteDialog}
        onOpenChange={setShowPasteDialog}
        store={store}
      />
    </div>
  );
}
