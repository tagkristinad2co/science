import { getEnv } from './env.ts';
import { config } from '../src/config.ts';

function extractFirstName(name: string): string {
  const cleaned = (name || '').trim();
  const firstWord = cleaned.split(/\s+/)[0] || '';
  if (!firstWord) return 'there';
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}

export async function sendTelegramAlert(message: string): Promise<void> {
  const token = getEnv('TELEGRAM_BOT_TOKEN');
  const chatId = getEnv('TELEGRAM_CHAT_ID');

  if (!token || !chatId) {
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Telegram Alert Failed]', res.status, errText);
    } else {
      console.log('[Telegram Alert Sent]');
    }
  } catch (err) {
    console.error('[Telegram Alert Error]', err);
  }
}

/**
 * 1. Receipt Received Email (Manual QR payment awaiting review)
 * Do NOT include any download link in this email.
 */
export async function sendReceiptReceivedEmail(params: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  pack: string;
  amount: string;
  orderPageUrl: string;
  reviewTime?: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = getEnv('RESEND_API_KEY');
  const fromEmail = getEnv('EMAIL_FROM') || 'Science Made Visual <orders@bloxmath.quest>';

  if (!apiKey) {
    console.warn('[Resend Email Skipped] RESEND_API_KEY is not configured.');
    return false;
  }

  const firstName = extractFirstName(params.customerName);
  const supportEmail = params.replyTo || config.business?.email || 'support.mathceria@gmail.com';
  const businessName = config.business?.name || 'TRE Marketing Enterprise';
  const reviewTime = params.reviewTime || config.manualPayment?.reviewTime || 'within 24 hours (usually much faster, 9am–10pm daily)';

  const subject = `We've received your payment receipt – Order ${params.orderId}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #101d3d; max-width: 600px; margin: 0 auto; line-height: 1.6; padding: 24px;">
      <div style="margin-bottom: 24px;">
        <span style="display: inline-block; background: #7855f5; color: #fff; font-weight: 900; font-size: 13px; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.05em;">
          SCIENCE MADE VISUAL
        </span>
      </div>
      <h2 style="color: #101d3d; font-size: 24px; font-weight: 900; margin: 0 0 16px; line-height: 1.25;">
        We've received your payment receipt
      </h2>
      <p style="font-size: 15px; margin: 0 0 16px;">Hi ${firstName},</p>
      <p style="font-size: 15px; margin: 0 0 20px;">
        Thank you for your order! We've received your payment receipt and we're now checking the payment.
      </p>

      <!-- Summary Box -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 24px 0;">
        <div style="font-size: 14px; margin-bottom: 8px;"><strong>Order number:</strong> ${params.orderId}</div>
        <div style="font-size: 14px; margin-bottom: 8px;"><strong>Collection:</strong> ${params.pack} illustrated science sheets</div>
        <div style="font-size: 14px; margin-bottom: 8px;"><strong>Amount:</strong> RM${params.amount}</div>
        <div style="font-size: 14px; margin-bottom: 8px;"><strong>Payment method:</strong> DuitNow / Touch 'n Go QR</div>
        <div style="font-size: 14px;"><strong>Status:</strong> ⏳ Pending payment confirmation</div>
      </div>

      <p style="font-size: 15px; margin: 0 0 24px;">
        What happens next: we'll confirm your payment ${reviewTime}. As soon as it's approved, you'll get another email with your download link.
      </p>

      <div style="margin: 28px 0;">
        <a href="${params.orderPageUrl}" style="background: #7855f5; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: 800; text-decoration: none; display: inline-block; font-size: 14px; letter-spacing: 0.02em;">
          VIEW MY ORDER →
        </a>
      </div>

      <p style="color: #64748b; font-size: 13px; margin: 20px 0 10px;">
        Please keep this email. Your order page link is private, so don't share it.
      </p>
      <p style="color: #64748b; font-size: 13px; margin: 0 0 24px;">
        Questions? Just reply to this email or contact <a href="mailto:${supportEmail}" style="color: #7855f5; text-decoration: underline;">${supportEmail}</a>.
      </p>

      <div style="margin-top: 36px; padding-top: 18px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
        ${businessName} · <a href="mailto:${supportEmail}" style="color: #94a3b8; text-decoration: underline;">${supportEmail}</a>
      </div>
    </div>
  `;

  const text = `Hi ${firstName},

Thank you for your order! We've received your payment receipt and we're now checking the payment.

Order Summary:
- Order number: ${params.orderId}
- Collection: ${params.pack} illustrated science sheets
- Amount: RM${params.amount}
- Payment method: DuitNow / Touch 'n Go QR
- Status: ⏳ Pending payment confirmation

What happens next: we'll confirm your payment ${reviewTime}. As soon as it's approved, you'll get another email with your download link.

View your private order page:
${params.orderPageUrl}

Please keep this email. Your order page link is private, so don't share it.
Questions? Just reply to this email or contact ${supportEmail}.

${businessName} · ${supportEmail}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: params.customerEmail,
        reply_to: supportEmail,
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Resend Receipt Received Failed]', res.status, errText);
      return false;
    }

    console.log(`[Resend Receipt Received Sent] To ${params.customerEmail} for ${params.orderId}`);
    return true;
  } catch (err) {
    console.error('[Resend Receipt Received Error]', err);
    return false;
  }
}

/**
 * 2. Order Approved Email (Includes download button and link)
 */
export async function sendOrderApprovedEmail(params: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  pack: string;
  downloadUrl: string;
  orderPageUrl?: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = getEnv('RESEND_API_KEY');
  const fromEmail = getEnv('EMAIL_FROM') || 'Science Made Visual <orders@bloxmath.quest>';

  if (!apiKey) {
    console.warn('[Resend Email Skipped] RESEND_API_KEY is not configured.');
    return false;
  }

  const firstName = extractFirstName(params.customerName);
  const supportEmail = params.replyTo || config.business?.email || 'support.mathceria@gmail.com';
  const businessName = config.business?.name || 'TRE Marketing Enterprise';

  const subject = 'Payment confirmed – your Science Made Visual sheets are ready 🎉';

  const orderPageSection = params.orderPageUrl
    ? `
      <p style="font-size: 14px; color: #475569; margin: 16px 0 8px;">
        You can also access your files and view your order any time at your private order page:
      </p>
      <p style="margin: 0 0 20px;">
        <a href="${params.orderPageUrl}" style="color: #7855f5; font-weight: 700; text-decoration: underline;">
          ${params.orderPageUrl}
        </a>
      </p>
    `
    : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #101d3d; max-width: 600px; margin: 0 auto; line-height: 1.6; padding: 24px;">
      <div style="margin-bottom: 24px;">
        <span style="display: inline-block; background: #7855f5; color: #fff; font-weight: 900; font-size: 13px; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.05em;">
          SCIENCE MADE VISUAL
        </span>
      </div>
      <h2 style="color: #101d3d; font-size: 24px; font-weight: 900; margin: 0 0 16px; line-height: 1.25;">
        Payment confirmed – your sheets are ready!
      </h2>
      <p style="font-size: 15px; margin: 0 0 16px;">Hi ${firstName},</p>
      <p style="font-size: 15px; margin: 0 0 20px;">
        Your payment for order <strong>${params.orderId}</strong> (${params.pack}-sheet pack) has been confirmed! You can now download your complete science sheets collection below:
      </p>

      <div style="margin: 28px 0;">
        <a href="${params.downloadUrl}" style="background: #d4fa73; color: #101d3d; padding: 16px 32px; border-radius: 12px; font-weight: 900; text-decoration: none; display: inline-block; font-size: 16px; box-shadow: 0 4px 14px rgba(212, 250, 115, 0.45);">
          DOWNLOAD YOUR SHEETS (PDF) →
        </a>
      </div>

      <p style="font-size: 14px; font-weight: 700; color: #101d3d; margin: 20px 0 8px;">
        Save this email so you can download again anytime.
      </p>

      ${orderPageSection}

      <p style="color: #64748b; font-size: 13px; margin: 24px 0 8px;">
        If you have any questions or need help opening the files, reply to this email or contact <a href="mailto:${supportEmail}" style="color: #7855f5; text-decoration: underline;">${supportEmail}</a>.
      </p>

      <div style="margin-top: 36px; padding-top: 18px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
        ${businessName} · <a href="mailto:${supportEmail}" style="color: #94a3b8; text-decoration: underline;">${supportEmail}</a>
      </div>
    </div>
  `;

  const text = `Hi ${firstName},

Your payment for order ${params.orderId} (${params.pack}-sheet pack) has been confirmed!

Download your science sheets (PDF):
${params.downloadUrl}

Save this email so you can download again anytime.
${params.orderPageUrl ? `\nPrivate order page:\n${params.orderPageUrl}\n` : ''}
Questions? Reply to this email or contact ${supportEmail}.

${businessName} · ${supportEmail}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: params.customerEmail,
        reply_to: supportEmail,
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Resend Approval Email Failed]', res.status, errText);
      return false;
    }

    console.log(`[Resend Approval Email Sent] To ${params.customerEmail} for ${params.orderId}`);
    return true;
  } catch (err) {
    console.error('[Resend Approval Email Error]', err);
    return false;
  }
}

/**
 * 3. Order Rejected Email (When payment receipt could not be verified)
 */
export async function sendOrderRejectedEmail(params: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  reason: string;
  orderPageUrl: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = getEnv('RESEND_API_KEY');
  const fromEmail = getEnv('EMAIL_FROM') || 'Science Made Visual <orders@bloxmath.quest>';

  if (!apiKey) {
    console.warn('[Resend Email Skipped] RESEND_API_KEY is not configured.');
    return false;
  }

  const firstName = extractFirstName(params.customerName);
  const supportEmail = params.replyTo || config.business?.email || 'support.mathceria@gmail.com';
  const businessName = config.business?.name || 'TRE Marketing Enterprise';

  const subject = `Action needed: we couldn't confirm your payment – Order ${params.orderId}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #101d3d; max-width: 600px; margin: 0 auto; line-height: 1.6; padding: 24px;">
      <div style="margin-bottom: 24px;">
        <span style="display: inline-block; background: #ef4444; color: #fff; font-weight: 900; font-size: 13px; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.05em;">
          ACTION NEEDED
        </span>
      </div>
      <h2 style="color: #101d3d; font-size: 24px; font-weight: 900; margin: 0 0 16px; line-height: 1.25;">
        We couldn't confirm your payment receipt
      </h2>
      <p style="font-size: 15px; margin: 0 0 16px;">Hi ${firstName},</p>
      <p style="font-size: 15px; margin: 0 0 16px;">
        We reviewed the payment receipt for order <strong>${params.orderId}</strong>, but we were unable to confirm it for the following reason:
      </p>

      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px 18px; margin: 20px 0; color: #991b1b; font-weight: 600; font-size: 14px;">
        ${params.reason}
      </div>

      <p style="font-size: 15px; margin: 0 0 20px;">
        You can upload a new receipt on your order page:
      </p>

      <div style="margin: 28px 0;">
        <a href="${params.orderPageUrl}" style="background: #7855f5; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: 800; text-decoration: none; display: inline-block; font-size: 14px;">
          VIEW MY ORDER →
        </a>
      </div>

      <p style="color: #64748b; font-size: 13px; margin: 24px 0 8px;">
        If you think this is a mistake, reply to this email or reach us directly at <a href="mailto:${supportEmail}" style="color: #7855f5; text-decoration: underline;">${supportEmail}</a>.
      </p>

      <div style="margin-top: 36px; padding-top: 18px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
        ${businessName} · <a href="mailto:${supportEmail}" style="color: #94a3b8; text-decoration: underline;">${supportEmail}</a>
      </div>
    </div>
  `;

  const text = `Hi ${firstName},

We reviewed the payment receipt for order ${params.orderId}, but were unable to confirm it for the following reason:
"${params.reason}"

You can upload a new receipt on your order page:
${params.orderPageUrl}

If you think this is a mistake, reply to this email or contact ${supportEmail}.

${businessName} · ${supportEmail}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: params.customerEmail,
        reply_to: supportEmail,
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Resend Rejection Email Failed]', res.status, errText);
      return false;
    }

    console.log(`[Resend Rejection Email Sent] To ${params.customerEmail} for ${params.orderId}`);
    return true;
  } catch (err) {
    console.error('[Resend Rejection Email Error]', err);
    return false;
  }
}
