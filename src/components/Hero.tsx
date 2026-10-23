import React from 'react';
import { CountdownState } from '../hooks/useFoundingTimer';
import { config } from '../config';

interface HeroProps {
  onScrollToPricing: () => void;
  onPreviewImage: (image: string, title: string, alt: string) => void;
  price100: string;
  perSheet100: string;
  futurePrice100: string;
  countdown: CountdownState;
  allowsCards?: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  onScrollToPricing,
  onPreviewImage,
  price100,
  perSheet100,
  futurePrice100,
  countdown,
  allowsCards: _allowsCards = false,
}) => {
  return (
    <section className="section" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
      <div className="ebook-shell center">
        <div className="eyebrow">Visual science study sheets</div>
        <h1>
          Science your child can actually see.{' '}
          <em>Not just memorise.</em>
        </h1>
        <p className="lead" style={{ margin: '0 auto 28px' }}>
          100 colourful, illustrated science sheets covering biology, chemistry,
          physics and Earth science. Clear diagrams, labels and key facts on every
          page. Print them or use them on screen.
        </p>

        {/* 3D Stack Mockup */}
        <div className="mockup-container" aria-label="100-sheet science collection preview">
          <div className="mockup-glow" />
          <div
            className="mockup-sheet one"
            style={{ cursor: 'pointer' }}
            onClick={() =>
              onPreviewImage(
                '/assets/page-3.webp',
                'Carbon Cycle',
                'Carbon cycle science study sheet'
              )
            }
            title="Click to preview sheet"
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="protected-preview" style={{ width: '100%', height: '100%', position: 'relative' }}>
              <div className="watermark-overlay" aria-hidden="true" onContextMenu={(e) => e.preventDefault()} />
              <img
                src="/assets/page-3.webp"
                alt="Carbon cycle sheet"
                loading="eager"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </div>
          <div
            className="mockup-sheet two"
            style={{ cursor: 'pointer' }}
            onClick={() =>
              onPreviewImage(
                '/assets/page-42.webp',
                'Periodic Table',
                'Periodic table science study sheet'
              )
            }
            title="Click to preview sheet"
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="protected-preview" style={{ width: '100%', height: '100%', position: 'relative' }}>
              <div className="watermark-overlay" aria-hidden="true" onContextMenu={(e) => e.preventDefault()} />
              <img
                src="/assets/page-42.webp"
                alt="Periodic table sheet"
                loading="eager"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </div>
          <div
            className="mockup-sheet three"
            style={{ cursor: 'pointer' }}
            onClick={() =>
              onPreviewImage(
                '/assets/page-22.webp',
                'Human Heart',
                'Human heart science study sheet'
              )
            }
            title="Click to preview sheet"
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="mockup-ribbon">100 SHEETS</div>
            <div className="protected-preview" style={{ width: '100%', height: '100%', position: 'relative' }}>
              <div className="watermark-overlay" aria-hidden="true" onContextMenu={(e) => e.preventDefault()} />
              <img
                src="/assets/page-22.webp"
                alt="Human heart sheet"
                loading="eager"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </div>
        </div>

        {/* Offer Box */}
        <div className="offer-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <span style={{ fontWeight: 800, color: 'var(--purple)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {countdown.isFounding ? 'Founding price · 100 sheets' : 'Standard pack · 100 sheets'}
            </span>
            {countdown.isFounding && (
              <span className="pill-lime">FOUNDING PRICE</span>
            )}
          </div>

          {countdown.isFounding && (
            <div
              style={{
                background: '#f4f0ff',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--navy)',
                fontWeight: 700,
                margin: '10px auto 14px',
                maxWidth: '380px',
              }}
            >
              ⏳ Offer ends in {countdown.formattedTime}
            </div>
          )}

          <div className="price">{price100}</div>
          <div style={{ fontSize: '13px', color: '#65728d', marginBottom: '4px' }}>
            one-time payment
          </div>

          {countdown.isFounding && (
            <div style={{ fontSize: '13px', color: '#7a8599', marginBottom: '8px' }}>
              Price goes up to {futurePrice100} after launch
            </div>
          )}

          <p style={{ fontSize: '14px', color: 'var(--navy)', fontWeight: 600, margin: '10px 0 20px' }}>
            That's {perSheet100}.
          </p>

          <button
            type="button"
            className="btn-lime"
            onClick={onScrollToPricing}
            style={{ width: '100%', maxWidth: '440px' }}
          >
            YES, I WANT THE SCIENCE SHEETS →
          </button>

          <div className="offer-trust">
            <span>⚡ Instant download</span>
            <span>🔒 Secure checkout by Stripe</span>
            <span>💳 {config.onlinePaymentLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
