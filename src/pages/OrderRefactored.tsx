import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { UnifiedOrderCard } from '@/components/orders/UnifiedOrderCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { QuantityInput } from '@/components/QuantityInput';
import {
  ArrowLeft,
  Share2,
  Trash2,
  Package,
  DollarSign,
  FileText,
  MessageSquare,
  Copy,
  Upload,
  Camera
} from 'lucide-react';
import { AddItemModal } from '@/components/AddItemModal';
import {
  PendingOrderStatus,
  PaymentMethod,
  OrderType,
  StoreTag,
  PendingOrder,
  ORDER_TYPES,
  STORE_TAGS,
  PAYMENT_METHODS
} from '@/types';

export default function Order() {
  const navigate = useNavigate();
  const {
    currentOrder,
    currentOrderMetadata,
    updateOrderItem,
    removeFromOrder,
    updateOrderMetadata,
    clearOrder,
    addPendingOrder,
    pendingOrders,
    updatePendingOrder,
    deletePendingOrder,
    items,
    addItem,
    updateItem
  } = useApp();

  const [selectedStore, setSelectedStore] = useState<StoreTag>(STORE_TAGS[0]);
  const [activeTab, setActiveTab] = useState<'current' | 'processing' | 'pending' | 'completed'>('current');
  const [amountDialogOpen, setAmountDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [amountInput, setAmountInput] = useState('');
  const [invoiceUrlInput, setInvoiceUrlInput] = useState('');
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [selectedOrderForAddItem, setSelectedOrderForAddItem] = useState<string>('');
  const [orderMessageDialogOpen, setOrderMessageDialogOpen] = useState(false);
  const [selectedOrderForMessage, setSelectedOrderForMessage] = useState<string>('');
  const [invoiceTab, setInvoiceTab] = useState<'url' | 'upload' | 'camera'>('url');
  const [invoicePreview, setInvoicePreview] = useState<string>('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedStoreForShare, setSelectedStoreForShare] = useState<StoreTag | ''>('');

  const currentOrderFiltered = useMemo(() => {
    return currentOrder.filter(item => item.storeTag === selectedStore);
  }, [currentOrder, selectedStore]);

  const processingOrders = useMemo(() => {
    return pendingOrders.filter(order => order.status === 'processing' && order.storeTag === selectedStore);
  }, [pendingOrders, selectedStore]);

  const pendingOrdersFiltered = useMemo(() => {
    return pendingOrders.filter(order => order.status === 'pending' && order.storeTag === selectedStore);
  }, [pendingOrders, selectedStore]);

  const completedOrders = useMemo(() => {
    return pendingOrders.filter(order => order.status === 'completed' && order.storeTag === selectedStore);
  }, [pendingOrders, selectedStore]);

  const generateOrderText = () => {
    if (currentOrder.length === 0) return '';

    const orderId = getOrderId();
    const orderTypeEmoji = currentOrderMetadata.orderType === 'Delivery' ? '🚚' : '📦';
    const orderTypeText = currentOrderMetadata.orderType === 'Delivery' ? 'Delivery order' : 'Pickup order';

    const paymentEmojis: Record<PaymentMethod, string> = {
      'COD': '💰',
      'Aba': '💳',
      'TrueMoney': '🧧',
      'CreditLine': '💸',
    };

    let header = `#️⃣ ${orderId}\n${orderTypeEmoji} ${orderTypeText}`;

    if (currentOrderMetadata.manager) {
      header += `\n👤 ${currentOrderMetadata.manager}`;
    }

    if (currentOrderMetadata.store) {
      header += `\n📌 ${currentOrderMetadata.store}`;
    }

    if (currentOrderMetadata.paymentMethod) {
      const emoji = paymentEmojis[currentOrderMetadata.paymentMethod];
      header += `\n💲 ${emoji} ${currentOrderMetadata.paymentMethod}`;
    }

    const orderLines = currentOrder.map(
      ({ item, quantity }) =>
        `🔹 ${item.name} x${quantity}`
    );

    return `${header}\n\n${orderLines.join('\n')}`;
  };

  const generatePendingOrderText = (orderId: string) => {
    const order = pendingOrders.find(o => o.id === orderId);
    if (!order) return '';

    const paymentEmojis: Record<PaymentMethod, string> = {
      'COD': '💰',
      'Aba': '💳',
      'TrueMoney': '🧧',
      'CreditLine': '💸',
    };

    const orderTypeEmoji = order.orderType === 'Delivery' ? '🚚' : '📦';
    const orderTypeText = order.orderType === 'Delivery' ? 'Delivery order' : 'Pickup order';

    let header = `#️⃣ ${order.supplier}_${order.storeTag || 'store'}_${String(Date.now()).slice(-3)}\n${orderTypeEmoji} ${orderTypeText}`;

    if (order.storeTag) {
      header += `\n📌 ${order.storeTag.toUpperCase()}`;
    }

    if (order.paymentMethod) {
      const emoji = paymentEmojis[order.paymentMethod];
      header += `\n💲 ${emoji} ${order.paymentMethod}`;
    }

    const orderLines = order.items.map(
      ({ item, quantity }) =>
        `🔹 ${item.name} x${quantity}`
    );

    return `${header}\n\n${orderLines.join('\n')}`;
  };

  const handleCopy = () => {
    const text = generateOrderText();
    navigator.clipboard.writeText(text);
    toast.success('Order copied to clipboard!');
    setMessageDialogOpen(false);
  };

  const handleCopyPendingOrder = () => {
    const text = generatePendingOrderText(selectedOrderForMessage);
    navigator.clipboard.writeText(text);
    toast.success('Order copied to clipboard!');
    setOrderMessageDialogOpen(false);
  };

  const handleSendOrder = () => {
    if (currentOrder.length === 0) return;

    const supplierGroups = groupBySupplier();
    const suppliers = Object.keys(supplierGroups);

    suppliers.forEach(supplier => {
      const items = supplierGroups[supplier].map(oi => ({
        item: oi.item,
        quantity: oi.quantity,
        isNewItem: false,
      }));

      addPendingOrder({
        supplier,
        items,
        status: 'processing',
        paymentMethod: currentOrderMetadata.paymentMethod,
        orderType: currentOrderMetadata.orderType,
        storeTag: currentOrderMetadata.store,
      });
    });

    clearOrder();
    toast.success('Order sent to supplier!');
  };

  const handleHoldOrder = () => {
    if (currentOrder.length === 0) return;

    const supplierGroups = groupBySupplier();
    const suppliers = Object.keys(supplierGroups);

    suppliers.forEach(supplier => {
      const items = supplierGroups[supplier].map(oi => ({
        item: oi.item,
        quantity: oi.quantity,
        isNewItem: false,
      }));

      addPendingOrder({
        supplier,
        items,
        status: 'pending',
        paymentMethod: currentOrderMetadata.paymentMethod,
        orderType: currentOrderMetadata.orderType,
        storeTag: currentOrderMetadata.store,
      });
    });

    clearOrder();
    toast.success('Order saved to pending!');
  };

  const handleShareCompleted = (order: PendingOrder) => {
    const paymentEmojis: Record<PaymentMethod, string> = {
      'COD': '💰',
      'Aba': '💳',
      'TrueMoney': '🧧',
      'CreditLine': '💸',
    };

    let text = `✅ Completed Order from ${order.supplier}\n`;
    text += `Status: Completed\n`;
    if (order.orderType) text += `Type: ${order.orderType}\n`;
    if (order.storeTag) text += `Store: ${order.storeTag.toUpperCase()}\n`;
    if (order.paymentMethod) {
      const emoji = paymentEmojis[order.paymentMethod] || '';
      text += `Payment: ${emoji} ${order.paymentMethod}\n`;
    }
    text += `Amount: $${order.amount || 'N/A'}\n\n`;
    text += `Items:\n`;
    order.items.forEach(item => {
      text += `• ${item.item.name} x${item.quantity}\n`;
    });
    if (order.invoiceUrl) {
      text += `\nInvoice: ${order.invoiceUrl}`;
    }
    text += `\nCompleted on: ${order.updatedAt.toLocaleDateString()}`;

    if (navigator.share) {
      navigator.share({ text }).catch(err => {
        console.error('Share failed:', err);
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Order copied to clipboard!');
    }
  };

  const groupBySupplier = () => {
    const groups: Record<string, typeof currentOrder> = {};

    currentOrderFiltered.forEach(orderItem => {
      const supplier = orderItem.item.supplier || 'Unknown';
      if (!groups[supplier]) {
        groups[supplier] = [];
      }
      groups[supplier].push(orderItem);
    });

    return groups;
  };

  const supplierGroups = groupBySupplier();

  const getOrderId = () => {
    const firstSupplier = Object.keys(supplierGroups)[0] || 'Unknown';
    const storeName = currentOrderMetadata.store || 'store';
    const orderNumber = String(Date.now()).slice(-3);
    return `${firstSupplier}_${storeName}_${orderNumber}`;
  };

  const handleAmountSubmit = () => {
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    updatePendingOrder(selectedOrderId, { amount, isPaid: true });
    setAmountDialogOpen(false);
    toast.success('Amount set and order marked as paid');
  };

  const handleInvoiceSubmit = () => {
    const invoiceData = invoicePreview || invoiceUrlInput.trim();
    if (!invoiceData) {
      toast.error('Please enter an invoice URL or upload a file');
      return;
    }
    updatePendingOrder(selectedOrderId, { invoiceUrl: invoiceData });
    setInvoiceDialogOpen(false);
    setInvoiceUrlInput('');
    setInvoicePreview('');
    setInvoiceTab('url');
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    toast.success('Invoice attached successfully');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setInvoicePreview(base64);
      toast.success('File uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
    } catch (error) {
      toast.error('Could not access camera. Please check permissions.');
      console.error('Camera error:', error);
    }
  };

  const capturePhoto = () => {
    if (!cameraStream) return;

    const video = document.getElementById('camera-preview') as HTMLVideoElement;
    if (!video) {
      toast.error('Camera not ready');
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Camera not ready yet, please wait a moment');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error('Failed to capture photo');
      return;
    }

    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.95);
    setInvoicePreview(base64);

    cameraStream.getTracks().forEach(track => track.stop());
    setCameraStream(null);
    toast.success('Photo captured successfully');
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleShareWithManager = () => {
    if (!selectedStoreForShare) {
      toast.error('Please select a store');
      return;
    }

    const hasProcessingOrders = pendingOrders.some(
      order => order.status === 'processing' && order.storeTag === selectedStoreForShare
    );
    const hasCompletedOrders = pendingOrders.some(
      order => order.status === 'completed' && order.storeTag === selectedStoreForShare
    );

    if (!hasProcessingOrders && !hasCompletedOrders) {
      toast.error('No active or completed orders for this store');
      return;
    }

    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const shareUrl = `${baseUrl}/manager-view?store=${encodeURIComponent(selectedStoreForShare)}`;

    navigator.clipboard.writeText(shareUrl);
    toast.success('Manager link copied to clipboard! The link will show processing and completed orders for ' + selectedStoreForShare.toUpperCase());
    setShareDialogOpen(false);
    setSelectedStoreForShare('');
  };

  useEffect(() => {
    if (cameraStream) {
      const video = document.getElementById('camera-preview') as HTMLVideoElement;
      if (video) {
        video.srcObject = cameraStream;
        video.play().catch(err => console.error('Error playing video:', err));
      }
    }
  }, [cameraStream]);

  useEffect(() => {
    if (!invoiceDialogOpen) {
      stopCamera();
      setInvoicePreview('');
      setInvoiceUrlInput('');
      setInvoiceTab('url');
    }
  }, [invoiceDialogOpen]);

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full p-2 bg-accent hover:bg-accent/80 active:bg-accent/60 text-accent-foreground transition-colors"
              onClick={() => navigate(-1)}
              aria-label="Back"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold">Orders</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => setShareDialogOpen(true)}
            className="gap-2"
            data-testid="button-share-orders"
          >
            <Share2 className="w-4 h-4" />
            Share with Manager
          </Button>
        </div>

        <Tabs value={selectedStore} onValueChange={(v) => setSelectedStore(v as StoreTag)} className="w-full">
          <TabsList className="w-full grid grid-cols-6 mb-4">
            {STORE_TAGS.map((store) => (
              <TabsTrigger key={store} value={store} data-testid={`tab-store-${store}`}>
                📌 {store.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'current' | 'processing' | 'pending' | 'completed')} className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="current" data-testid="tab-current-order">
              Current ({currentOrderFiltered.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending-orders">Pending ({pendingOrdersFiltered.length})</TabsTrigger>
            <TabsTrigger value="processing" data-testid="tab-processing">Processing ({processingOrders.length})</TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed-orders">Completed ({completedOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6 mt-6">
            {currentOrderFiltered.length === 0 ? (
              <Card className="p-12 bg-card border-border">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg">Your order is empty</p>
                  <p className="text-sm mt-2">Add items to get started</p>
                </div>
              </Card>
            ) : (
              <>
                <Card className="p-4 bg-card border-border">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Order Type</label>
                      <Select
                        value={currentOrderMetadata.orderType}
                        onValueChange={(value) => updateOrderMetadata({ orderType: value as OrderType })}
                      >
                        <SelectTrigger data-testid="select-order-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type === 'Delivery' ? '🚚' : '📦'} {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Store</label>
                      <Select
                        value={currentOrderMetadata.store || ''}
                        onValueChange={(value) => updateOrderMetadata({ store: value as StoreTag })}
                      >
                        <SelectTrigger data-testid="select-store">
                          <SelectValue placeholder="Select store" />
                        </SelectTrigger>
                        <SelectContent>
                          {STORE_TAGS.map((store) => (
                            <SelectItem key={store} value={store}>
                              📌 {store.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payment</label>
                      <Select
                        value={currentOrderMetadata.paymentMethod || ''}
                        onValueChange={(value) => updateOrderMetadata({ paymentMethod: value as PaymentMethod })}
                      >
                        <SelectTrigger data-testid="select-payment">
                          <SelectValue placeholder="Select payment" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method === 'COD' ? '💰' : method === 'Aba' ? '💳' : method === 'TrueMoney' ? '🧧' : '💸'} {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                <div className="space-y-4">
                  {Object.entries(supplierGroups).map(([supplier, items]) => (
                    <Card key={supplier} className="p-4 bg-card border-border">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{supplier}</h3>
                          <div className="flex items-center gap-2">
                            {currentOrderMetadata.paymentMethod && (
                              <span className="text-sm">
                                {currentOrderMetadata.paymentMethod === 'COD' ? '💰' : currentOrderMetadata.paymentMethod === 'Aba' ? '💳' : currentOrderMetadata.paymentMethod === 'TrueMoney' ? '🧧' : '💸'}
                              </span>
                            )}
                            {currentOrderMetadata.orderType && (
                              <span className="text-sm">
                                {currentOrderMetadata.orderType === 'Delivery' ? '🚚' : '📦'}
                              </span>
                            )}
                            {currentOrderMetadata.store && (
                              <span className="text-sm">📌 {currentOrderMetadata.store.toUpperCase()}</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {items.map(({ item, quantity, storeTag }) => (
                            <div key={`${item.id}-${storeTag}`} className="flex items-center justify-between gap-3" data-testid={`order-item-${item.id}`}>
                              <span className="flex-1 font-medium">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <QuantityInput
                                  value={quantity}
                                  onChange={(qty) => updateOrderItem(item.id, qty, storeTag)}
                                  data-testid={`quantity-${item.id}`}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeFromOrder(item.id, storeTag)}
                                  data-testid={`button-remove-${item.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleSendOrder}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    data-testid="button-send"
                  >
                    <Package className="w-3 h-3" />
                    Mark as sent
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedOrderId('current');
                      setAmountInput('');
                      setAmountDialogOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    data-testid="button-set-amount"
                  >
                    <DollarSign className="w-3 h-3" />
                    Set amount
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedOrderId('current');
                      setInvoiceUrlInput('');
                      setInvoiceDialogOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    data-testid="button-attach-invoice"
                  >
                    <FileText className="w-3 h-3" />
                    Attach invoice
                  </Button>
                  <Button
                    onClick={() => setMessageDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    data-testid="button-order-message"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Order Message
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-6 mt-6">
            {pendingOrdersFiltered.length === 0 ? (
              <Card className="p-12 bg-card border-border">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg">No pending orders</p>
                  <p className="text-sm mt-2">Saved orders will appear here</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingOrdersFiltered.map((order) => (
                  <UnifiedOrderCard
                    key={order.id}
                    order={order}
                    status="pending"
                    onUpdateOrder={updatePendingOrder}
                    onDeleteOrder={deletePendingOrder}
                    onAddItem={(orderId) => {
                      setSelectedOrderForAddItem(orderId);
                      setAddItemModalOpen(true);
                    }}
                    onSetAmount={(orderId) => {
                      setSelectedOrderId(orderId);
                      setAmountInput('');
                      setAmountDialogOpen(true);
                    }}
                    onAttachInvoice={(orderId) => {
                      setSelectedOrderId(orderId);
                      setInvoiceUrlInput('');
                      setInvoiceDialogOpen(true);
                    }}
                    onOrderMessage={(orderId) => {
                      setSelectedOrderForMessage(orderId);
                      setOrderMessageDialogOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="processing" className="space-y-6 mt-6">
            {processingOrders.length === 0 ? (
              <Card className="p-12 bg-card border-border">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg">No orders in processing</p>
                  <p className="text-sm mt-2">Sent orders will appear here</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {processingOrders.map((order) => (
                  <UnifiedOrderCard
                    key={order.id}
                    order={order}
                    status="processing"
                    onUpdateOrder={updatePendingOrder}
                    onDeleteOrder={deletePendingOrder}
                    onAddItem={(orderId) => {
                      setSelectedOrderForAddItem(orderId);
                      setAddItemModalOpen(true);
                    }}
                    onSetAmount={(orderId) => {
                      setSelectedOrderId(orderId);
                      setAmountInput('');
                      setAmountDialogOpen(true);
                    }}
                    onAttachInvoice={(orderId) => {
                      setSelectedOrderId(orderId);
                      setInvoiceUrlInput('');
                      setInvoiceDialogOpen(true);
                    }}
                    onOrderMessage={(orderId) => {
                      setSelectedOrderForMessage(orderId);
                      setOrderMessageDialogOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6 mt-6">
            {completedOrders.length === 0 ? (
              <Card className="p-12 bg-card border-border">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg">No completed orders</p>
                  <p className="text-sm mt-2">Completed orders will appear here</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <UnifiedOrderCard
                    key={order.id}
                    order={order}
                    status="completed"
                    onUpdateOrder={updatePendingOrder}
                    onDeleteOrder={deletePendingOrder}
                    onAddItem={() => {}}
                    onSetAmount={(orderId) => {
                      setSelectedOrderId(orderId);
                      setAmountInput('');
                      setAmountDialogOpen(true);
                    }}
                    onAttachInvoice={(orderId) => {
                      setSelectedOrderId(orderId);
                      setInvoiceUrlInput('');
                      setInvoiceDialogOpen(true);
                    }}
                    onOrderMessage={() => {}}
                    onShare={handleShareCompleted}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={amountDialogOpen} onOpenChange={setAmountDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Order Amount</DialogTitle>
              <DialogDescription>
                Enter the total amount for this order
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  data-testid="input-amount"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAmountDialogOpen(false)} data-testid="button-cancel-amount">
                Cancel
              </Button>
              <Button onClick={handleAmountSubmit} data-testid="button-submit-amount">
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Attach Invoice</DialogTitle>
              <DialogDescription>
                Choose how to attach your invoice
              </DialogDescription>
            </DialogHeader>
            <Tabs value={invoiceTab} onValueChange={(v) => setInvoiceTab(v as 'url' | 'upload' | 'camera')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="url" className="gap-1">
                  <FileText className="w-4 h-4" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-1">
                  <Upload className="w-4 h-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="camera" className="gap-1">
                  <Camera className="w-4 h-4" />
                  Camera
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-url">Invoice URL</Label>
                  <Input
                    id="invoice-url"
                    type="text"
                    placeholder="https://..."
                    value={invoiceUrlInput}
                    onChange={(e) => setInvoiceUrlInput(e.target.value)}
                    data-testid="input-invoice-url"
                  />
                  <p className="text-sm text-muted-foreground">
                    Paste a link to your online invoice
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice-file">Upload Invoice File</Label>
                    <Input
                      id="invoice-file"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      data-testid="input-invoice-file"
                    />
                    <p className="text-sm text-muted-foreground">
                      Accepts images and PDF files
                    </p>
                  </div>
                  {invoicePreview && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      {invoicePreview.startsWith('data:image') ? (
                        <img src={invoicePreview} alt="Invoice preview" className="max-w-full h-auto rounded" />
                      ) : (
                        <div className="text-center py-4">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                          <p className="text-sm mt-2">PDF file uploaded successfully</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="camera" className="space-y-4 py-4">
                <div className="space-y-4">
                  {!cameraStream && !invoicePreview && (
                    <div className="space-y-4">
                      <Button onClick={startCamera} className="w-full gap-2">
                        <Camera className="w-4 h-4" />
                        Start Camera
                      </Button>
                      <p className="text-sm text-muted-foreground text-center">
                        Click to access your device camera
                      </p>
                    </div>
                  )}
                  {cameraStream && !invoicePreview && (
                    <div className="space-y-4">
                      <div className="relative border rounded-lg overflow-hidden bg-black">
                        <video
                          id="camera-preview"
                          autoPlay
                          playsInline
                          className="w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={capturePhoto} className="flex-1 gap-2">
                          <Camera className="w-4 h-4" />
                          Capture Photo
                        </Button>
                        <Button onClick={stopCamera} variant="outline">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  {invoicePreview && (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <img src={invoicePreview} alt="Captured invoice" className="max-w-full h-auto rounded" />
                      </div>
                      <Button
                        onClick={() => {
                          setInvoicePreview('');
                          startCamera();
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Retake Photo
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)} data-testid="button-cancel-invoice">
                Cancel
              </Button>
              <Button onClick={handleInvoiceSubmit} data-testid="button-submit-invoice">
                Attach Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order Message</DialogTitle>
              <DialogDescription>
                Preview and copy the formatted order message.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                readOnly
                value={generateOrderText()}
                className="min-h-[200px] text-xs font-mono bg-muted"
                data-testid="textarea-order-message"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleCopy} data-testid="button-copy-message">
                <Copy className="w-4 h-4 mr-2" /> Copy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={orderMessageDialogOpen} onOpenChange={setOrderMessageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order Message</DialogTitle>
              <DialogDescription>
                Preview and copy the formatted order message.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                readOnly
                value={generatePendingOrderText(selectedOrderForMessage)}
                className="min-h-[200px] text-xs font-mono bg-muted"
                data-testid="textarea-pending-order-message"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleCopyPendingOrder} data-testid="button-copy-pending-message">
                <Copy className="w-4 h-4 mr-2" /> Copy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Orders with Manager</DialogTitle>
              <DialogDescription>
                Select a store to generate a shareable link for the manager
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="store-select">Select Store</Label>
                <Select
                  value={selectedStoreForShare}
                  onValueChange={(value) => setSelectedStoreForShare(value as StoreTag)}
                >
                  <SelectTrigger id="store-select" data-testid="select-store-share">
                    <SelectValue placeholder="Choose a store..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STORE_TAGS.map((store) => (
                      <SelectItem key={store} value={store}>
                        {store.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The manager will only see processing and completed orders for this store
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShareDialogOpen(false)} data-testid="button-cancel-share">
                Cancel
              </Button>
              <Button onClick={handleShareWithManager} data-testid="button-generate-link">
                <Share2 className="w-4 h-4 mr-2" />
                Generate Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AddItemModal
          open={addItemModalOpen}
          onOpenChange={setAddItemModalOpen}
          supplier={
            pendingOrdersFiltered.find(o => o.id === selectedOrderForAddItem)?.supplier ||
            processingOrders.find(o => o.id === selectedOrderForAddItem)?.supplier ||
            ''
          }
          items={items}
          onAddItem={(item) => {
            const order = [...pendingOrdersFiltered, ...processingOrders].find(o => o.id === selectedOrderForAddItem);
            if (order) {
              const updatedItems = [...order.items, { item, quantity: 1, isNewItem: false }];
              updatePendingOrder(selectedOrderForAddItem, { items: updatedItems });
              toast.success('Item added to order');
            }
            setAddItemModalOpen(false);
          }}
          onUpdateItemSupplier={(itemId, newSupplier) => {
            updateItem(itemId, { supplier: newSupplier });
          }}
          onCreateNewItem={(name) => {
            const order = [...pendingOrdersFiltered, ...processingOrders].find(o => o.id === selectedOrderForAddItem);
            const supplier = order?.supplier || '';
            addItem({
              name: name,
              category: 'New Item',
              supplier: supplier,
              tags: [],
            });
            toast.success('New item created');
          }}
        />
      </div>
    </div>
  );
}
