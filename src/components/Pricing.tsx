import React, { useState } from 'react';

interface PricingProps {
  onCheckout: (includeUpgrade: boolean) => void;
  basePrice?: string;
  bundlePrice?: string;
}

export const Pricing: React.FC<PricingProps> = ({
  onCheckout,
  basePrice = 'RM39.90',
  bundlePrice = 'RM49.90',
}) => {
  const [includeUpgrade, setIncludeUpgrade] = useState(false);

  const displayPrice = includeUpgrade ? bundlePrice : basePrice;

  return (
    <section className="section alt" id="pricing">
      <div className="shell">
        <div className="center">
          <div className="mini-title">The Founder's Edition</div>
          <h2>Make science revision more visual.</h2>
          <p className="section-intro">
            Get the 100-sheet edition available today. No subscription, no hidden
            monthly charges.
          </p>
        </div>
        <div className="pricebox">
          <div className="eyebrow">100-sheet digital collection</div>
          <div className="price">{displayPrice}</div>
          {includeUpgrade ? (
            <div
              style={{
                fontSize: '13px',
                color: 'var(--purple)',
                fontWeight: 700,
                marginBottom: '4px',
              }}
            >
              100 sheets RM39.90 + 100 more sheets RM10
            </div>
          ) : null}
          <p className="oldnote">One-time payment · Personal / household study</p>
          <ul className="includes">
            <li>100 original illustrated science PDF sheets</li>
            <li>Biology, chemistry, physics & Earth science topics</li>
            <li>Printable and screen-friendly files</li>
            <li>Instant access after successful payment</li>
            <li>No recurring subscription</li>
          </ul>

          <div
            style={{
              background: '#f4f0ff',
              border: '1px solid #dcd3f8',
              borderRadius: '14px',
              padding: '16px 20px',
              textAlign: 'left',
              maxWidth: '450px',
              margin: '0 auto 24px',
            }}
          >
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
                onChange={(e) => setIncludeUpgrade(e.target.checked)}
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
                  Add 100 more sheets (200 total) — +RM10
                </span>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '13px',
                    color: '#65728d',
                    lineHeight: 1.5,
                  }}
                >
                  Double your collection for just RM10 more.
                </p>
              </div>
            </label>
          </div>

          <button
            type="button"
            className="btn"
            onClick={() => onCheckout(includeUpgrade)}
            style={{ width: '100%', maxWidth: '450px' }}
          >
            {includeUpgrade
              ? `Get all 200 sheets — ${bundlePrice} →`
              : `Get my 100 sheets — ${basePrice} →`}
          </button>
          <p className="fine" style={{ margin: '15px 0 0' }}>
            Digital files only. Nothing will be shipped.
          </p>
        </div>
      </div>
    </section>
  );
};
