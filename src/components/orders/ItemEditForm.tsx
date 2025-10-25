import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Item, Unit, Supplier, UNITS, SUPPLIERS } from '@/types';
import { Trash2 } from 'lucide-react';

interface ItemEditFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
  onUpdate: (itemId: string, updates: Partial<Item>) => void;
  onDelete: (itemId: string) => void;
}

export function ItemEditForm({
  open,
  onOpenChange,
  item,
  onUpdate,
  onDelete,
}: ItemEditFormProps) {
  const [name, setName] = useState(item.name);
  const [variant, setVariant] = useState(item.variant || '');
  const [unit, setUnit] = useState<Unit | undefined>(item.unit || undefined);
  const [supplier, setSupplier] = useState<Supplier>(item.supplier);

  const handleSave = () => {
    onUpdate(item.id, {
      name,
      variant: variant || null,
      unit: unit || null,
      supplier,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this item?')) {
      onDelete(item.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name"
            />
          </div>

          <div>
            <Label htmlFor="variant">Variant</Label>
            <Input
              id="variant"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              placeholder="Optional variant"
            />
          </div>

          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select value={unit} onValueChange={(value) => setUnit(value as Unit)}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="supplier">Default Supplier</Label>
            <Select value={supplier} onValueChange={(value) => setSupplier(value as Supplier)}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {SUPPLIERS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="mr-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
