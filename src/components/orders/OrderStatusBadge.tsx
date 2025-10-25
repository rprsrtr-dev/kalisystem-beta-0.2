import { Clock, Package, CheckCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PendingOrderStatus } from '@/types';

interface OrderStatusBadgeProps {
  status: PendingOrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const getStatusIcon = (status: PendingOrderStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'completed':
        return <CheckCheck className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: PendingOrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'completed':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
    }
  };

  return (
    <Badge variant="secondary" className={`${getStatusColor(status)} gap-2`}>
      {getStatusIcon(status)}
      <span className="capitalize">{status}</span>
    </Badge>
  );
}