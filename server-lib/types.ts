export interface Order {
  orderId: string;
  pack: '100' | '200';
  amount: number; // in cents
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'paid' | 'failed';
  billCode?: string;
  refno?: string;
  createdAt: string;
  paidAt?: string;
}

export interface OrderStore {
  get(orderId: string): Promise<Order | null>;
  create(order: Order): Promise<void>;
  update(orderId: string, fields: Partial<Omit<Order, 'orderId'>>): Promise<void>;
}
