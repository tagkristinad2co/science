import type { Order, OrderStore } from './types.ts';

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
}
