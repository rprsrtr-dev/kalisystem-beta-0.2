import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SupplierForm } from '@/components/forms/SupplierForm';
import { useApp } from '@/contexts/AppContext';

export function SupplierCard({ supplier, onEdit }: { supplier: any; onEdit?: (data: any) => void }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [editData, setEditData] = useState(supplier);
  const { deleteSupplier, updateSupplier } = useApp();

  const handleMouseDown = () => {
    timerRef.current = setTimeout(() => setIsEditOpen(true), 600);
  };
  const handleMouseUp = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsEditOpen(true);
  };

  return (
    <Card
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      className="relative group flex flex-col min-h-fit max-h-full transition-all duration-200 ease-in-out"
    >
      <div className="flex items-center justify-between p-4">
        <span className="font-medium">{supplier.name.toUpperCase()}</span>
      </div>
      
      {/* Content area with adaptive height */}
      <div className="flex-grow overflow-y-auto">
        <div className="p-4 space-y-2">
          {supplier.items?.map((item: any) => (
            <div key={item.id} className="text-sm">
              {item.name}
            </div>
          ))}
        </div>
      </div>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          <SupplierForm
            data={editData}
            setData={setEditData}
            onSave={() => {
              updateSupplier(supplier.id, editData);
              if (onEdit) onEdit(editData);
              setIsEditOpen(false);
            }}
            onCancel={() => setIsEditOpen(false)}
            isEdit={true}
            onDelete={() => {
              deleteSupplier(supplier.id);
              setIsEditOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
