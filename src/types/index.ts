export type Store = 'CV2' | 'STOCK02' | 'WB' | 'SHANTI';

export type Supplier =
  | 'KALI'
  | 'PISEY'
  | 'MARKET'
  | 'LEES'
  | 'ANGKOR-COMPANY'
  | 'COCA-COMPANY'
  | 'CHARONAI'
  | 'KOFI'
  | 'TAKEAWAY-SHOP'
  | 'STOCK'
  | 'PZZA+';

export type OrderStatus = 'dispatching' | 'on_the_way' | 'received' | 'completed';

export type Unit =
  | 'kg'
  | 'pc'
  | 'L'
  | 'roll'
  | 'block'
  | '5L'
  | 'case'
  | 'box'
  | 'pk'
  | 'ctn'
  | 'bt'
  | '1Lbt'
  | 'jar'
  | 'glass'
  | 'small'
  | 'big'
  | 'pc_cut';

export interface Item {
  id: string;
  name: string;
  variant?: string | null;
  unit?: Unit | null;
  supplier: Supplier;
  created_at: string;
  modified_at: string;
}

export interface OrderItem {
  item_id: string;
  name: string;
  variant?: string | null;
  quantity: number;
  unit?: Unit | null;
  is_missing?: boolean;
}

export interface Order {
  id: string;
  order_id: string;
  store: Store;
  supplier: Supplier;
  items: OrderItem[];
  status: OrderStatus;
  order_message?: string | null;
  is_sent: boolean;
  is_paid: boolean;
  is_on_the_way: boolean;
  is_received: boolean;
  completed_at?: string | null;
  modified_at: string;
  created_at: string;
}

export const STORES: Store[] = ['CV2', 'STOCK02', 'WB', 'SHANTI'];

export const SUPPLIERS: Supplier[] = [
  'KALI',
  'PISEY',
  'MARKET',
  'LEES',
  'ANGKOR-COMPANY',
  'COCA-COMPANY',
  'CHARONAI',
  'KOFI',
  'TAKEAWAY-SHOP',
  'STOCK',
  'PZZA+',
];

export const UNITS: Unit[] = [
  'kg',
  'pc',
  'L',
  'roll',
  'block',
  '5L',
  'case',
  'box',
  'pk',
  'ctn',
  'bt',
  '1Lbt',
  'jar',
  'glass',
  'small',
  'big',
  'pc_cut',
];

export const ORDER_STATUSES: OrderStatus[] = [
  'dispatching',
  'on_the_way',
  'received',
  'completed',
];
