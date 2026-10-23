import { getEnv } from './env.ts';

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

export async function sendOrderApprovedEmail(params: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  pack: string;
  downloadUrl: string;
  orderPageUrl?: string;
  replyTo?: string;
}): Promise<void> {
  const apiKey = getEnv('RESEND_API_KEY');
  const fromEmail = getEnv('EMAIL_FROM') || 'Science Made Visual <orders@bloxmath.quest>';

  if (!apiKey) {
    console.log('[Resend Email Skipped] RESEND_API_KEY is not configured.');
    return;
  }

  const orderPageSection = params.orderPageUrl
    ? `
      <p>You can also access your download link and view your order any time at your private order page:</p>
      <p><a href="${params.orderPageUrl}" style="color: #7c3aed;">${params.orderPageUrl}</a></p>
    `
    : '';

  const html = `
    <div style="font-family: Arial, sans-serif; color: #101d3d; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <h2 style="color: #101d3d;">Your Science Made Visual sheets are ready!</h2>
      <p>Hi ${params.customerName},</p>
      <p>Your payment for order <strong>${params.orderId}</strong> (${params.pack}-sheet pack) has been confirmed.</p>
      <div style="margin: 28px 0;">
        <a href="${params.downloadUrl}" style="background: #a3e635; color: #101d3d; padding: 14px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
          DOWNLOAD YOUR SHEETS (PDF) →
        </a>
      </div>
      ${orderPageSection}
      <p style="color: #64748b; font-size: 13px; margin-top: 32px;">Please save your download link. If you ever have questions or need assistance, reply to this email or contact support.mathceria@gmail.com.</p>
    </div>
  `;

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
        reply_to: params.replyTo || 'support.mathceria@gmail.com',
        subject: 'Your Science Made Visual sheets are ready',
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Resend Email Failed]', res.status, errText);
    } else {
      console.log(`[Resend Email Sent] Sent to ${params.customerEmail}`);
    }
  } catch (err) {
    console.error('[Resend Email Error]', err);
  }
}
