import React, { useState } from 'react';
import { CountdownState } from '../hooks/useFoundingTimer';
import { config } from '../config';
import { trackAddToCart } from '../utils/metaPixel';
import { calculatePrice } from '../../shared/pricing';

interface PricingProps {
  onCheckout: (includeUpgrade: boolean) => void;
  price100: string;
  price200: string;
  upgrade: string;
  futurePrice100: string;
  futurePrice200: string;
  perSheet100: string;
  perSheet200: string;
  countdown: CountdownState;
  allowsCards?: boolean;
}

export const Pricing: React.FC<PricingProps> = ({
  onCheckout,
  price100,
  price200,
  upgrade,
  futurePrice100,
  futurePrice200,
  perSheet100,
  perSheet200,
  countdown,
  allowsCards: _allowsCards = false,
}) => {
  const [includeUpgrade, setIncludeUpgrade] = useState(false);

  const displayPrice = includeUpgrade ? price200 : price100;
  const futurePrice = includeUpgrade ? futurePrice200 : futurePrice100;
  const perSheet = includeUpgrade ? perSheet200 : perSheet100;

  const checklist = [
    '100 original illustrated science PDF sheets',
    'Biology, chemistry, physics & Earth science',
    'Printable and screen-friendly',
    'Instant download after payment',
    'One-time payment, no subscription',
  ];

  return (
    <section className="section" id="pricing">
      <div className="ebook-shell center">
        <h2>Choose your pack</h2>

        <div className="pricebox">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <span className="eyebrow" style={{ padding: '6px 12px' }}>
              100-sheet digital collection
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
                maxWidth: '400px',
              }}
            >
              ⏳ Founding price ends in {countdown.formattedTime}
            </div>
          )}

          <div className="price">{displayPrice}</div>

          {includeUpgrade && (
            <div
              style={{
                fontSize: '13px',
                color: 'var(--purple)',
                fontWeight: 700,
                marginBottom: '4px',
              }}
            >
              100 sheets {price100} + 100 more sheets {upgrade}
            </div>
          )}

          {countdown.isFounding && (
            <div style={{ fontSize: '13px', color: '#7a8599', marginBottom: '6px' }}>
              Price goes up to {futurePrice} after launch
            </div>
          )}

          <div style={{ fontSize: '13px', color: 'var(--navy)', fontWeight: 600, marginBottom: '6px' }}>
            That's {perSheet}.
          </div>

          <p className="fine" style={{ margin: '0 0 16px', color: '#65728d' }}>
            One-time payment · Personal / household study
          </p>

          <ul className="includes">
            {checklist.map((item, i) => (
              <li key={i}>
                <span className="check">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* Upsell Add-on Box */}
          <div className="upsell-box">
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={includeUpgrade}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIncludeUpgrade(checked);
                  if (checked) {
                    const price200Num = calculatePrice('200').amountCents / 100;
                    trackAddToCart(price200Num);
                  }
                }}
                style={{
                  marginTop: '3px',
                  width: '18px',
                  height: '18px',
                  accentColor: 'var(--purple)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />
              <div>
                <span style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '14px' }}>
                  Add 100 more sheets (200 total): +{upgrade}
                </span>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '13px',
                    color: '#65728d',
                    lineHeight: 1.5,
                  }}
                >
                  {countdown.isFounding
                    ? 'Founding price, then +RM20 after launch.'
                    : 'Double your collection.'}
                </p>
              </div>
            </label>
          </div>

          <button
            type="button"
            className="btn-lime"
            onClick={() => onCheckout(includeUpgrade)}
            style={{ width: '100%', maxWidth: '460px' }}
          >
            {includeUpgrade
              ? `GET ALL 200 SHEETS — ${price200} →`
              : `GET MY 100 SHEETS — ${price100} →`}
          </button>

          <div style={{ fontSize: '12px', color: '#65728d', marginTop: '16px' }}>
            🔒 {config.onlinePaymentLabel} via Stripe (instant) · DuitNow & Touch 'n Go QR (manual)
          </div>
        </div>
      </div>
    </section>
  );
};
