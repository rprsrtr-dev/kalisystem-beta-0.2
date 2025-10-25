import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Supplier, SUPPLIERS } from '@/types';
import { Search, Plus } from 'lucide-react';

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
  const [search, setSearch] = useState('');

  const filteredSuppliers = SUPPLIERS.filter((supplier) =>
    supplier.toLowerCase().includes(search.toLowerCase())
  );

  const showCreateButton = search.trim() && filteredSuppliers.length === 0;

  const handleSelect = (supplier: Supplier) => {
    onSelect(supplier);
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Supplier</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {showCreateButton && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">
                No supplier found. To add a new supplier, please contact the system administrator.
              </p>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredSuppliers.map((supplier) => (
              <Button
                key={supplier}
                variant={supplier === currentSupplier ? 'default' : 'outline'}
                onClick={() => handleSelect(supplier)}
                className="w-full justify-start"
              >
                {supplier}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
