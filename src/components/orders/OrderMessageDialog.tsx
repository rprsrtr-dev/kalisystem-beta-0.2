import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Order } from '@/types';
import { generateOrderMessage } from '@/lib/orderMessage';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface OrderMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

export function OrderMessageDialog({
  open,
  onOpenChange,
  order,
}: OrderMessageDialogProps) {
  const [copied, setCopied] = useState(false);
  const message = order.order_message || generateOrderMessage(order);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea value={message} readOnly rows={12} />
          <Button onClick={handleCopy} className="w-full">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
