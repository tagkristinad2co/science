import { getStore } from '@netlify/blobs';
import type { Order, OrderStore } from './types.ts';

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
}
