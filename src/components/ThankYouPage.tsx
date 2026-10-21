import React, { useState, useEffect } from 'react';
import { config } from '../config';

interface ThankYouPageProps {
  onBackToHome: () => void;
}

interface OrderStatusResponse {
  status: 'paid' | 'pending' | 'failed';
  orderId?: string;
  pack?: '100' | '200';
  downloadUrl?: string;
  email?: string;
  error?: string;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({ onBackToHome }) => {
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderStatusResponse | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [secondsWaited, setSecondsWaited] = useState(0);

  // Extract order_id and billcode from URL
  const query = new URLSearchParams(window.location.search);
  const orderId = query.get('order_id') || query.get('orderId') || '';
  const billCode = query.get('billcode') || query.get('billCode') || '';

  useEffect(() => {
    let intervalId: any = null;
    let elapsed = 0;

    const checkStatus = async () => {
      if (!orderId) {
        setLoading(false);
        setOrderData({ status: 'failed', error: 'No order identifier found.' });
        return;
      }

      try {
        const res = await fetch(`/api/order-status?order_id=${encodeURIComponent(orderId)}&billcode=${encodeURIComponent(billCode)}`);
        const data: OrderStatusResponse = await res.json();

        setOrderData(data);

        if (data.status === 'paid' || data.status === 'failed') {
          setLoading(false);
          if (intervalId) clearInterval(intervalId);
          return;
        }
      } catch (err) {
        console.warn('[ThankYou] Polling status check error:', err);
      }

      elapsed += 5;
      setSecondsWaited(elapsed);

      // After 2 minutes (120 seconds), stop auto-polling and show processing message
      if (elapsed >= 120) {
        setTimedOut(true);
        setLoading(false);
        if (intervalId) clearInterval(intervalId);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 5 seconds if still pending
    intervalId = setInterval(checkStatus, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, billCode]);

  return (
    <main id="main" className="section alt" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center' }}>
      <div className="ebook-shell center">
        <div
          style={{
            background: '#fff',
            borderRadius: '24px',
            border: '1px solid #dbe5f5',
            boxShadow: 'var(--shadow)',
            padding: '40px 24px',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          {loading && !orderData?.status && (
            <div>
              <div style={{ fontSize: '42px', marginBottom: '14px' }}>⏳</div>
              <h2>Checking payment status…</h2>
              <p style={{ color: '#5a667f', fontSize: '15px' }}>
                Please wait while we confirm your transaction with toyyibPay.
              </p>
            </div>
          )}

          {orderData?.status === 'paid' && (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
              <h1 style={{ fontSize: '32px', marginBottom: '12px', color: 'var(--navy)' }}>
                Payment successful!
              </h1>
              <div
                style={{
                  background: '#f4f0ff',
                  border: '1px solid #dcd3f8',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontWeight: 800,
                  color: 'var(--navy)',
                  fontSize: '15px',
                  display: 'inline-block',
                  marginBottom: '20px',
                }}
              >
                {orderData.pack === '200' ? '200 Illustrated Science Sheets' : '100 Illustrated Science Sheets'}
              </div>

              <p style={{ color: '#5a667f', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px' }}>
                Your order is confirmed! Click the button below to download your complete printable PDF collection.
              </p>

              {orderData.downloadUrl && (
                <a
                  href={orderData.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-lime"
                  style={{
                    display: 'inline-flex',
                    width: '100%',
                    maxWidth: '440px',
                    textDecoration: 'none',
                    margin: '0 auto',
                  }}
                >
                  DOWNLOAD YOUR SHEETS →
                </a>
              )}

              <p style={{ fontSize: '13px', color: '#65728d', marginTop: '24px', lineHeight: 1.6 }}>
                We've also emailed this link to{' '}
                <strong style={{ color: 'var(--navy)' }}>{orderData.email || 'your email'}</strong>.
                Save it so you can download again anytime.
              </p>

              <div style={{ marginTop: '28px', borderTop: '1px solid #edf1f7', paddingTop: '20px' }}>
                <button
                  type="button"
                  onClick={onBackToHome}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--purple)',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  ← Return to home page
                </button>
              </div>
            </div>
          )}

          {orderData?.status === 'pending' && !timedOut && (
            <div>
              <div style={{ fontSize: '42px', marginBottom: '14px' }}>⏳</div>
              <h2>Your payment is being confirmed…</h2>
              <p style={{ color: '#5a667f', fontSize: '15px', lineHeight: 1.6 }}>
                We are communicating with the Malaysian banking network via toyyibPay to confirm your payment.
                This page will update automatically.
              </p>
              <div style={{ fontSize: '12px', color: '#7a8599', marginTop: '16px' }}>
                Checking status… ({secondsWaited}s)
              </div>
            </div>
          )}

          {orderData?.status === 'pending' && timedOut && (
            <div>
              <div style={{ fontSize: '42px', marginBottom: '14px' }}>ℹ️</div>
              <h2>Still processing</h2>
              <p style={{ color: '#5a667f', fontSize: '15px', lineHeight: 1.6 }}>
                Your bank is still completing verification. Check your email inbox shortly, or contact us at{' '}
                <a href={`mailto:${config.supportEmail}`} style={{ color: 'var(--purple)', fontWeight: 700 }}>
                  {config.supportEmail}
                </a>{' '}
                with your order reference <strong style={{ color: 'var(--navy)' }}>{orderId}</strong>.
              </p>
              <button
                type="button"
                className="btn-lime"
                onClick={onBackToHome}
                style={{ marginTop: '24px', width: '100%', maxWidth: '360px' }}
              >
                RETURN TO HOME →
              </button>
            </div>
          )}

          {orderData?.status === 'failed' && (
            <div>
              <div style={{ fontSize: '42px', marginBottom: '14px' }}>❌</div>
              <h2>Payment wasn't completed.</h2>
              <p style={{ color: '#5a667f', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                The transaction was cancelled or unsuccessful. No charge was completed.
              </p>
              <button
                type="button"
                className="btn-lime"
                onClick={onBackToHome}
                style={{ width: '100%', maxWidth: '360px' }}
              >
                TRY AGAIN →
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
