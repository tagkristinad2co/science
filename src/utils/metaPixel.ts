import { config } from '../config';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

let lastTrackedUrl = '';

/**
 * Get cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}

/**
 * Capture _fbp and _fbc cookies to send with checkout requests for Conversions API matching
 */
export function getMetaCookies(): { fbp?: string; fbc?: string } {
  const fbp = getCookie('_fbp') || undefined;
  const fbc = getCookie('_fbc') || undefined;
  return { fbp, fbc };
}

/**
 * Safe wrapper around window.fbq so ad blockers or missing scripts never throw errors
 */
export function safeFbq(...args: any[]): void {
  if (typeof window === 'undefined') return;
  const pixelId = config.meta?.pixelId?.trim();
  if (!pixelId) return;

  try {
    if (typeof window.fbq === 'function') {
      window.fbq(...args);
    }
  } catch (err) {
    // Ad blockers or privacy extensions might intercept or block fbq
    console.debug('[MetaPixel] Call ignored:', err);
  }
}

/**
 * Initialize Meta Pixel base code on app start (only once, never on /admin, only if pixelId is set)
 */
export function initMetaPixel(): void {
  if (typeof window === 'undefined') return;

  // Never load on /admin
  if (window.location.pathname.startsWith('/admin')) {
    return;
  }

  // Handle ?fbclid= in URL and persist _fbc for 90 days if not already set
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    if (fbclid) {
      const existingFbc = getCookie('_fbc');
      if (!existingFbc) {
        const timestamp = Date.now();
        const fbcVal = `fb.1.${timestamp}.${fbclid}`;
        const maxAge = 90 * 24 * 60 * 60; // 90 days in seconds
        document.cookie = `_fbc=${encodeURIComponent(fbcVal)}; max-age=${maxAge}; path=/; SameSite=Lax`;
      }
    }
  } catch (e) {
    console.warn('[MetaPixel] Error processing fbclid:', e);
  }

  const pixelId = config.meta?.pixelId?.trim();
  if (!pixelId) {
    return;
  }

  // Inject Meta base code once
  if (!window.fbq) {
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode?.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    safeFbq('init', pixelId);
    safeFbq('track', 'PageView');
    lastTrackedUrl = window.location.href;
  }
}

/**
 * Track SPA route changes: fire PageView on page changes, never twice for the same URL, never on /admin
 */
export function trackPageView(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;

  const pixelId = config.meta?.pixelId?.trim();
  if (!pixelId) return;

  const currentUrl = window.location.href;
  if (currentUrl === lastTrackedUrl) return;
  lastTrackedUrl = currentUrl;

  safeFbq('track', 'PageView');
}

/**
 * ViewContent: once per visit when the sales page loads
 */
export function trackViewContent(price100: number): void {
  if (typeof window === 'undefined') return;
  const pixelId = config.meta?.pixelId?.trim();
  if (!pixelId) return;

  try {
    const alreadyFired = sessionStorage.getItem('smv_pixel_view_content');
    if (alreadyFired) return;
    sessionStorage.setItem('smv_pixel_view_content', '1');
  } catch {}

  safeFbq('track', 'ViewContent', {
    content_name: 'Science Made Visual 100 Sheets',
    content_ids: ['smv-100'],
    content_type: 'product',
    value: price100,
    currency: 'MYR',
  });
}

/**
 * AddToCart: when the visitor ticks the +100 sheets upgrade (once per visit)
 */
export function trackAddToCart(price200: number): void {
  if (typeof window === 'undefined') return;
  const pixelId = config.meta?.pixelId?.trim();
  if (!pixelId) return;

  try {
    const alreadyFired = sessionStorage.getItem('smv_pixel_add_to_cart');
    if (alreadyFired) return;
    sessionStorage.setItem('smv_pixel_add_to_cart', '1');
  } catch {}

  safeFbq('track', 'AddToCart', {
    content_ids: ['smv-200'],
    value: price200,
    currency: 'MYR',
  });
}

/**
 * InitiateCheckout: when the checkout modal opens
 */
export function trackInitiateCheckout(pack: '100' | '200', value: number): void {
  if (typeof window === 'undefined') return;
  const pixelId = config.meta?.pixelId?.trim();
  if (!pixelId) return;

  safeFbq('track', 'InitiateCheckout', {
    content_ids: [`smv-${pack}`],
    value,
    currency: 'MYR',
    num_items: 1,
  });
}

/**
 * AddPaymentInfo: when the customer clicks PAY NOW (Stripe) or CONTINUE TO QR PAYMENT (manual)
 */
export function trackAddPaymentInfo(
  pack: '100' | '200',
  value: number,
  paymentMethod: 'stripe' | 'manual_qr'
): void {
  if (typeof window === 'undefined') return;
  const pixelId = config.meta?.pixelId?.trim();
  if (!pixelId) return;

  safeFbq('track', 'AddPaymentInfo', {
    content_ids: [`smv-${pack}`],
    value,
    currency: 'MYR',
    num_items: 1,
    payment_method: paymentMethod,
  });
}

/**
 * Purchase: on the thank-you page or manual order page, ONLY when the server says the order is paid.
 * De-duplicated with CAPI via { eventID: orderId } as 4th argument.
 * Fire only once per order via localStorage.
 */
export function trackPurchase(orderId: string, pack: '100' | '200', amountInRm: number): void {
  if (typeof window === 'undefined' || !orderId) return;
  const pixelId = config.meta?.pixelId?.trim();
  if (!pixelId) return;

  try {
    const raw = localStorage.getItem('smv_pixel_purchases') || '[]';
    const list: string[] = JSON.parse(raw);
    if (list.includes(orderId)) {
      return;
    }
    list.push(orderId);
    localStorage.setItem('smv_pixel_purchases', JSON.stringify(list));
  } catch {}

  safeFbq(
    'track',
    'Purchase',
    {
      value: amountInRm,
      currency: 'MYR',
      content_ids: [`smv-${pack}`],
      content_type: 'product',
      num_items: 1,
    },
    { eventID: orderId }
  );
}
