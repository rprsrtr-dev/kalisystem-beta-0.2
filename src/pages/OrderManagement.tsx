import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, OrderStatus, STORES, ORDER_STATUSES } from '@/types';
import { DispatchingTab } from '@/components/orders/DispatchingTab';
import { OrderTab } from '@/components/orders/OrderTab';

export default function OrderManagement() {
  const [activeStore, setActiveStore] = useState<Store>('CV2');
  const [activeStatus, setActiveStatus] = useState<OrderStatus>('dispatching');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-sm font-medium text-muted-foreground mb-4">Kalisystem</h1>

          <Tabs value={activeStore} onValueChange={(v) => setActiveStore(v as Store)}>
            <TabsList className="grid w-full grid-cols-4">
              {STORES.map((store) => (
                <TabsTrigger key={store} value={store}>
                  {store}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={activeStatus} onValueChange={(v) => setActiveStatus(v as OrderStatus)}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {ORDER_STATUSES.map((status) => (
              <TabsTrigger key={status} value={status} className="capitalize">
                {status.replace('_', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dispatching">
            <DispatchingTab store={activeStore} />
          </TabsContent>

          <TabsContent value="on_the_way">
            <OrderTab store={activeStore} status="on_the_way" />
          </TabsContent>

          <TabsContent value="received">
            <OrderTab store={activeStore} status="received" />
          </TabsContent>

          <TabsContent value="completed">
            <OrderTab store={activeStore} status="completed" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
