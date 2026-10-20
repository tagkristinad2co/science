import React from 'react';

interface PricingProps {
  onCheckout: () => void;
  price?: string;
}

export const Pricing: React.FC<PricingProps> = ({ onCheckout, price = '$12.99' }) => {
  return (
    <section className="section alt" id="pricing">
      <div className="shell">
        <div className="center">
          <div className="mini-title">The Founder's Edition</div>
          <h2>Make science revision more visual.</h2>
          <p className="section-intro">
            Get the 50-sheet edition available today. No subscription, no hidden
            monthly charges.
          </p>
        </div>
        <div className="pricebox">
          <div className="eyebrow">50-sheet digital collection</div>
          <div className="price">
            {price}{' '}
            <span style={{ fontSize: '16px', letterSpacing: 0, color: '#77839d' }}>
              USD
            </span>
          </div>
          <p className="oldnote">One-time purchase · Personal / household study</p>
          <ul className="includes">
            <li>50 original illustrated science PDF sheets</li>
            <li>Biology, chemistry, physics & Earth science topics</li>
            <li>Printable and screen-friendly files</li>
            <li>Instant access after successful payment</li>
            <li>No recurring subscription</li>
          </ul>
          <button
            type="button"
            className="btn"
            onClick={onCheckout}
            style={{ width: '100%', maxWidth: '410px' }}
          >
            Get my science pack — {price} →
          </button>
          <p className="fine" style={{ margin: '15px 0 0' }}>
            Digital files only. Nothing will be shipped. Future 100-sheet edition
            is not included in this offer.
          </p>
        </div>
      </div>
    </section>
  );
};
