import { getStore } from '@netlify/blobs';
import type { Order, OrderStore, ReceiptStore, OrderStatus, OrderMethod } from './types.ts';

export class NetlifyBlobsOrderStore implements OrderStore {
  private getStoreInstance() {
    return getStore({ name: 'orders', consistency: 'strong' });
  }

  async get(orderId: string): Promise<Order | null> {
    try {
      const store = this.getStoreInstance();
      const data = await store.get(orderId, { type: 'json' });
      return (data as Order) || null;
    } catch (err) {
      console.error(`[Netlify Blobs] Error reading order ${orderId}:`, err);
      return null;
    }
  }

  async create(order: Order): Promise<void> {
    const store = this.getStoreInstance();
    await store.setJSON(order.orderId, order);
    console.log(`[Netlify Blobs] Order ${order.orderId} created successfully.`);
  }

  async update(orderId: string, fields: Partial<Omit<Order, 'orderId'>>): Promise<void> {
    const store = this.getStoreInstance();
    const existing = await this.get(orderId);
    if (!existing) {
      throw new Error(`Order ${orderId} not found in Netlify Blobs`);
    }
    const updated: Order = { ...existing, ...fields };
    await store.setJSON(orderId, updated);
    console.log(`[Netlify Blobs] Order ${orderId} updated:`, Object.keys(fields));
  }

  async list(options?: { status?: OrderStatus; method?: OrderMethod; search?: string }): Promise<Order[]> {
    try {
      const store = this.getStoreInstance();
      const { blobs } = await store.list();
      const orders: Order[] = [];

      for (const b of blobs) {
        try {
          const item = await store.get(b.key, { type: 'json' });
          if (item && typeof item === 'object') {
            orders.push(item as Order);
          }
        } catch {
          // ignore invalid entry
        }
      }

      let filtered = orders;
      if (options?.status) {
        filtered = filtered.filter((o) => o.status === options.status);
      }
      if (options?.method) {
        filtered = filtered.filter((o) => (o.method || 'fpx') === options.method);
      }
      if (options?.search) {
        const q = options.search.trim().toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.orderId.toLowerCase().includes(q) ||
            o.name.toLowerCase().includes(q) ||
            o.email.toLowerCase().includes(q) ||
            o.phone.toLowerCase().includes(q)
        );
      }

      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.error('[Netlify Blobs] Error listing orders:', err);
      return [];
    }
  }

  async findByReceiptHash(hash: string, excludeOrderId?: string): Promise<Order | null> {
    const orders = await this.list();
    for (const o of orders) {
      if (o.receiptSha256 === hash && o.orderId !== excludeOrderId) {
        return o;
      }
    }
    return null;
  }
}

export class NetlifyBlobsReceiptStore implements ReceiptStore {
  private getStoreInstance() {
    return getStore({ name: 'receipts', consistency: 'strong' });
  }

  async save(key: string, data: Uint8Array | Buffer, contentType: string): Promise<void> {
    const store = this.getStoreInstance();
    const blob = new Blob([data as any], { type: contentType });
    await store.set(key, blob, { metadata: { contentType } });
    console.log(`[Netlify Blobs] Receipt ${key} saved.`);
  }

  async get(key: string): Promise<{ data: Buffer; contentType: string } | null> {
    try {
      const store = this.getStoreInstance();
      const res = await store.getWithMetadata(key, { type: 'arrayBuffer' });
      if (!res || !res.data) return null;
      const buf = Buffer.from(res.data);
      const contentType = (res.metadata?.contentType as string) || 'application/octet-stream';
      return { data: buf, contentType };
    } catch (err) {
      console.error(`[Netlify Blobs] Error reading receipt ${key}:`, err);
      return null;
    }
  }
}
