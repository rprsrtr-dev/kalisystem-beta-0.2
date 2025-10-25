import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Store } from '@/types';
import { toast } from 'sonner';

interface PasteListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: Store;
}

export function PasteListDialog({
  open,
  onOpenChange,
  store,
}: PasteListDialogProps) {
  const [text, setText] = useState('');

  const handleParse = () => {
    toast.info('Paste and parse feature coming soon!');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paste Item List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Paste your item list here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
          />
          <Button onClick={handleParse} className="w-full">
            Parse and Create Orders
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
