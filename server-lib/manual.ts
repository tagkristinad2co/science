import crypto from 'crypto';
import type { Order, OrderStore, ReceiptStore, OrderStatus, OrderMethod } from './types.ts';
import { calculatePrice } from '../shared/pricing.ts';
import { validateCheckoutInput, generateOrderId, maskEmail } from './validation.ts';
import { getDownloadLink } from './downloads.ts';
import { detectFileType } from './magic-bytes.ts';
import { constantTimeTokenCompare } from './admin-auth.ts';
import {
  sendTelegramAlert,
  escapeTelegramHtml,
  sendOrderApprovedEmail,
  sendOrderApprovedEmailDetailed,
  sendReceiptReceivedEmail,
  sendOrderRejectedEmail,
} from './notifications.ts';
import { sendMetaCapiPurchase } from './meta-capi.ts';
import { config } from '../src/config.ts';

export async function processManualCreate(
  store: OrderStore,
  body: any,
  metaInfo?: { clientIp?: string; userAgent?: string; fbp?: string; fbc?: string }
): Promise<{ status: number; body: any }> {
  const validation = validateCheckoutInput(body);
  if (!validation.ok) {
    return { status: 400, body: { error: validation.error } };
  }

  const { pack, name, email, phone } = validation.value;

  const downloadLink = getDownloadLink(pack);
  if (!downloadLink) {
    console.error(`[Manual Checkout Blocked] Download link not set for pack ${pack}.`);
    return {
      status: 500,
      body: { error: 'Download link is not configured for this pack. Please contact support.' },
    };
  }

  const pricing = calculatePrice(pack);
  const orderId = generateOrderId();
  const accessToken = crypto.randomBytes(32).toString('hex');
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const fbp = metaInfo?.fbp || (typeof body?.fbp === 'string' ? body.fbp : undefined);
  const fbc = metaInfo?.fbc || (typeof body?.fbc === 'string' ? body.fbc : undefined);
  const clientIp = metaInfo?.clientIp || (typeof body?.clientIp === 'string' ? body.clientIp : undefined);
  const userAgent = metaInfo?.userAgent || (typeof body?.userAgent === 'string' ? body.userAgent : undefined);

  const newOrder: Order = {
    orderId,
    pack,
    amount: pricing.amountCents,
    name,
    email,
    phone,
    method: 'manual',
    status: 'awaiting_payment',
    createdAt,
    expiresAt,
    accessToken,
    fbp,
    fbc,
    clientIp,
    userAgent,
  };

  try {
    await store.create(newOrder);
    console.log(`[Manual Order Created] ${orderId} (pack ${pack})`);
    return {
      status: 200,
      body: { orderId, accessToken },
    };
  } catch (err) {
    console.error('[Manual Order Store Error]', err);
    return { status: 500, body: { error: "We couldn't save your order. Please try again." } };
  }
}

export async function processManualGetOrder(
  store: OrderStore,
  orderId: string,
  token?: string
): Promise<{ status: number; body: any }> {
  if (!orderId || !token) {
    return { status: 404, body: { error: 'Order not found' } };
  }

  const order = await store.get(orderId);
  if (!order || !order.accessToken) {
    return { status: 404, body: { error: 'Order not found' } };
  }

  if (!constantTimeTokenCompare(token, order.accessToken)) {
    return { status: 404, body: { error: 'Order not found' } };
  }

  const isExpired =
    order.status === 'awaiting_payment' &&
    order.expiresAt &&
    Date.now() > new Date(order.expiresAt).getTime();

  if (order.status === 'paid') {
    const downloadUrl = getDownloadLink(order.pack);
    return {
      status: 200,
      body: {
        status: 'paid',
        orderId: order.orderId,
        pack: order.pack,
        amount: order.amount,
        name: order.name,
        email: maskEmail(order.email),
        phone: order.phone,
        downloadUrl,
        downloadLink: downloadUrl,
        paidAt: order.paidAt,
      },
    };
  }

  return {
    status: 200,
    body: {
      status: isExpired ? 'expired' : order.status,
      orderId: order.orderId,
      pack: order.pack,
      amount: order.amount,
      name: order.name,
      email: maskEmail(order.email),
      phone: order.phone,
      createdAt: order.createdAt,
      expiresAt: order.expiresAt,
      customerReference: order.customerReference,
      receiptUploadedAt: order.receiptUploadedAt,
      rejectReason: order.rejectReason,
    },
  };
}

export async function processManualReceiptUpload(
  store: OrderStore,
  receiptStore: ReceiptStore,
  siteUrl: string,
  params: {
    orderId: string;
    token: string;
    fileBuffer: Buffer;
    fileName?: string;
    customerReference?: string;
  }
): Promise<{ status: number; body: any }> {
  const { orderId, token, fileBuffer, customerReference } = params;

  if (!orderId || !token) {
    return { status: 404, body: { error: 'Order not found' } };
  }

  const order = await store.get(orderId);
  if (!order || !order.accessToken) {
    return { status: 404, body: { error: 'Order not found' } };
  }

  if (!constantTimeTokenCompare(token, order.accessToken)) {
    return { status: 404, body: { error: 'Order not found' } };
  }

  // Allowed only when status is "awaiting_payment" or "rejected"
  if (order.status !== 'awaiting_payment' && order.status !== 'rejected') {
    return {
      status: 400,
      body: { error: `Receipt upload not allowed when order is ${order.status}` },
    };
  }

  // Max 4 MB
  const MAX_SIZE = 4 * 1024 * 1024;
  if (!fileBuffer || fileBuffer.length === 0) {
    return { status: 400, body: { error: 'No file uploaded.' } };
  }
  if (fileBuffer.length > MAX_SIZE) {
    return { status: 400, body: { error: 'File size must be 4 MB or less.' } };
  }

  // Check magic bytes
  const detected = detectFileType(fileBuffer);
  if (!detected) {
    return {
      status: 400,
      body: { error: 'Invalid file format. Please upload a JPG, PNG, WEBP, or PDF file.' },
    };
  }

  // Calculate SHA-256 hash
  const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Check duplicate hash
  const duplicate = await store.findByReceiptHash(sha256, order.orderId);
  const duplicateReceipt = Boolean(duplicate);
  const duplicateOrderId = duplicate?.orderId;

  const key = `${order.orderId}_${Date.now()}.${detected.extension}`;
  await receiptStore.save(key, fileBuffer, detected.mime);

  const uploadTime = new Date().toISOString();
  await store.update(order.orderId, {
    status: 'under_review',
    receiptKey: key,
    receiptContentType: detected.mime,
    receiptSha256: sha256,
    duplicateReceipt,
    duplicateOrderId,
    customerReference: customerReference?.trim() || '',
    receiptUploadedAt: uploadTime,
  });

  console.log(`[Receipt Uploaded] Order ${order.orderId} moved to under_review. Duplicate: ${duplicateReceipt}`);

  const orderPageUrl = `${siteUrl}/order/${order.orderId}?t=${order.accessToken}`;
  const amountStr = (order.amount / 100).toFixed(2);

  // Send "receipt received" email (never blocks upload)
  try {
    const sent = await sendReceiptReceivedEmail({
      customerEmail: order.email,
      customerName: order.name,
      orderId: order.orderId,
      pack: order.pack,
      amount: amountStr,
      orderPageUrl,
      reviewTime: config.manualPayment?.reviewTime,
      replyTo: config.business?.email,
    });
    if (sent) {
      await store.update(order.orderId, { pendingEmailSentAt: new Date().toISOString() });
    }
  } catch (err) {
    console.warn('[Receipt Received Email Error]', err);
  }

  // Send Telegram alert if configured (never blocks upload)
  try {
    const safeName = escapeTelegramHtml(order.name);
    const safeRef = order.customerReference ? ` · Ref: ${escapeTelegramHtml(order.customerReference)}` : '';
    const telegramMessage = `🧾 <b>New receipt:</b> ${escapeTelegramHtml(order.orderId)} · ${escapeTelegramHtml(order.pack)} sheets · RM${amountStr} · ${safeName}${safeRef}\nCheck your TnG/bank app, then approve at ${siteUrl}/admin`;
    await sendTelegramAlert(telegramMessage);
  } catch (err) {
    console.warn('[Telegram Alert Error]', err);
  }

  return {
    status: 200,
    body: { ok: true, status: 'under_review' },
  };
}

export async function processManualStatus(
  store: OrderStore,
  orderId: string,
  token?: string
): Promise<{ status: number; body: any }> {
  if (!orderId || !token) {
    return { status: 404, body: { error: 'Order not found' } };
  }

  const order = await store.get(orderId);
  if (!order || !order.accessToken) {
    return { status: 404, body: { error: 'Order not found' } };
  }

  if (!constantTimeTokenCompare(token, order.accessToken)) {
    return { status: 404, body: { error: 'Order not found' } };
  }

  if (order.status === 'paid') {
    const downloadUrl = getDownloadLink(order.pack);
    return {
      status: 200,
      body: {
        status: 'paid',
        orderId: order.orderId,
        pack: order.pack,
        downloadUrl,
      },
    };
  }

  return {
    status: 200,
    body: {
      status: order.status,
      orderId: order.orderId,
      rejectReason: order.rejectReason,
    },
  };
}

export async function processAdminListOrders(
  store: OrderStore,
  options?: { status?: OrderStatus; method?: OrderMethod; search?: string }
): Promise<{ status: number; body: any }> {
  const orders = await store.list(options);

  // If status === 'under_review', sort oldest first
  if (options?.status === 'under_review') {
    orders.sort(
      (a, b) =>
        new Date(a.receiptUploadedAt || a.createdAt).getTime() -
        new Date(b.receiptUploadedAt || b.createdAt).getTime()
    );
  }

  return {
    status: 200,
    body: { orders },
  };
}

export function normalizePaymentRef(ref: string): string {
  return ref.toUpperCase().replace(/[\s-]/g, '');
}

export function validatePaymentRef(ref: unknown): {
  valid: boolean;
  normalized: string;
  trimmed: string;
  error?: string;
} {
  if (typeof ref !== 'string') {
    return { valid: false, normalized: '', trimmed: '', error: 'Payment reference number is required.' };
  }
  const trimmed = ref.trim();
  const normalized = normalizePaymentRef(trimmed);
  // Letters and numbers only, 6 to 64 chars
  if (!/^[A-Z0-9]{6,64}$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      trimmed,
      error: 'Payment reference must be 6 to 64 letters and numbers.',
    };
  }
  return { valid: true, normalized, trimmed };
}

export async function processAdminAction(
  store: OrderStore,
  siteUrl: string,
  body: {
    orderId: string;
    action: 'approve' | 'reject' | 'toggle_social_proof' | 'resend_email' | 'update_payment_ref';
    reason?: string;
    adminUser?: string;
    hideFromSocialProof?: boolean;
    paymentRefNo?: string;
    forceDuplicate?: boolean;
  }
): Promise<{ status: number; body: any }> {
  const { orderId, action, reason, adminUser, hideFromSocialProof, paymentRefNo, forceDuplicate } = body;
  if (!orderId || !action) {
    return { status: 400, body: { error: 'Missing orderId or action' } };
  }

  const order = await store.get(orderId);
  if (!order) {
    return { status: 404, body: { error: 'Order not found' } };
  }

  if (action === 'toggle_social_proof') {
    const nextVal = typeof hideFromSocialProof === 'boolean'
      ? hideFromSocialProof
      : !order.hideFromSocialProof;
    await store.update(order.orderId, { hideFromSocialProof: nextVal });
    console.log(
      `[ADMIN AUDIT] Order ${order.orderId} hideFromSocialProof set to ${nextVal} by ${adminUser || 'admin'}`
    );
    return {
      status: 200,
      body: { ok: true, hideFromSocialProof: nextVal },
    };
  }

  if (action === 'resend_email') {
    if (order.status === 'paid') {
      const downloadUrl = getDownloadLink(order.pack) || '';
      const orderPageUrl = order.method === 'stripe'
        ? `${siteUrl}/thank-you?order_id=${order.orderId}&session_id=${order.stripeSessionId || ''}`
        : `${siteUrl}/order/${order.orderId}?t=${order.accessToken || ''}`;
      const sent = await sendOrderApprovedEmail({
        customerEmail: order.email,
        customerName: order.name,
        orderId: order.orderId,
        pack: order.pack,
        downloadUrl,
        orderPageUrl,
        replyTo: config.business?.email,
      });
      if (sent) {
        const now = new Date().toISOString();
        await store.update(order.orderId, { emailSentAt: now });
      }
      return { status: 200, body: { ok: true, message: 'Order approval email resent' } };
    }

    if (order.status === 'rejected') {
      const orderPageUrl = `${siteUrl}/order/${order.orderId}?t=${order.accessToken || ''}`;
      const sent = await sendOrderRejectedEmail({
        customerEmail: order.email,
        customerName: order.name,
        orderId: order.orderId,
        reason: order.rejectReason || 'Details do not match our payment records',
        orderPageUrl,
        replyTo: config.business?.email,
      });
      if (sent) {
        const now = new Date().toISOString();
        await store.update(order.orderId, { rejectionEmailSentAt: now });
      }
      return { status: 200, body: { ok: true, message: 'Payment rejection email resent' } };
    }

    if (order.status === 'under_review' || order.receiptKey) {
      const orderPageUrl = `${siteUrl}/order/${order.orderId}?t=${order.accessToken || ''}`;
      const amountStr = (order.amount / 100).toFixed(2);
      const sent = await sendReceiptReceivedEmail({
        customerEmail: order.email,
        customerName: order.name,
        orderId: order.orderId,
        pack: order.pack,
        amount: amountStr,
        orderPageUrl,
        reviewTime: config.manualPayment?.reviewTime,
        replyTo: config.business?.email,
      });
      if (sent) {
        const now = new Date().toISOString();
        await store.update(order.orderId, { pendingEmailSentAt: now });
      }
      return { status: 200, body: { ok: true, message: 'Receipt received confirmation email resent' } };
    }

    return { status: 400, body: { error: 'No email can be resent for this order in its current status' } };
  }

  if (action === 'update_payment_ref') {
    if (order.method !== 'manual') {
      return { status: 400, body: { error: 'Payment reference can only be recorded for manual orders.' } };
    }

    const validation = validatePaymentRef(paymentRefNo);
    if (!validation.valid) {
      return { status: 400, body: { error: validation.error || 'A valid payment reference number is required.' } };
    }

    const { normalized, trimmed } = validation;

    const allOrders = await store.list();
    const duplicate = allOrders.find(
      (o) => o.paymentRefNormalized === normalized && o.orderId !== order.orderId
    );

    if (duplicate && !forceDuplicate) {
      return {
        status: 409,
        body: {
          error: `This reference number was already used for order ${duplicate.orderId}. The same payment can't be used twice.`,
          duplicateOrderId: duplicate.orderId,
        },
      };
    }

    const now = new Date().toISOString();
    const oldRef = order.paymentRefNo || '(none)';

    await store.update(order.orderId, {
      paymentRefNo: trimmed,
      paymentRefNormalized: normalized,
      paymentRefEditedAt: now,
      ...(order.paymentRefRecordedAt ? {} : { paymentRefRecordedAt: now }),
    });

    console.log(
      `[ADMIN AUDIT] Order ${order.orderId} paymentRefNo updated from "${oldRef}" to "${trimmed}" (${normalized}) by ${adminUser || 'admin'} at ${now}${duplicate ? ` [FORCED DUPLICATE of order ${duplicate.orderId}]` : ''}`
    );

    return {
      status: 200,
      body: {
        ok: true,
        paymentRefNo: trimmed,
        paymentRefNormalized: normalized,
        paymentRefEditedAt: now,
      },
    };
  }

  // Prevent approving FPX/Stripe orders through manual review flow
  if (order.method !== 'manual') {
    return { status: 400, body: { error: 'Cannot approve non-manual order from manual review' } };
  }

  if (action === 'approve') {
    if (order.status === 'paid') {
      return { status: 200, body: { ok: true, status: 'paid', message: 'Already paid' } };
    }

    const validation = validatePaymentRef(paymentRefNo);
    if (!validation.valid) {
      return { status: 400, body: { error: validation.error || 'A valid payment reference number is required.' } };
    }

    const { normalized, trimmed } = validation;

    const allOrders = await store.list();
    const duplicate = allOrders.find(
      (o) => o.paymentRefNormalized === normalized && o.orderId !== order.orderId
    );

    if (duplicate && !forceDuplicate) {
      return {
        status: 409,
        body: {
          error: `This reference number was already used for order ${duplicate.orderId}. The same payment can't be used twice.`,
          duplicateOrderId: duplicate.orderId,
        },
      };
    }

    const now = new Date().toISOString();
    await store.update(order.orderId, {
      status: 'paid',
      paidAt: now,
      approvedAt: now,
      paymentRefNo: trimmed,
      paymentRefNormalized: normalized,
      paymentRefRecordedAt: now,
    });

    console.log(
      `[ADMIN AUDIT] Order ${order.orderId} APPROVED by ${adminUser || 'admin'} at ${now} with paymentRefNo: "${trimmed}" (${normalized})${duplicate ? ` [FORCED DUPLICATE of order ${duplicate.orderId}]` : ''}`
    );

    const downloadUrl = getDownloadLink(order.pack) || '';
    const orderPageUrl = `${siteUrl}/order/${order.orderId}?t=${order.accessToken}`;

    // Send customer email via Resend if autoSendEmailOnApprove is enabled
    if (config.admin?.autoSendEmailOnApprove) {
      try {
        const sent = await sendOrderApprovedEmail({
          customerEmail: order.email,
          customerName: order.name,
          orderId: order.orderId,
          pack: order.pack,
          downloadUrl,
          orderPageUrl,
          replyTo: config.business?.email,
        });
        if (sent) {
          const emailTime = new Date().toISOString();
          await store.update(order.orderId, {
            emailSentAt: emailTime,
            emailSentCount: 1,
            emailLastSentTo: order.email,
          });
        }
      } catch (err) {
        console.error('[Approve Email Error]', err);
      }
    }

    // Send server-side Meta Conversions API purchase event
    try {
      await sendMetaCapiPurchase(store, { ...order, status: 'paid', paidAt: now }, siteUrl);
    } catch (err) {
      console.warn('[Meta CAPI] Error in processAdminAction approve:', err);
    }

    return {
      status: 200,
      body: {
        ok: true,
        status: 'paid',
        orderPageUrl,
        downloadUrl,
      },
    };
  } else if (action === 'reject') {
    const cleanReason = (reason || '').trim();
    if (!cleanReason) {
      return { status: 400, body: { error: 'Please provide a reason for rejection.' } };
    }

    await store.update(order.orderId, {
      status: 'rejected',
      rejectReason: cleanReason,
    });

    console.log(
      `[ADMIN AUDIT] Order ${order.orderId} REJECTED by ${adminUser || 'admin'}: ${cleanReason}`
    );

    const orderPageUrl = `${siteUrl}/order/${order.orderId}?t=${order.accessToken}`;

    // Send rejection email to customer
    try {
      const sent = await sendOrderRejectedEmail({
        customerEmail: order.email,
        customerName: order.name,
        orderId: order.orderId,
        reason: cleanReason,
        orderPageUrl,
        replyTo: config.business?.email,
      });
      if (sent) {
        await store.update(order.orderId, { rejectionEmailSentAt: new Date().toISOString() });
      }
    } catch (err) {
      console.warn('[Rejection Email Error]', err);
    }

    return {
      status: 200,
      body: { ok: true, status: 'rejected' },
    };
  }

  return { status: 400, body: { error: 'Invalid action' } };
}

export async function processAdminGetReceipt(
  store: OrderStore,
  receiptStore: ReceiptStore,
  orderId: string
): Promise<{ status: number; data?: Buffer; contentType?: string; error?: string }> {
  if (!orderId) {
    return { status: 400, error: 'Missing orderId' };
  }

  const order = await store.get(orderId);
  if (!order || !order.receiptKey) {
    return { status: 404, error: 'Receipt not found' };
  }

  const receipt = await receiptStore.get(order.receiptKey);
  if (!receipt) {
    return { status: 404, error: 'Receipt file not found in storage' };
  }

  return {
    status: 200,
    data: receipt.data,
    contentType: receipt.contentType,
  };
}

export async function processAdminSendDownloadEmail(
  store: OrderStore,
  siteUrl: string,
  body: { orderId: string; email: string; adminUser?: string }
): Promise<{ status: number; body: any }> {
  const { orderId, email, adminUser } = body;
  if (!orderId) {
    return { status: 400, body: { error: 'Missing orderId' } };
  }

  const order = await store.get(orderId);
  if (!order) {
    return { status: 404, body: { error: 'Order not found' } };
  }

  // Only for orders with status "paid"
  if (order.status !== 'paid') {
    return { status: 400, body: { error: 'Order is not paid yet' } };
  }

  // Validate the email
  const targetEmail = (email || '').trim().toLowerCase();
  if (!targetEmail || !/^\S+@\S+\.\S+$/.test(targetEmail)) {
    return { status: 400, body: { error: 'Please enter a valid email address.' } };
  }

  // Rate limiting: at most 5 admin sends per order per hour
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const existingSends = (order.adminEmailSends || []).filter(
    (iso) => new Date(iso).getTime() > oneHourAgo
  );

  if (existingSends.length >= 5) {
    return {
      status: 429,
      body: { error: 'Rate limit reached: at most 5 download emails can be sent per order per hour.' },
    };
  }

  // Handle email update if changed
  let updatedEmailHistory = order.emailHistory || [];
  let emailChanged = false;
  if (order.email.trim().toLowerCase() !== targetEmail) {
    emailChanged = true;
    updatedEmailHistory = [
      ...updatedEmailHistory,
      { email: order.email, changedAt: new Date().toISOString() },
    ];
  }

  const downloadUrl = getDownloadLink(order.pack) || '';
  const orderPageUrl = order.method === 'stripe'
    ? `${siteUrl}/thank-you?order_id=${order.orderId}&session_id=${order.stripeSessionId || ''}`
    : `${siteUrl}/order/${order.orderId}?t=${order.accessToken || ''}`;

  const emailResult = await sendOrderApprovedEmailDetailed({
    customerEmail: targetEmail,
    customerName: order.name,
    orderId: order.orderId,
    pack: order.pack,
    downloadUrl,
    orderPageUrl,
    replyTo: config.business?.email,
  });

  if (!emailResult.ok) {
    return {
      status: 500,
      body: { error: emailResult.error || 'Failed to send email via Resend' },
    };
  }

  const nowIso = new Date().toISOString();
  const newCount = (order.emailSentCount || 0) + 1;
  const newAdminSends = [...existingSends, nowIso];

  await store.update(order.orderId, {
    ...(emailChanged ? { email: targetEmail, emailHistory: updatedEmailHistory } : {}),
    emailSentAt: nowIso,
    emailSentCount: newCount,
    emailLastSentTo: targetEmail,
    adminEmailSends: newAdminSends,
  });

  console.log(
    `[ADMIN AUDIT] download email sent for ${order.orderId} to ${targetEmail} by ${adminUser || 'admin'} (messageId: ${emailResult.messageId || 'unknown'})`
  );

  return {
    status: 200,
    body: {
      ok: true,
      messageId: emailResult.messageId,
      emailSentAt: nowIso,
      emailSentCount: newCount,
      emailLastSentTo: targetEmail,
      email: targetEmail,
    },
  };
}
