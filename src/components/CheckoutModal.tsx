import React, { useState, useEffect, useRef } from 'react';
import { isValidEmail, isValidMalaysianPhone } from '../config';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: '100' | '200';
  displayPrice: string;
  allowsCards?: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  pack,
  displayPrice,
  allowsCards = false,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setError(null);
      setTimeout(() => nameInputRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !loading) {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, loading, onClose]);

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

      // Redirect to toyyibPay bill payment page
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
        className="policy-card"
        style={{ maxWidth: '480px', padding: '30px 24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="close-btn"
          aria-label="Close checkout"
          onClick={onClose}
          disabled={loading}
        >
          ×
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div className="eyebrow" style={{ padding: '6px 12px', marginBottom: '8px' }}>
            Instant Digital Download
          </div>
          <h2 id="checkout-modal-title" style={{ fontSize: '24px', margin: '8px 0' }}>
            Complete your order
          </h2>
          <div
            style={{
              background: '#f4f0ff',
              border: '1px solid #dcd3f8',
              borderRadius: '12px',
              padding: '12px 16px',
              fontWeight: 800,
              color: 'var(--navy)',
              fontSize: '15px',
              display: 'inline-block',
              marginTop: '6px',
            }}
          >
            {packTitle} — {displayPrice}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: '#ffebe9',
                border: '1px solid #fecdd3',
                color: '#b91c1c',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label
              htmlFor="checkout-name"
              style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}
            >
              Full name
            </label>
            <input
              ref={nameInputRef}
              id="checkout-name"
              type="text"
              required
              autoComplete="name"
              placeholder="e.g. Siti Nurhaliza"
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

          <div style={{ marginBottom: '14px' }}>
            <label
              htmlFor="checkout-email"
              style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}
            >
              Email address (to receive your sheets)
            </label>
            <input
              id="checkout-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
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
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label
              htmlFor="checkout-phone"
              style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}
            >
              Malaysian phone number
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
              Required by Malaysian FPX online banking & toyyibPay.
            </div>
          </div>

          <button
            type="submit"
            className="btn-lime"
            disabled={loading}
            style={{ width: '100%', minHeight: '54px' }}
          >
            {loading ? 'REDIRECTING TO TOYYIBPAY…' : 'PAY WITH TOYYIBPAY →'}
          </button>

          <div
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#65728d',
              marginTop: '16px',
            }}
          >
            🔒 Secure checkout by toyyibPay · {allowsCards ? 'FPX & cards accepted' : 'FPX online banking accepted'}
          </div>
        </form>
      </div>
    </div>
  );
};
