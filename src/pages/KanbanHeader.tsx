import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, X } from 'lucide-react';

interface KanbanHeaderProps {
  onAddCard: () => void;
  onApproveDispatch: () => void;
  onClearDispatch: () => void;
}

export function KanbanHeader({
  onAddCard,
  onApproveDispatch,
  onClearDispatch,
}: KanbanHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
      </div>

      <div className="flex gap-2">
        <Button onClick={onClearDispatch} variant="outline" size="sm">
          <X className="w-4 h-4 mr-2" />
          Clear
        </Button>
        <Button onClick={onAddCard} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Card
        </Button>
        <Button onClick={onApproveDispatch} size="sm">
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve Dispatch
        </Button>
      </div>
    </div>
  );
}
