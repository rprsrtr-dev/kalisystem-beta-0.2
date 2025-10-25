import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QuantityInput } from '@/components/QuantityInput';
import { Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ParsedItem } from '@/pages/BulkOrder';

interface SortableItemProps {
  item: ParsedItem;
  onRemove: () => void;
  onQuantityChange: (qty: number) => void;
}

export default function SortableItem({ item, onRemove, onQuantityChange }: SortableItemProps) {
  const [showQuantity, setShowQuantity] = useState(false);
  const quantityRef = useRef<HTMLDivElement>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) return;
    setShowQuantity(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quantityRef.current && !quantityRef.current.contains(event.target as Node)) {
        setShowQuantity(false);
      }
    };
    if (showQuantity) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showQuantity]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border"
      onDoubleClick={handleDoubleClick}
      aria-label={`Order item: ${item.name}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing" data-drag-handle aria-label="Drag handle">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {item.name}
        </p>
      </div>
      {showQuantity ? (
        <div ref={quantityRef}>
          <QuantityInput
            value={item.quantity}
            onChange={onQuantityChange}
            data-testid={`quantity-${item.id}`}
            aria-label="Quantity input"
          />
        </div>
      ) : (
        <Badge variant="secondary" className="shrink-0" onDoubleClick={() => setShowQuantity(true)} aria-label="Show quantity editor">
          {item.quantity}
        </Badge>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={onRemove}
        className="h-8 w-8 p-0"
        data-testid={`button-remove-${item.id}`}
        aria-label="Remove item"
      >
        <Trash2 className="w-3 h-3 text-destructive" />
      </Button>
    </div>
  );
}
