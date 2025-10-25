import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import SortableItem from './SortableItem';
import type { ParsedItem } from '@/pages/BulkOrder';

interface DroppableCardAreaProps {
  cardId: string;
  items: ParsedItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, qty: number) => void;
}

export default function DroppableCardArea({ cardId, items: cardItems, onRemoveItem, onUpdateQuantity }: DroppableCardAreaProps) {
  const { setNodeRef, isOver } = useDroppable({ id: cardId });

  return (
    <SortableContext
      items={cardItems.map(i => i.id)}
      strategy={verticalListSortingStrategy}
    >
      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[100px] p-2 rounded-lg border-2 border-dashed ${
          isOver ? 'border-primary bg-primary/10' : 'border-border/50'
        }`}
        id={cardId}
        aria-label={`Drop area for card ${cardId}`}
      >
        {cardItems.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            Drag items here
          </p>
        )}
        {cardItems.map(item => (
          <SortableItem key={item.id} item={item} onRemove={() => onRemoveItem(item.id)} onQuantityChange={qty => onUpdateQuantity(item.id, qty)} />
        ))}
      </div>
    </SortableContext>
  );
}