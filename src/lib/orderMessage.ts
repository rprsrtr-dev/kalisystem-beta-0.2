import { Order } from '@/types';

export function generateOrderMessage(order: Order): string {
  const lines: string[] = [];

  lines.push(`#️⃣ ${order.order_id}`);
  lines.push(`🚚 Delivery`);
  lines.push(`📌 ${order.store}`);
  lines.push('');

  order.items.forEach((item) => {
    const itemName = item.variant ? `${item.name} (${item.variant})` : item.name;
    const unit = item.unit || '';
    lines.push(`🔹${itemName} ${item.quantity} ${unit}`);
  });

  return lines.join('\n');
}
