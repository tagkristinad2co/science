import React from 'react';
import { CountdownState } from '../hooks/useFoundingTimer';

interface FinalCTAProps {
  onScrollToPricing: () => void;
  price100: string;
  countdown: CountdownState;
  allowsCards?: boolean;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({
  onScrollToPricing,
  price100,
  countdown,
  allowsCards: _allowsCards = false,
}) => {
  return (
    <section className="section navy">
      <div className="ebook-shell center">
        <h2>Make science easier to see.</h2>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#e1e9f5', margin: '14px 0 20px' }}>
          100 sheets · {price100} one-time
        </div>

        {countdown.isFounding && (
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '13px',
              color: 'var(--lime)',
              fontWeight: 700,
              marginBottom: '24px',
            }}
          >
            ⏳ Founding price ends in {countdown.formattedTime}
          </div>
        )}

        <div>
          <button
            type="button"
            className="btn-lime"
            onClick={onScrollToPricing}
            style={{ width: '100%', maxWidth: '440px' }}
          >
            YES, I WANT THE SCIENCE SHEETS →
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#bdd0e5', marginTop: '16px' }}>
          Instant download · 🔒 Secure checkout by Stripe
        </div>
      </div>
    </section>
  );
};
