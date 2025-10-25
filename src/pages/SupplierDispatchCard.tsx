import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QuantityInput } from '@/components/QuantityInput';
import { SupplierSelector } from '@/components/SupplierSelector';
import { GripVertical, ChevronDown, ChevronRight, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { ParsedItem } from './BulkOrder';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SupplierForm } from '@/components/forms/SupplierForm';
import { Supplier } from '@/types';
import { toast } from 'sonner';
import { useLongPress } from '@/hooks/use-long-press';

interface SupplierCard {
  id: string;
  supplier: string;
  items: ParsedItem[];
}

interface SupplierDispatchCardProps {
  card: SupplierCard;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMoveToOrder: (cardId: string) => void;
  onOpenAddItem: (cardId: string) => void;
  onRemove: (cardId: string) => void;
  onRemoveItem: (cardId: string, itemId: string) => void;
  onUpdateQuantity: (cardId: string, itemId: string, quantity: number) => void;
  onUpdateSupplier: (cardId: string, supplier: string) => void;
  isNewCard?: boolean;
}

interface DraggableItemProps {
  item: ParsedItem;
  cardId: string;
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
  onUpdateQuantity: (cardId: string, itemId: string, quantity: number) => void;
  onRemoveItem: (cardId: string, itemId: string) => void;
}

function DraggableItem({
  item,
  cardId,
  editingItemId,
  setEditingItemId,
  onUpdateQuantity,
  onRemoveItem,
}: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-muted rounded-md group"
      data-id={item.id}
    >
      <div {...listeners} {...attributes} className="touch-none">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.name}</div>
      </div>
      {editingItemId === item.id ? (
        <QuantityInput
          value={item.quantity}
          onChange={(quantity) => {
            onUpdateQuantity(cardId, item.id, quantity);
            setEditingItemId(null);
          }}
          min={1}
          className="flex-shrink-0"
        />
      ) : (
        <span
          className="px-2 py-1 bg-muted rounded cursor-pointer text-sm font-medium"
          onClick={() => setEditingItemId(item.id)}
        >
          {item.quantity}
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemoveItem(cardId, item.id)}
        className="p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}

export function SupplierDispatchCard({
  card,
  isCollapsed,
  onToggleCollapse,
  onMoveToOrder,
  onOpenAddItem,
  onRemove,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateSupplier,
  isNewCard = false,
}: SupplierDispatchCardProps) {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useApp();
  const [editingSupplier, setEditingSupplier] = useState(false);
  const [supplierName, setSupplierName] = useState(card.supplier);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editSupplierDialogOpen, setEditSupplierDialogOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const isNewItemsCard = card.supplier === 'New Items';
  const canEditSupplier = isNewItemsCard || isNewCard;

  const { setNodeRef, isOver } = useDroppable({
    id: card.id,
  });

  const handleEditSupplier = () => {
    const existingSupplier = suppliers.find(s => s.name === card.supplier);
    if (existingSupplier) {
      setSupplierToEdit(existingSupplier);
      setEditSupplierDialogOpen(true);
    } else {
      toast.error('Supplier not found');
    }
  };

  const longPressProps = useLongPress({
    onLongPress: handleEditSupplier,
  });

  const handleSupplierSave = () => {
    if (supplierName.trim() && supplierName !== card.supplier) {
      onUpdateSupplier(card.id, supplierName.toUpperCase());
    }
    setEditingSupplier(false);
  };

  const handleSupplierKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSupplierSave();
    } else if (e.key === 'Escape') {
      setSupplierName(card.supplier);
      setEditingSupplier(false);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      className={`flex flex-col min-h-fit transition-all duration-200 ${isOver ? 'ring-2 ring-primary' : ''}`}
    >
      <div onClick={onToggleCollapse} className="cursor-pointer flex-shrink-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse();
                }}
                className="p-1 h-6 w-6"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>

              {editingSupplier && canEditSupplier ? (
                <div onClick={(e) => e.stopPropagation()} className="flex-1">
                  <SupplierSelector
                    value={supplierName}
                    suppliers={suppliers}
                    onSelect={(name) => {
                      onUpdateSupplier(card.id, name.toUpperCase());
                      setSupplierName(name.toUpperCase());
                      setEditingSupplier(false);
                    }}
                    onCreateNew={(name) => {
                        const upperName = name.toUpperCase();
                        addSupplier({
                          name: upperName,
                          paymentMethod: 'COD',
                          orderType: 'Delivery',
                          defaultPaymentMethod: 'COD',
                          defaultOrderType: 'Delivery',
                        });
                        onUpdateSupplier(card.id, upperName);
                        setSupplierName(upperName);
                        setEditingSupplier(false);
                      }}
                    onEditSupplier={(supplier) => {
                      setSupplierToEdit(supplier);
                      setEditSupplierDialogOpen(true);
                      setEditingSupplier(false);
                    }}
                  />
                </div>
              ) : (
                <CardTitle
                  className={`text-lg ${canEditSupplier ? 'cursor-pointer hover:text-primary' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canEditSupplier) {
                      setEditingSupplier(true);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEditSupplier();
                  }}
                  {...(!canEditSupplier ? longPressProps : {})}
                >
                  {card.supplier.toUpperCase()}
                </CardTitle>
              )}
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(card.id);
                }}
                className="p-1 h-6 w-6 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </div>

      {!isCollapsed && (
        <CardContent className="pb-3 flex-grow flex flex-col">
          <ScrollArea className="flex-grow">
            <div className="space-y-2 pr-2">
              {card.items.map((item) => {
                return (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    cardId={card.id}
                    editingItemId={editingItemId}
                    setEditingItemId={setEditingItemId}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemoveItem={onRemoveItem}
                  />
                );
              })}
              {card.items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No items in this card</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenAddItem(card.id)}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t">
            {!isCollapsed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenAddItem(card.id)}
                className="gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Item
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMoveToOrder(card.id)}
              className="gap-1"
            >
              <ShoppingCart className="w-3 h-3" />
              Send to Order
            </Button>
          </div>
        </CardContent>
      )}

      {/* Edit Supplier Dialog */}
      <Dialog open={editSupplierDialogOpen} onOpenChange={setEditSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          {supplierToEdit && (
            <SupplierForm
              data={supplierToEdit}
              setData={setSupplierToEdit}
              onSave={() => {
                if (supplierToEdit) {
                  updateSupplier(supplierToEdit.id, supplierToEdit);
                  toast.success('Supplier updated successfully');
                  setEditSupplierDialogOpen(false);
                  setSupplierToEdit(null);
                }
              }}
              onCancel={() => {
                setEditSupplierDialogOpen(false);
                setSupplierToEdit(null);
              }}
              isEdit={true}
              onDelete={() => {
                if (supplierToEdit) {
                  deleteSupplier(supplierToEdit.id);
                  toast.success('Supplier deleted successfully');
                  setEditSupplierDialogOpen(false);
                  setSupplierToEdit(null);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
