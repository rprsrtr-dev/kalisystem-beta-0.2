import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Clock,
  Package,
  CheckCheck,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  DollarSign,
  FileText,
  CreditCard,
  Camera,
  Upload,
} from 'lucide-react';
import { PendingOrderStatus, StoreTag, STORE_TAGS } from '@/types';
import { toast } from 'sonner';

export default function ManagerView() {
  const { pendingOrders, updatePendingOrder } = useApp();
  const [activeTab, setActiveTab] = useState<'processing' | 'completed'>('processing');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedStore, setSelectedStore] = useState<StoreTag | null>(null);

  // Show error message if no store selected
  useEffect(() => {
    if (!selectedStore) {
      toast.error('No store selected. Please use a valid manager link.');
    }
  }, [selectedStore]);
  
  // Invoice dialog state
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [invoiceTab, setInvoiceTab] = useState<'url' | 'upload' | 'camera'>('url');
  const [invoiceUrlInput, setInvoiceUrlInput] = useState('');
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const store = params.get('store');
    if (store && STORE_TAGS.includes(store as StoreTag)) {
      setSelectedStore(store as StoreTag);
    }
  }, []);

  const filteredProcessingOrders = useMemo(() => {
    if (!selectedStore) return [];
    return pendingOrders.filter(order => 
      order.status === 'processing' && order.storeTag === selectedStore
    );
  }, [pendingOrders, selectedStore]);

  const filteredCompletedOrders = useMemo(() => {
    if (!selectedStore) return [];
    return pendingOrders.filter(order => 
      order.status === 'completed' && 
      order.storeTag === selectedStore
    );
  }, [pendingOrders, selectedStore]);

  const toggleExpanded = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleReceivedToggle = (orderId: string, currentValue: boolean) => {
    updatePendingOrder(orderId, { isReceived: !currentValue });
    toast.success(!currentValue ? 'Marked as received' : 'Unmarked as received');
  };

  const handlePaidToggle = (orderId: string, currentValue: boolean) => {
    updatePendingOrder(orderId, { isPaid: !currentValue });
    toast.success(!currentValue ? 'Marked as paid' : 'Unmarked as paid');
  };

  const handleAmountChange = (orderId: string, value: string) => {
    const amount = parseFloat(value) || undefined;
    updatePendingOrder(orderId, { amount });
  };

  const openInvoiceDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setInvoiceDialogOpen(true);
    setInvoiceTab('url');
    setInvoiceUrlInput('');
    setInvoicePreview(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setInvoicePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error('Could not access camera');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const photoData = canvas.toDataURL('image/jpeg', 0.95);
    setInvoicePreview(photoData);
    stopCamera();
  };

  const attachInvoice = () => {
    if (!selectedOrderId) return;

    let invoiceUrl = '';
    if (invoiceTab === 'url') {
      invoiceUrl = invoiceUrlInput;
    } else if (invoicePreview) {
      invoiceUrl = invoicePreview;
    }

    if (!invoiceUrl) {
      toast.error('Please provide an invoice');
      return;
    }

    updatePendingOrder(selectedOrderId, { invoiceUrl });
    toast.success('Invoice attached');
    setInvoiceDialogOpen(false);
    setSelectedOrderId(null);
    setInvoiceUrlInput('');
    setInvoicePreview(null);
    stopCamera();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [cameraStream]);

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

  if (!selectedStore) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-12 bg-card border-border">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">Invalid or missing store parameter</p>
              <p className="text-sm mt-2">Please use a valid manager link</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Store Orders - {selectedStore.toUpperCase()}</h1>
          <p className="text-muted-foreground mt-2">Manager View</p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'processing' | 'completed')} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="processing" data-testid="tab-processing">
              Processing ({filteredProcessingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed ({filteredCompletedOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* Processing Orders Tab */}
          <TabsContent value="processing" className="space-y-6 mt-6">
            {filteredProcessingOrders.length === 0 ? (
              <Card className="p-12 bg-card border-border">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg">No processing orders</p>
                  <p className="text-sm mt-2">Processing orders will appear here</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredProcessingOrders.map((order) => (
                  <Card key={order.id} className="p-4 bg-card border-border" data-testid={`processing-order-${order.id}`}>
                    <div className="space-y-4">
                      {/* Order Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-lg">{order.supplier}</h3>
                          {order.paymentMethod && (
                            <span className="text-sm">
                              {order.paymentMethod === 'COD' ? '💰' : order.paymentMethod === 'Aba' ? '💳' : order.paymentMethod === 'TrueMoney' ? '🧧' : '💸'}
                            </span>
                          )}
                          {order.orderType && (
                            <span className="text-sm">
                              {order.orderType === 'Delivery' ? '🚚' : '📦'}
                            </span>
                          )}
                          {order.storeTag && (
                            <span className="text-sm">📌 {order.storeTag.toUpperCase()}</span>
                          )}
                          <Badge className={`gap-1 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpanded(order.id)}
                        >
                          {expandedOrders.has(order.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>

                      {/* Order Items */}
                      {expandedOrders.has(order.id) && (
                        <>
                          <div className="space-y-2">
                            {order.items.map((orderItem, idx) => (
                              <div key={idx} className="flex items-center gap-3 text-sm">
                                <div className="flex-1">
                                  <p className="font-medium">{orderItem.item.name}</p>
                                </div>
                                <span className="text-muted-foreground">x{orderItem.quantity}</span>
                              </div>
                            ))}
                          </div>

                          {/* Editable Controls */}
                          <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`received-${order.id}`}
                                  checked={order.isReceived || false}
                                  onCheckedChange={() => handleReceivedToggle(order.id, order.isReceived || false)}
                                />
                                <label htmlFor={`received-${order.id}`} className="text-sm cursor-pointer">
                                  Received
                                </label>
                              </div>

                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`paid-${order.id}`}
                                  checked={order.isPaid || false}
                                  onCheckedChange={() => handlePaidToggle(order.id, order.isPaid || false)}
                                />
                                <label htmlFor={`paid-${order.id}`} className="text-sm cursor-pointer">
                                  Paid
                                </label>
                              </div>

                              <div className="flex items-center gap-2">
                                <Label htmlFor={`amount-${order.id}`} className="text-sm">Amount:</Label>
                                <Input
                                  id={`amount-${order.id}`}
                                  type="number"
                                  placeholder="0.00"
                                  value={order.amount || ''}
                                  onChange={(e) => handleAmountChange(order.id, e.target.value)}
                                  className="w-24 h-8"
                                  step="0.01"
                                />
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openInvoiceDialog(order.id)}
                                className="gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                {order.invoiceUrl ? 'Update Invoice' : 'Attach Invoice'}
                              </Button>
                            </div>

                            {/* Status Indicators */}
                            {order.invoiceUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const invoiceUrl = order.invoiceUrl || '';
                                  if (invoiceUrl.startsWith('data:')) {
                                    const newWindow = window.open();
                                    if (newWindow) {
                                      newWindow.document.write(`<img src="${invoiceUrl}" style="max-width: 100%; height: auto;" />`);
                                      newWindow.document.close();
                                    }
                                  } else {
                                    window.open(invoiceUrl, '_blank');
                                  }
                                }}
                                className="gap-1 text-purple-600"
                              >
                                <FileText className="w-3 h-3" />
                                View Invoice
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Orders Tab */}
          <TabsContent value="completed" className="space-y-6 mt-6">
            {filteredCompletedOrders.length === 0 ? (
              <Card className="p-12 bg-card border-border">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg">No completed orders</p>
                  <p className="text-sm mt-2">Completed orders will appear here</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredCompletedOrders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  return (
                    <Card key={order.id} className="p-4 bg-card border-border" data-testid={`completed-order-${order.id}`}>
                      {/* Order Header */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{order.supplier}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpanded(order.id)}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="space-y-4">
                          {/* Order Items */}
                          <div className="space-y-2">
                            {order.items.map((orderItem, idx) => (
                              <div key={idx} className="flex items-center gap-3 text-sm">
                                <div className="flex-1">
                                  <p className="font-medium">{orderItem.item.name}</p>
                                </div>
                                <span className="text-muted-foreground">x{orderItem.quantity}</span>
                              </div>
                            ))}
                          </div>

                          {/* Editable Controls */}
                          <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`amount-${order.id}`} className="text-sm">Amount:</Label>
                                <Input
                                  id={`amount-${order.id}`}
                                  type="number"
                                  placeholder="0.00"
                                  value={order.amount || ''}
                                  onChange={(e) => handleAmountChange(order.id, e.target.value)}
                                  className="w-24 h-8"
                                  step="0.01"
                                />
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openInvoiceDialog(order.id)}
                                className="gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                {order.invoiceUrl ? 'Update Invoice' : 'Attach Invoice'}
                              </Button>
                            </div>
                          </div>

                          {/* Order Status Indicators */}
                          <div className="flex flex-wrap gap-2">
                            {order.amount && (
                              <Badge variant="outline" className="gap-1 text-blue-600">
                                <DollarSign className="w-3 h-3" />
                                {order.amount}
                              </Badge>
                            )}
                            {order.paymentMethod && (
                              <Badge variant="outline" className="gap-1 text-indigo-600">
                                <CreditCard className="w-3 h-3" />
                                By {order.paymentMethod}
                              </Badge>
                            )}
                            {order.isPaid && (
                              <Badge variant="outline" className="gap-1 text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                Paid
                              </Badge>
                            )}
                            {order.invoiceUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const invoiceUrl = order.invoiceUrl || '';
                                  if (invoiceUrl.startsWith('data:')) {
                                    const newWindow = window.open();
                                    if (newWindow) {
                                      newWindow.document.write(`<img src="${invoiceUrl}" style="max-width: 100%; height: auto;" />`);
                                      newWindow.document.close();
                                    }
                                  } else {
                                    window.open(invoiceUrl, '_blank');
                                  }
                                }}
                                className="gap-1 text-purple-600"
                              >
                                <FileText className="w-3 h-3" />
                                View Invoice
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Invoice Dialog */}
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
                    />
                    <p className="text-sm text-muted-foreground">
                      Accepts images and PDF files
                    </p>
                  </div>
                  {invoicePreview && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <p className="text-sm font-medium mb-2">Preview:</p>
                      {invoicePreview.startsWith('data:image') ? (
                        <img src={invoicePreview} alt="Invoice preview" className="max-w-full h-auto rounded" />
                      ) : (
                        <p className="text-sm text-muted-foreground">File uploaded successfully</p>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="camera" className="space-y-4 py-4">
                <div className="space-y-4">
                  {!cameraStream && !invoicePreview && (
                    <Button onClick={startCamera} className="w-full">
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  )}
                  {cameraStream && (
                    <div className="space-y-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg border"
                      />
                      <div className="flex gap-2">
                        <Button onClick={capturePhoto} className="flex-1">
                          Capture Photo
                        </Button>
                        <Button onClick={stopCamera} variant="outline">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  {invoicePreview && !cameraStream && (
                    <div className="space-y-4">
                      <img src={invoicePreview} alt="Captured invoice" className="w-full rounded-lg border" />
                      <Button onClick={() => { setInvoicePreview(null); startCamera(); }} variant="outline" className="w-full">
                        Retake Photo
                      </Button>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button onClick={() => setInvoiceDialogOpen(false)} variant="outline">Cancel</Button>
              <Button onClick={attachInvoice}>Attach Invoice</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
