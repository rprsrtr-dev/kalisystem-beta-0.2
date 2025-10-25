import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Supplier, SUPPLIERS } from '@/types';

interface SupplierSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSupplier: Supplier;
  onSelect: (supplier: Supplier) => void;
}

export function SupplierSelector({
  open,
  onOpenChange,
  currentSupplier,
  onSelect,
}: SupplierSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Supplier</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {SUPPLIERS.map((supplier) => (
            <Button
              key={supplier}
              variant={supplier === currentSupplier ? 'default' : 'outline'}
              onClick={() => onSelect(supplier)}
              className="justify-start"
            >
              {supplier}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
