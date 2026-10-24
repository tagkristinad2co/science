import type { Order, OrderStore, ReceiptStore, OrderStatus, OrderMethod } from './types.ts';

export class InMemoryOrderStore implements OrderStore {
  private orders = new Map<string, Order>();

  async get(orderId: string): Promise<Order | null> {
    return this.orders.get(orderId) || null;
  }

  async create(order: Order): Promise<void> {
    this.orders.set(order.orderId, { ...order });
  }

  async update(orderId: string, fields: Partial<Omit<Order, 'orderId'>>): Promise<void> {
    const existing = this.orders.get(orderId);
    if (!existing) {
      throw new Error(`Order ${orderId} not found`);
    }
    this.orders.set(orderId, { ...existing, ...fields });
  }

  async list(options?: { status?: OrderStatus; method?: OrderMethod; search?: string }): Promise<Order[]> {
    let all = Array.from(this.orders.values());

    if (options?.status) {
      all = all.filter((o) => o.status === options.status);
    }

    if (options?.method) {
      all = all.filter((o) => (o.method || 'fpx') === options.method);
    }

    if (options?.search) {
      const q = options.search.trim().toLowerCase();
      const qNorm = q.toUpperCase().replace(/[\s-]/g, '');
      all = all.filter(
        (o) =>
          o.orderId.toLowerCase().includes(q) ||
          o.name.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.phone.toLowerCase().includes(q) ||
          (o.paymentRefNo && o.paymentRefNo.toLowerCase().includes(q)) ||
          (o.paymentRefNormalized && qNorm && o.paymentRefNormalized.includes(qNorm)) ||
          (o.stripePaymentIntentId && o.stripePaymentIntentId.toLowerCase().includes(q)) ||
          (o.customerReference && o.customerReference.toLowerCase().includes(q))
      );
    }

    // Sort by createdAt desc
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findByReceiptHash(hash: string, excludeOrderId?: string): Promise<Order | null> {
    for (const order of this.orders.values()) {
      if (order.receiptSha256 === hash && order.orderId !== excludeOrderId) {
        return order;
      }
    }
    return null;
  }
}

export class InMemoryReceiptStore implements ReceiptStore {
  private receipts = new Map<string, { data: Buffer; contentType: string }>();

  async save(key: string, data: Uint8Array | Buffer, contentType: string): Promise<void> {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    this.receipts.set(key, { data: buf, contentType });
  }

  async get(key: string): Promise<{ data: Buffer; contentType: string } | null> {
    return this.receipts.get(key) || null;
  }
}
