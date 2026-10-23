import type { OrderStore } from './types.ts';
import { config } from '../src/config.ts';

export interface RecentSaleItem {
  displayName: string;
  pack: '100' | '200';
  paidAt: string;
}

export interface RecentSalesResponse {
  sales: RecentSaleItem[];
  last24hCount: number;
}

export function formatSocialProofDisplayName(rawName: string | undefined | null): string {
  if (!rawName) return 'A parent';
  // Remove anything that isn't a letter, space or hyphen
  const cleaned = rawName.replace(/[^a-zA-Z\s-]/g, ' ').trim();
  if (!cleaned) return 'A parent';

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'A parent';

  // Capitalize properly (handles hyphens like "Nur-Aisyah")
  const capitalizeWord = (w: string): string => {
    return w
      .split('-')
      .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ''))
      .join('-');
  };

  const first = capitalizeWord(words[0]);
  if (!first) return 'A parent';

  if (words.length > 1) {
    const secondInitial = words[1].charAt(0).toUpperCase();
    if (secondInitial) {
      return `${first} ${secondInitial}.`;
    }
  }

  return first;
}

export async function getRecentSales(store: OrderStore): Promise<RecentSalesResponse> {
  const { socialProof } = config;
  if (!socialProof || !socialProof.enabled) {
    return { sales: [], last24hCount: 0 };
  }

  const startDate = new Date(socialProof.startFrom).getTime();
  const maxAgeMs = (socialProof.maxAgeDays || 14) * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  // Retrieve paid orders from store
  const allPaid = await store.list({ status: 'paid' });

  // Filter qualifying sales
  const qualifying = allPaid.filter((order) => {
    if (order.status !== 'paid') return false;
    if (order.hideFromSocialProof === true) return false;
    if (!order.paidAt) return false;

    const paidTime = new Date(order.paidAt).getTime();
    if (isNaN(paidTime)) return false;

    // Must be on or after socialProof.startFrom
    if (paidTime < startDate) return false;

    // Must be within maxAgeDays
    if (now - paidTime > maxAgeMs) return false;

    return true;
  });

  // Calculate 24h count
  const last24hCount = qualifying.filter((order) => {
    const paidTime = new Date(order.paidAt!).getTime();
    return paidTime >= twentyFourHoursAgo && paidTime <= now;
  }).length;

  // Sort newest first
  qualifying.sort((a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime());

  // Take latest 10
  const latestTen = qualifying.slice(0, 10);

  // Return strictly sanitized fields: displayName, pack, paidAt
  const sales: RecentSaleItem[] = latestTen.map((order) => ({
    displayName: formatSocialProofDisplayName(order.name),
    pack: order.pack,
    paidAt: order.paidAt!,
  }));

  return { sales, last24hCount };
}
