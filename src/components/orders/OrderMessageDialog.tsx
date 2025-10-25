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
import { useState, useEffect } from 'react';

interface OrderMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onUpdate?: (orderId: string, updates: Partial<Order>) => void;
}

export function OrderMessageDialog({
  open,
  onOpenChange,
  order,
  onUpdate,
}: OrderMessageDialogProps) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      setMessage(order.order_message || generateOrderMessage(order));
    }
  }, [open, order]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onUpdate && message !== order.order_message) {
      onUpdate(order.id, { order_message: message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={12}
          />
          <div className="flex gap-2">
            <Button onClick={handleCopy} variant="outline" className="flex-1">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            {onUpdate && (
              <Button onClick={handleSave} className="flex-1">
                Save
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
