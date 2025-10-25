import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, Store, OrderStatus, Supplier } from '@/types';
import { toast } from 'sonner';

export function useOrders(store: Store, status: OrderStatus) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const subscription = subscribeToOrders();
    return () => {
      subscription.unsubscribe();
    };
  }, [store, status]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store', store)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToOrders = () => {
    return supabase
      .channel(`orders_${store}_${status}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store=eq.${store},status=eq.${status}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();
  };

  const createOrder = async (supplier: Supplier) => {
    try {
      const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase.from('orders').insert({
        order_id: orderId,
        store,
        supplier,
        status: 'dispatching',
        items: [],
      });

      if (error) throw error;
      toast.success('Order created');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    }
  };

  const updateOrder = async (orderId: string, updates: Partial<Order>) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);

      if (error) throw error;
      toast.success('Order deleted');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  return { orders, loading, createOrder, updateOrder, deleteOrder };
}
