import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OrderItem, Supplier, Item } from '@/types';
import { supabase } from '@/lib/supabase';
import { Search } from 'lucide-react';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: OrderItem) => void;
  supplier: Supplier;
}

export function AddItemDialog({
  open,
  onOpenChange,
  onAdd,
  supplier,
}: AddItemDialogProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      fetchItems();
    }
  }, [open, supplier]);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('supplier', supplier)
      .order('name');
    setItems(data || []);
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectItem = (item: Item) => {
    onAdd({
      item_id: item.id,
      name: item.name,
      variant: item.variant,
      quantity: 1,
      unit: item.unit,
    });
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredItems.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleSelectItem(item)}
              >
                <div className="flex flex-col items-start">
                  <span>
                    {item.name}
                    {item.variant && ` (${item.variant})`}
                  </span>
                  {item.unit && (
                    <span className="text-xs text-muted-foreground">{item.unit}</span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
