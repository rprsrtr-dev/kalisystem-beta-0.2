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
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ItemEditForm } from './ItemEditForm';

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
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<Item | null>(null);

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

  const handleCreateNewItem = async () => {
    if (!search.trim()) return;

    try {
      const { data, error } = await supabase
        .from('items')
        .insert({
          name: search.trim(),
          supplier: supplier,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Item created');
      fetchItems();

      if (data) {
        handleSelectItem(data);
      }
      setSearch('');
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Failed to create item');
    }
  };

  const handleRightClick = (e: React.MouseEvent, item: Item) => {
    e.preventDefault();
    setSelectedItemForEdit(item);
    setEditingItem(item);
  };

  const handleItemUpdate = async (itemId: string, updates: Partial<Item>) => {
    try {
      const { error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Item updated');
      fetchItems();
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleItemDelete = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Item deleted');
      fetchItems();
      setEditingItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const showCreateButton = search.trim() && filteredItems.length === 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh]">
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
                autoFocus
              />
            </div>

            {showCreateButton && (
              <Button
                onClick={handleCreateNewItem}
                className="w-full"
                variant="default"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create "{search}"
              </Button>
            )}

            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredItems.map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSelectItem(item)}
                  onContextMenu={(e) => handleRightClick(e, item)}
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

      {editingItem && (
        <ItemEditForm
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          item={editingItem}
          onUpdate={handleItemUpdate}
          onDelete={handleItemDelete}
        />
      )}
    </>
  );
}
