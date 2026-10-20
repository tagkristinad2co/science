import React from 'react';

interface HeroProps {
  onScrollToPricing: () => void;
  onGoToSample: () => void;
  onPreviewImage: (image: string, title: string, alt: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onScrollToPricing, onGoToSample, onPreviewImage }) => {
  return (
    <section className="hero">
      <div className="shell hero-inner">
        <div>
          <div className="eyebrow">Visual science learning collection</div>
          <h1>
            Big science ideas.
            <br />
            <em>Made visual.</em>
          </h1>
          <p className="lead">
            Explore fascinating science concepts with 100 colorful, illustrated study
            sheets. Less searching through pages of text. More diagrams, labels and
            ideas to explore at your own pace.
          </p>
          <div className="cta-row">
            <button type="button" className="btn" onClick={onScrollToPricing}>
              Get 100 sheets — RM39.90 →
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onGoToSample}
            >
              Try 5 free sheets
            </button>
          </div>
          <div className="trust">
            <span>Instant digital download</span>
            <span>Pay with FPX online banking or card</span>
            <span>One-time payment</span>
          </div>
        </div>
        <div
          className="visual"
          aria-label="Real previews from the included science sheets"
        >
          <div
            className="stack"
            style={{ cursor: 'pointer' }}
            onClick={() =>
              onPreviewImage(
                '/assets/page-3.webp',
                'Carbon Cycle',
                'Carbon cycle science illustration'
              )
            }
            title="Click to preview sheet"
          >
            <img
              src="/assets/page-3.webp"
              alt="Carbon cycle science illustration"
              loading="eager"
            />
          </div>
          <div
            className="stack"
            style={{ cursor: 'pointer' }}
            onClick={() =>
              onPreviewImage(
                '/assets/page-22.webp',
                'Human Heart',
                'Human heart science illustrated sheet'
              )
            }
            title="Click to preview sheet"
          >
            <img
              src="/assets/page-22.webp"
              alt="Human heart science illustrated sheet"
              loading="eager"
            />
          </div>
          <div
            className="stack"
            style={{ cursor: 'pointer' }}
            onClick={() =>
              onPreviewImage(
                '/assets/page-42.webp',
                'Periodic Table',
                'Periodic table science illustration'
              )
            }
            title="Click to preview sheet"
          >
            <img
              src="/assets/page-42.webp"
              alt="Periodic table science illustration"
              loading="eager"
            />
          </div>
          <div className="float one">🔬 100+ illustrated sheets</div>
          <div className="float two">🌎 Biology · Chemistry · Physics · Earth</div>
        </div>
      </div>
    </section>
  );
};
