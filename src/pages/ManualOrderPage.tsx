import React, { useState, useEffect, useRef } from 'react';
import { config } from '../config';
import { compressReceiptFile } from '../utils/imageCompressor';
import { PolicyValue } from '../components/PolicyValue';
import { checkQrImages, QrAvailability } from '../utils/qrCheck';
import { trackPurchase } from '../utils/metaPixel';
import { calculatePrice } from '../../shared/pricing';

interface ManualOrderPageProps {
  orderId: string;
  token: string;
  onNavigate: (path: string) => void;
}

interface OrderData {
  orderId: string;
  pack: '100' | '200';
  amount: number; // cents
  name: string;
  email: string;
  phone: string;
  status: 'awaiting_payment' | 'under_review' | 'paid' | 'rejected' | 'expired';
  downloadUrl?: string;
  expiresAt?: string;
  customerReference?: string;
  receiptUploadedAt?: string;
  rejectReason?: string;
}

export const ManualOrderPage: React.FC<ManualOrderPageProps> = ({ orderId, token, onNavigate }) => {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active QR tab
  const [qrTab, setQrTab] = useState<'duitnow' | 'tng'>('duitnow');
  const [qrAvailability, setQrAvailability] = useState<QrAvailability>({
    duitnow: false,
    tng: false,
    anyAvailable: false,
  });

  // Receipt form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [referenceInput, setReferenceInput] = useState('');
  const [submittingReceipt, setSubmittingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Copy feedback
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial fetch of order & QR check
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [orderRes, qrRes] = await Promise.all([
          fetch(`/api/manual/order?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`),
          checkQrImages(),
        ]);

        if (!orderRes.ok) {
          if (orderRes.status === 404) {
            throw new Error('Order not found or invalid access token. Please check your link.');
          }
          throw new Error('Could not load order details.');
        }

        const data = await orderRes.json();
        if (isMounted) {
          setOrder(data);
          setQrAvailability(qrRes);
          // If duitnow missing but tng exists, switch default tab
          if (!qrRes.duitnow && qrRes.tng) {
            setQrTab('tng');
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load order.');
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [orderId, token]);

  // 2. Polling every 20 seconds while in 'under_review'
  useEffect(() => {
    if (!order || order.status !== 'under_review') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/manual/status?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status && data.status !== 'under_review') {
            setOrder((prev) => (prev ? { ...prev, ...data } : null));
          }
        }
      } catch (err) {
        console.warn('[Status polling error]', err);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [order?.status, orderId, token]);

  // Fire Purchase event once when confirmed paid
  useEffect(() => {
    if (order?.status === 'paid' && order.orderId && order.pack) {
      const amountInRm =
        typeof order.amount === 'number'
          ? order.amount / 100
          : calculatePrice(order.pack).amountCents / 100;
      trackPurchase(order.orderId, order.pack, amountInRm);
    }
  }, [order?.status, order?.orderId, order?.pack, order?.amount]);

  const handleCopy = (text: string, type: 'order' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'order') {
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a receipt file to upload.');
      return;
    }

    setSubmittingReceipt(true);
    setUploadError(null);

    try {
      // Compress image client-side if it's a photo
      const fileToSend = await compressReceiptFile(selectedFile);

      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('token', token);
      formData.append('reference', referenceInput.trim());
      formData.append('file', fileToSend);

      const res = await fetch('/api/manual/receipt', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit receipt.');
      }

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: 'under_review',
              customerReference: referenceInput.trim(),
              receiptUploadedAt: new Date().toISOString(),
            }
          : null
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('[Receipt submit error]', err);
      setUploadError(err.message || 'Failed to submit receipt. Please try again.');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f9ff' }}>
        <div style={{ textAlign: 'center', color: 'var(--navy)' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Loading your order…</div>
          <div style={{ fontSize: '14px', color: '#65728d' }}>Please wait a moment</div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f9ff', padding: '24px' }}>
        <div style={{ maxWidth: '480px', background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--navy)', marginBottom: '10px' }}>Order Not Found</h1>
          <p style={{ color: '#65728d', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            {error || 'This order does not exist or the access token is invalid.'}
          </p>
          <button
            type="button"
            className="btn-lime"
            onClick={() => onNavigate('/')}
            style={{ width: '100%', minHeight: '48px' }}
          >
            ← Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const amountFormatted = `RM${(order.amount / 100).toFixed(2)}`;
  const fullOrderUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9ff', padding: '32px 16px 80px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Header brand link */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ color: 'var(--purple)', fontSize: '20px' }}>✦</span>
            <span style={{ fontWeight: 900, fontSize: '16px', letterSpacing: '0.05em', color: 'var(--navy)' }}>
              SCIENCE MADE VISUAL
            </span>
          </button>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e1e9f5',
            boxShadow: '0 8px 30px rgba(16, 29, 61, 0.06)',
            padding: '36px 30px',
            color: '#101d3d',
          }}
        >
          {/* ========================================================
              STATUS: PAID (SUCCESS)
             ======================================================== */}
          {order.status === 'paid' && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '32px',
                  marginBottom: '16px',
                }}
              >
                ✓
              </div>

              <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--navy)', margin: '0 0 8px' }}>
                Payment Confirmed!
              </h1>
              <p style={{ color: '#65728d', fontSize: '15px', marginBottom: '24px' }}>
                Thank you, <strong>{order.name}</strong>. Your payment for order{' '}
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{order.orderId}</span> has been verified.
              </p>

              {order.downloadUrl ? (
                <div style={{ margin: '28px 0' }}>
                  <a
                    href={order.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-lime"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      width: '100%',
                      minHeight: '56px',
                      fontSize: '16px',
                      fontWeight: 800,
                    }}
                  >
                    DOWNLOAD YOUR {order.pack} SHEETS (PDF) →
                  </a>
                  <p style={{ fontSize: '13px', color: '#65728d', marginTop: '12px' }}>
                    Tip: Bookmark this page or save your PDF immediately to your device or Google Drive.
                  </p>
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', fontSize: '14px', color: '#65728d' }}>
                  Your download is ready. Please check your email or contact support.mathceria@gmail.com.
                </div>
              )}

              <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  style={{ background: 'none', border: 'none', color: 'var(--purple)', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                  ← Return to Science Made Visual
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              STATUS: UNDER REVIEW
             ======================================================== */}
          {order.status === 'under_review' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#e0e7ff',
                    color: 'var(--purple)',
                    fontSize: '28px',
                    marginBottom: '14px',
                  }}
                >
                  ⏳
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--navy)', margin: '0 0 8px' }}>
                  Receipt Under Review
                </h1>
                <p style={{ color: '#4a5568', fontSize: '15px', lineHeight: 1.6, margin: '0 0 16px' }}>
                  ✅ <strong>Receipt received.</strong> We're checking your payment, usually{' '}
                  <strong>{config.manualPayment.reviewTime}</strong>. This page updates automatically once approved.
                </p>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                  fontSize: '14px',
                  lineHeight: 1.7,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#65728d' }}>Order number:</span>
                  <strong style={{ fontFamily: 'monospace' }}>{order.orderId}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#65728d' }}>Amount paid:</span>
                  <strong style={{ color: 'var(--purple)', fontSize: '16px' }}>{amountFormatted}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#65728d' }}>Pack:</span>
                  <strong>{order.pack} illustrated science sheets</strong>
                </div>
                {order.customerReference && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#65728d' }}>Reference entered:</span>
                    <strong style={{ fontFamily: 'monospace' }}>{order.customerReference}</strong>
                  </div>
                )}
              </div>

              {/* Bookmark warning */}
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '24px',
                  fontSize: '13px',
                  color: '#1e40af',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: '6px' }}>📌 Please bookmark this private page</div>
                <div>
                  This is your private link to download your science sheets once payment is verified. You can also copy your link:
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(fullOrderUrl, 'link')}
                  style={{
                    marginTop: '10px',
                    padding: '8px 14px',
                    background: '#ffffff',
                    border: '1px solid #93c5fd',
                    borderRadius: '8px',
                    color: '#1d4ed8',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {copiedLink ? '✓ LINK COPIED TO CLIPBOARD' : 'COPY PRIVATE ORDER LINK'}
                </button>
              </div>

              <div style={{ textAlign: 'center', fontSize: '13px', color: '#65728d' }}>
                Need help? Email us at <PolicyValue value={config.business.email} isEmail /> with your order number.
              </div>
            </div>
          )}

          {/* ========================================================
              STATUS: EXPIRED
             ======================================================== */}
          {order.status === 'expired' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>⏰</div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--navy)', margin: '0 0 10px' }}>
                Order Expired
              </h1>
              <p style={{ color: '#65728d', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                This order has expired because payment was not completed within 24 hours. Please place a new order.
              </p>
              <button
                type="button"
                className="btn-lime"
                onClick={() => onNavigate('/#pricing')}
                style={{ width: '100%', minHeight: '52px' }}
              >
                PLACE A NEW ORDER →
              </button>
            </div>
          )}

          {/* ========================================================
              STATUS: AWAITING PAYMENT or REJECTED
             ======================================================== */}
          {(order.status === 'awaiting_payment' || order.status === 'rejected') && (
            <div>
              {order.status === 'rejected' && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    color: '#991b1b',
                    marginBottom: '24px',
                    fontSize: '14px',
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: '4px' }}>⚠️ Receipt could not be verified</div>
                  <div>
                    <strong>Reason:</strong> {order.rejectReason || 'Payment not matching or receipt unreadable.'}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    You can upload a new receipt below, or contact{' '}
                    <PolicyValue value={config.business.email} isEmail />.
                  </div>
                </div>
              )}

              {/* Big Amount and Order ID */}
              <div
                style={{
                  textAlign: 'center',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px 20px',
                  marginBottom: '28px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#65728d', marginBottom: '4px' }}>
                  Amount to Pay
                </div>
                <div style={{ fontSize: '38px', fontWeight: 900, color: 'var(--navy)', letterSpacing: '-0.02em' }}>
                  {amountFormatted}
                </div>
                <div style={{ fontSize: '14px', color: '#4a5568', marginTop: '6px' }}>
                  Pack: <strong>{order.pack} illustrated science sheets (PDF)</strong>
                </div>

                <div
                  style={{
                    marginTop: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '6px 12px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Order #:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px', color: 'var(--navy)' }}>
                    {order.orderId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.orderId, 'order')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--purple)',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: '2px 4px',
                    }}
                  >
                    {copiedOrder ? '✓ COPIED' : 'COPY'}
                  </button>
                </div>
              </div>

              {/* QR Code Tabs */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setQrTab('duitnow')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'none',
                      border: 'none',
                      borderBottom: qrTab === 'duitnow' ? '3px solid var(--purple)' : '3px solid transparent',
                      fontWeight: 800,
                      fontSize: '14px',
                      color: qrTab === 'duitnow' ? 'var(--navy)' : '#65728d',
                      cursor: 'pointer',
                      marginBottom: '-2px',
                    }}
                  >
                    DuitNow QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrTab('tng')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'none',
                      border: 'none',
                      borderBottom: qrTab === 'tng' ? '3px solid var(--purple)' : '3px solid transparent',
                      fontWeight: 800,
                      fontSize: '14px',
                      color: qrTab === 'tng' ? 'var(--navy)' : '#65728d',
                      cursor: 'pointer',
                      marginBottom: '-2px',
                    }}
                  >
                    Touch 'n Go eWallet QR
                  </button>
                </div>

                {/* QR Display Card */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(16, 29, 61, 0.04)',
                  }}
                >
                  {qrTab === 'duitnow' ? (
                    qrAvailability.duitnow ? (
                      <div>
                        <img
                          src="/assets/qr-duitnow.png"
                          alt="DuitNow QR code"
                          style={{
                            maxWidth: '280px',
                            width: '100%',
                            height: 'auto',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            margin: '0 auto 14px',
                            display: 'block',
                          }}
                        />
                        <a
                          href="/assets/qr-duitnow.png"
                          download="duitnow-qr.png"
                          style={{
                            display: 'inline-block',
                            padding: '8px 16px',
                            background: '#f1f5f9',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--navy)',
                            textDecoration: 'none',
                            marginBottom: '10px',
                          }}
                        >
                          ⬇ Save QR Image
                        </a>
                      </div>
                    ) : (
                      <div
                        style={{
                          height: '240px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f8fafc',
                          borderRadius: '12px',
                          border: '2px dashed #cbd5e1',
                          color: '#64748b',
                          fontSize: '14px',
                          fontWeight: 600,
                          marginBottom: '14px',
                        }}
                      >
                        QR code coming soon
                      </div>
                    )
                  ) : qrAvailability.tng ? (
                    <div>
                      <img
                        src="/assets/qr-tng.png"
                        alt="Touch 'n Go eWallet QR code"
                        style={{
                          maxWidth: '280px',
                          width: '100%',
                          height: 'auto',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          margin: '0 auto 14px',
                          display: 'block',
                        }}
                      />
                      <a
                        href="/assets/qr-tng.png"
                        download="tng-qr.png"
                        style={{
                          display: 'inline-block',
                          padding: '8px 16px',
                          background: '#f1f5f9',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--navy)',
                          textDecoration: 'none',
                          marginBottom: '10px',
                        }}
                      >
                        ⬇ Save QR Image
                      </a>
                    </div>
                  ) : (
                    <div
                      style={{
                        height: '240px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '2px dashed #cbd5e1',
                        color: '#64748b',
                        fontSize: '14px',
                        fontWeight: 600,
                        marginBottom: '14px',
                      }}
                    >
                      QR code coming soon
                    </div>
                  )}

                  <div style={{ fontSize: '13px', color: '#65728d' }}>
                    Account name: <strong style={{ color: 'var(--navy)' }}><PolicyValue value={config.manualPayment.accountName} /></strong>
                  </div>
                </div>
              </div>

              {/* Instructions Steps */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--navy)', marginBottom: '14px' }}>
                  How to complete your payment:
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                      1
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: 1.5, color: '#334155' }}>
                      Scan the QR code and pay exactly <strong>{amountFormatted}</strong> using your banking app or Touch 'n Go eWallet.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                      2
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: 1.5, color: '#334155' }}>
                      In the payment reference / remarks field, enter your order number:{' '}
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--purple)' }}>{order.orderId}</span>{' '}
                      <button
                        type="button"
                        onClick={() => handleCopy(order.orderId, 'order')}
                        style={{
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          color: 'var(--purple)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '2px 6px',
                        }}
                      >
                        {copiedOrder ? '✓ COPIED' : 'COPY'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                      3
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: 1.5, color: '#334155' }}>
                      Take a screenshot or download your payment receipt, and upload it below.
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Receipt Form */}
              <form
                onSubmit={handleReceiptSubmit}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px 20px',
                  marginBottom: '28px',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 12px' }}>
                  Upload Receipt
                </h3>

                {uploadError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      color: '#b91c1c',
                      fontSize: '13px',
                      marginBottom: '14px',
                    }}
                  >
                    {uploadError}
                  </div>
                )}

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>
                    Receipt file (JPG, PNG, WEBP, or PDF, max 4 MB) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    required
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    disabled={submittingReceipt}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>
                    Transaction / reference number (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TnG reference or bank transfer ref"
                    value={referenceInput}
                    onChange={(e) => setReferenceInput(e.target.value)}
                    disabled={submittingReceipt}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-lime"
                  disabled={submittingReceipt}
                  style={{ width: '100%', minHeight: '50px' }}
                >
                  {submittingReceipt ? 'UPLOADING RECEIPT…' : 'SUBMIT RECEIPT →'}
                </button>
              </form>

              {/* Bookmark Warning */}
              <div
                style={{
                  background: '#fefce8',
                  border: '1px solid #fef08a',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  fontSize: '13px',
                  color: '#854d0e',
                  lineHeight: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div>
                  <strong>⚠️ Warning:</strong> Bookmark this page. It's your private link to download your sheets once approved.
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => handleCopy(fullOrderUrl, 'link')}
                    style={{
                      padding: '6px 12px',
                      background: '#ffffff',
                      border: '1px solid #ca8a04',
                      borderRadius: '6px',
                      color: '#854d0e',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedLink ? '✓ LINK COPIED' : 'COPY PRIVATE LINK'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
