import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Store, Item, OrderItem } from '@/types';
import { toast } from 'sonner';
import { parseItemList } from '@/lib/fuzzyMatch';
import { supabase } from '@/lib/supabase';
import { useOrders } from '@/hooks/useOrders';

interface PasteListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: Store;
}

export function PasteListDialog({
  open,
  onOpenChange,
  store,
}: PasteListDialogProps) {
  const [text, setText] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const { createOrder, updateOrder } = useOrders(store, 'dispatching');

  useEffect(() => {
    if (open) {
      fetchItems();
    }
  }, [open]);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('items')
      .select('*')
      .order('name');
    setItems(data || []);
  };

  const handleParse = async () => {
    if (!text.trim()) {
      toast.error('Please paste some items first');
      return;
    }

    const parsedItems = parseItemList(text, items);

    if (parsedItems.length === 0) {
      toast.error('No items could be parsed');
      return;
    }

    const kaliOrderId = `KALI_${store}_${String(new Date().getDate()).padStart(2, '0')}${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    let kaliOrder = null;

    for (const parsedItem of parsedItems) {
      let itemId: string;

      if (parsedItem.matchedItem) {
        itemId = parsedItem.matchedItem.id;
      } else {
        const { data: newItem, error } = await supabase
          .from('items')
          .insert({
            name: parsedItem.name,
            variant: parsedItem.variant || null,
            unit: parsedItem.unit || null,
            supplier: 'KALI',
            order_count: 0,
          })
          .select()
          .single();

        if (error || !newItem) {
          console.error('Error creating item:', error);
          continue;
        }

        itemId = newItem.id;
      }

      const orderItem: OrderItem = {
        item_id: itemId,
        name: parsedItem.name,
        variant: parsedItem.variant || null,
        quantity: parsedItem.quantity,
        unit: parsedItem.unit || null,
      };

      if (!kaliOrder) {
        await createOrder('KALI');
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('store', store)
          .eq('supplier', 'KALI')
          .eq('status', 'dispatching')
          .order('created_at', { ascending: false })
          .limit(1);

        if (orders && orders.length > 0) {
          kaliOrder = orders[0];
        }
      }

      if (kaliOrder) {
        const updatedItems = [...(kaliOrder.items || []), orderItem];
        await updateOrder(kaliOrder.id, { items: updatedItems });
        kaliOrder = { ...kaliOrder, items: updatedItems };
      }
    }

    toast.success(`Created order with ${parsedItems.length} items`);
    setText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paste Item List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Paste your item list here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
          />
          <Button onClick={handleParse} className="w-full">
            Parse and Create Orders
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
