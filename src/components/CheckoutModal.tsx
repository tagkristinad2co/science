import React, { useState, useEffect, useRef } from 'react';
import { isValidEmail, isValidMalaysianPhone, config } from '../config';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: '100' | '200';
  displayPrice: string;
  allowsCards?: boolean;
  qrAvailable?: boolean;
  onNavigate?: (path: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  pack,
  displayPrice,
  allowsCards: _allowsCards = false,
  qrAvailable = false,
  onNavigate,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'manual'>('online');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const showManualOption = qrAvailable && config.manualPayment.enabled;

  // 1. Focus effect: runs ONLY once when the modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setPaymentMethod('online');
      const timer = setTimeout(() => nameInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 2. Escape key and body scroll lock: independent of onClose reference
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || cleanName.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!isValidMalaysianPhone(cleanPhone)) {
      setError('Please enter a valid Malaysian phone number (e.g. 0123456789 or +60123456789).');
      return;
    }

    setLoading(true);

    if (paymentMethod === 'manual') {
      try {
        const res = await fetch('/api/manual/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pack,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.orderId || !data.accessToken) {
          throw new Error(data.error || "We couldn't start the manual payment. Please try again.");
        }

        const targetUrl = `/order/${data.orderId}?t=${data.accessToken}`;
        onClose();
        if (onNavigate) {
          onNavigate(targetUrl);
        } else {
          window.location.href = targetUrl;
        }
      } catch (err: any) {
        console.error('[Manual create submit error]', err);
        setError(err.message || "We couldn't start the payment. Please try again.");
        setLoading(false);
      }
      return;
    }

    // Default: Stripe Checkout
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "We couldn't start the payment. Please try again.");
      }

      // Redirect to Stripe Checkout page
      window.location.href = data.url;
    } catch (err: any) {
      console.error('[Checkout submit error]', err);
      setError(err.message || "We couldn't start the payment. Please try again.");
      setLoading(false);
    }
  };

  const packTitle = pack === '200' ? '200 sheets' : '100 sheets';

  return (
    <div
      className="modal open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '460px',
          padding: '32px 28px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(16, 29, 61, 0.2)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            lineHeight: 1,
            color: '#65728d',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '4px',
          }}
          aria-label="Close modal"
        >
          ×
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--purple)',
              marginBottom: '6px',
            }}
          >
            Instant Digital Download
          </div>
          <h2
            id="checkout-modal-title"
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: 'var(--navy)',
              margin: '0 0 6px',
            }}
          >
            {packTitle} · {displayPrice}
          </h2>
          <p style={{ fontSize: '13px', color: '#65728d', margin: 0 }}>
            Printable PDF files delivered digitally immediately upon confirmation.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '13px',
              marginBottom: '16px',
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              htmlFor="checkout-name"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--navy)',
                marginBottom: '6px',
              }}
            >
              Full name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="checkout-name"
              ref={nameInputRef}
              type="text"
              required
              autoComplete="name"
              placeholder="e.g. Aisyah binti Ahmad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #cdd7e8',
                fontSize: '15px',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="checkout-email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--navy)',
                marginBottom: '6px',
              }}
            >
              Email address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="checkout-email"
              type="email"
              required
              autoComplete="email"
              placeholder="e.g. aisyah@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #cdd7e8',
                fontSize: '15px',
              }}
            />
            <div style={{ fontSize: '11px', color: '#65728d', marginTop: '4px' }}>
              Your download link and invoice are sent here.
            </div>
          </div>

          <div>
            <label
              htmlFor="checkout-phone"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--navy)',
                marginBottom: '6px',
              }}
            >
              Phone number <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="checkout-phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="e.g. 0123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #cdd7e8',
                fontSize: '15px',
              }}
            />
            <div style={{ fontSize: '11px', color: '#65728d', marginTop: '4px' }}>
              Required for payment identification & support.
            </div>
          </div>

          {/* Payment Method Selector (shown only when manual payment QR is available and enabled) */}
          {showManualOption && (
            <div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--navy)',
                  marginBottom: '8px',
                }}
              >
                Payment method
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  disabled={loading}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '10px',
                    border: paymentMethod === 'online' ? '2px solid var(--purple)' : '1px solid #cdd7e8',
                    background: paymentMethod === 'online' ? '#f5f3ff' : '#ffffff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--navy)', marginBottom: '3px' }}>
                    ⚡ Pay online
                  </div>
                  <div style={{ fontSize: '11px', color: '#65728d', lineHeight: 1.3 }}>
                    {config.onlinePaymentLabel} · Instant download
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('manual')}
                  disabled={loading}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '10px',
                    border: paymentMethod === 'manual' ? '2px solid var(--purple)' : '1px solid #cdd7e8',
                    background: paymentMethod === 'manual' ? '#f5f3ff' : '#ffffff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--navy)', marginBottom: '3px' }}>
                    📱 DuitNow / Touch 'n Go QR
                  </div>
                  <div style={{ fontSize: '11px', color: '#65728d', lineHeight: 1.3 }}>
                    Manual check · download unlocked {config.manualPayment.reviewTime}
                  </div>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-lime"
            disabled={loading}
            style={{ width: '100%', minHeight: '54px', marginTop: '6px' }}
          >
            {loading
              ? paymentMethod === 'manual'
                ? 'CREATING QR ORDER…'
                : 'REDIRECTING TO SECURE CHECKOUT…'
              : paymentMethod === 'manual'
              ? 'CONTINUE TO QR PAYMENT →'
              : 'PAY NOW →'}
          </button>

          <div
            style={{
              textAlign: 'center',
              fontSize: '11px',
              color: '#65728d',
              marginTop: '4px',
              lineHeight: 1.5,
            }}
          >
            By paying, you agree to our{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline' }}
            >
              Terms & Conditions
            </a>
            ,{' '}
            <a
              href="/booking-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline' }}
            >
              Booking Policy
            </a>{' '}
            and{' '}
            <a
              href="/payment-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline' }}
            >
              Payment Policy
            </a>
            .
          </div>

          <div
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#65728d',
              marginTop: '8px',
            }}
          >
            {paymentMethod === 'manual'
              ? '📱 Scan QR via your banking or Touch \'n Go app · Manual review'
              : `🔒 Secure checkout by Stripe · ${config.onlinePaymentLabel}`}
          </div>
        </form>
      </div>
    </div>
  );
};
