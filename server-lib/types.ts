export type OrderMethod = 'stripe' | 'manual' | 'fpx';

export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'under_review'
  | 'paid'
  | 'failed'
  | 'rejected';

export interface Order {
  orderId: string;
  pack: '100' | '200';
  amount: number; // in cents
  name: string;
  email: string;
  phone: string;
  method?: OrderMethod;
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
  emailSentAt?: string;
  pendingEmailSentAt?: string;
  rejectionEmailSentAt?: string;
  hideFromSocialProof?: boolean;

  // Meta Pixel & Conversions API fields
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
  capiSentAt?: string;

  // Stripe fields
  stripeSessionId?: string;
  stripePaymentIntentId?: string;

  // Legacy toyyibPay fields
  billCode?: string;
  refno?: string;

  // Manual payment fields
  accessToken?: string;
  expiresAt?: string;
  receiptKey?: string;
  receiptContentType?: string;
  receiptSha256?: string;
  duplicateReceipt?: boolean;
  duplicateOrderId?: string;
  customerReference?: string;
  receiptUploadedAt?: string;
  approvedAt?: string;
  rejectReason?: string;

  // Owner payment reference fields (from DuitNow/TnG)
  paymentRefNo?: string;
  paymentRefRecordedAt?: string;
  paymentRefNormalized?: string;
  paymentRefEditedAt?: string;
}

export interface OrderStore {
  get(orderId: string): Promise<Order | null>;
  create(order: Order): Promise<void>;
  update(orderId: string, fields: Partial<Omit<Order, 'orderId'>>): Promise<void>;
  list(options?: { status?: OrderStatus; method?: OrderMethod; search?: string }): Promise<Order[]>;
  findByReceiptHash(hash: string, excludeOrderId?: string): Promise<Order | null>;
}

export interface ReceiptStore {
  save(key: string, data: Uint8Array | Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ data: Buffer; contentType: string } | null>;
}
