import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Order, Store, OrderItem } from '@/types';
import { Trash2, Plus, MessageSquare, Share2 } from 'lucide-react';
import { SupplierSelector } from './SupplierSelector';
import { AddItemDialog } from './AddItemDialog';
import { QuantitySelector } from './QuantitySelector';
import { OrderMessageDialog } from './OrderMessageDialog';
import { useOrders } from '@/hooks/useOrders';
import { generateOrderMessage } from '@/lib/orderMessage';
import { toast } from 'sonner';

interface SupplierCardProps {
  order: Order;
  store: Store;
  isManagerView?: boolean;
}

export function SupplierCard({ order, store, isManagerView = false }: SupplierCardProps) {
  const [showSupplierSelector, setShowSupplierSelector] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showOrderMessage, setShowOrderMessage] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const { updateOrder, deleteOrder } = useOrders(store, order.status);

  const handleSupplierChange = async (newSupplier: string) => {
    await updateOrder(order.id, { supplier: newSupplier as any });
    setShowSupplierSelector(false);
  };

  const handleAddItem = async (item: OrderItem) => {
    const updatedItems = [...order.items, item];
    await updateOrder(order.id, { items: updatedItems });
  };

  const handleUpdateQuantity = async (itemIndex: number, quantity: number, unit?: string) => {
    const updatedItems = [...order.items];
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantity, unit: unit as any };
    await updateOrder(order.id, { items: updatedItems });
  };

  const handleRemoveItem = async (itemIndex: number) => {
    const updatedItems = order.items.filter((_, i) => i !== itemIndex);
    await updateOrder(order.id, { items: updatedItems });
  };

  const handleToggleMissing = async (itemIndex: number) => {
    const updatedItems = [...order.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      is_missing: !updatedItems[itemIndex].is_missing,
    };
    await updateOrder(order.id, { items: updatedItems });
  };

  const handleToggleStatus = async (field: keyof Order) => {
    const currentValue = order[field];
    await updateOrder(order.id, { [field]: !currentValue } as any);

    if (field === 'is_sent' && !currentValue) {
      const message = generateOrderMessage(order);
      await updateOrder(order.id, { order_message: message });
    }

    if (field === 'is_on_the_way') {
      await updateOrder(order.id, { status: currentValue ? 'dispatching' : 'on_the_way' } as any);
    }
    if (field === 'is_received') {
      await updateOrder(order.id, {
        status: currentValue ? 'on_the_way' : 'received',
        completed_at: currentValue ? null : new Date().toISOString(),
      } as any);
    }
  };

  const getItemDisplay = (item: OrderItem) => {
    if (item.variant) {
      return `${item.name} (${item.variant})`;
    }
    return item.name;
  };

  const handleShareMessage = async () => {
    const message = order.order_message || generateOrderMessage(order);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Order ${order.order_id}`,
          text: message,
        });
        toast.success('Order shared');
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      await navigator.clipboard.writeText(message);
      toast.success('Order copied to clipboard');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-lg font-bold"
            onClick={() => !isManagerView && setShowSupplierSelector(true)}
            disabled={isManagerView}
          >
            {order.supplier}
          </Button>
          {!isManagerView && (
            <Button variant="ghost" size="icon" onClick={() => deleteOrder(order.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          {order.items.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-2 rounded hover:bg-accent ${
                item.is_missing ? 'line-through opacity-50' : ''
              }`}
              onContextMenu={(e) => {
                if (isManagerView) {
                  e.preventDefault();
                  handleToggleMissing(index);
                }
              }}
            >
              <span className="flex-1">{getItemDisplay(item)}</span>
              <QuantitySelector
                quantity={item.quantity}
                unit={item.unit}
                onUpdate={(qty, unit) => handleUpdateQuantity(index, qty, unit)}
                disabled={isManagerView}
              />
              {!isManagerView && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  className="ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {!isManagerView && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10"
              onClick={() => setShowAddItem(true)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        )}

        <div className="flex gap-2 flex-wrap pt-2 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOrderMessage(true)}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              {order.order_id}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleShareMessage}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant={order.is_paid ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToggleStatus('is_paid')}
          >
            {order.is_paid ? 'Paid' : 'Pay'}
          </Button>

          <Button
            variant={order.is_sent ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToggleStatus('is_sent')}
          >
            Send
          </Button>

          <Button
            variant={order.is_received ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToggleStatus('is_received')}
          >
            Received
          </Button>
        </div>
      </CardContent>

      <SupplierSelector
        open={showSupplierSelector}
        onOpenChange={setShowSupplierSelector}
        currentSupplier={order.supplier}
        onSelect={handleSupplierChange}
      />

      <AddItemDialog
        open={showAddItem}
        onOpenChange={setShowAddItem}
        onAdd={handleAddItem}
        supplier={order.supplier}
      />

      <OrderMessageDialog
        open={showOrderMessage}
        onOpenChange={setShowOrderMessage}
        order={order}
        onUpdate={updateOrder}
      />
    </Card>
  );
}
