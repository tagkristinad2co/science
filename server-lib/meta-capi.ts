import crypto from 'crypto';
import type { Order, OrderStore } from './types.ts';
import { getEnv } from './env.ts';
import { config } from '../src/config.ts';

function sha256(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

/**
 * Format phone number as digits only with Malaysian country code (e.g. "60123456789")
 */
export function formatMetaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '6' + digits;
  }
  if (digits.startsWith('60')) {
    return digits;
  }
  return '60' + digits;
}

/**
 * Extract lowercase first name
 */
export function extractFirstName(fullName: string): string {
  const cleaned = fullName.trim().toLowerCase();
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words[0] || '';
}

/**
 * Send server-side Purchase event to Meta Conversions API (Graph API v21.0).
 * Never throws; logs errors and saves capiSentAt on the order so it is only sent once.
 */
export async function sendMetaCapiPurchase(
  store: OrderStore,
  order: Order,
  siteUrl: string
): Promise<void> {
  // Never send twice
  if (order.capiSentAt) {
    return;
  }

  const pixelId = getEnv('META_PIXEL_ID') || config.meta?.pixelId;
  const accessToken = getEnv('META_CAPI_ACCESS_TOKEN');

  // Skip if CAPI access token or pixel ID is not configured
  if (!pixelId || !accessToken) {
    console.log('[Meta CAPI] Purchase sent: failed');
    return;
  }

  const testEventCode = getEnv('META_TEST_EVENT_CODE');

  try {
    const paidDate = order.paidAt ? new Date(order.paidAt) : new Date();
    const eventTime = Math.floor(paidDate.getTime() / 1000);

    const userData: Record<string, any> = {
      country: [sha256('my')],
    };

    if (order.email) {
      userData.em = [sha256(order.email.trim().toLowerCase())];
    }

    if (order.phone) {
      userData.ph = [sha256(formatMetaPhone(order.phone))];
    }

    if (order.name) {
      const fn = extractFirstName(order.name);
      if (fn) {
        userData.fn = [sha256(fn)];
      }
    }

    // Raw, unhashed values for technical matching parameters
    if (order.clientIp) {
      userData.client_ip_address = order.clientIp;
    }
    if (order.userAgent) {
      userData.client_user_agent = order.userAgent;
    }
    if (order.fbp) {
      userData.fbp = order.fbp;
    }
    if (order.fbc) {
      userData.fbc = order.fbc;
    }

    const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
    const amountInRm = Number((order.amount / 100).toFixed(2));
    const paymentMethod = order.method === 'stripe' ? 'stripe' : 'manual_qr';

    const eventPayload: any = {
      event_name: 'Purchase',
      event_time: eventTime,
      event_id: order.orderId,
      action_source: 'website',
      event_source_url: `${cleanSiteUrl}/thank-you`,
      user_data: userData,
      custom_data: {
        currency: 'MYR',
        value: amountInRm,
        content_ids: [`smv-${order.pack}`],
        content_type: 'product',
        num_items: 1,
        payment_method: paymentMethod,
      },
    };

    const requestBody: any = {
      data: [eventPayload],
    };

    if (testEventCode) {
      requestBody.test_event_code = testEventCode;
    }

    const endpoint = `https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn(`[Meta CAPI Warning] Event for order ${order.orderId} returned status ${res.status}:`, data);
      console.log('[Meta CAPI] Purchase sent: failed');
    } else {
      console.log(`[Meta CAPI Success] Purchase event logged for order ${order.orderId}:`, data);
      console.log('[Meta CAPI] Purchase sent: ok');
      // Mark as sent so we never send twice
      const now = new Date().toISOString();
      await store.update(order.orderId, { capiSentAt: now });
    }
  } catch (err) {
    console.warn(`[Meta CAPI Error] Failed to send Purchase event for order ${order.orderId}:`, err);
    console.log('[Meta CAPI] Purchase sent: failed');
  }
}
