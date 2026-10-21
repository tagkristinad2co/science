import React from 'react';

interface HowItWorksProps {
  allowsCards?: boolean;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ allowsCards = false }) => {
  const steps = [
    allowsCards
      ? 'Choose your pack and pay securely with FPX or card.'
      : 'Choose your pack and pay securely with FPX online banking.',
    'Get your download link instantly on screen and by email receipt.',
    'Print or open the sheets and start learning.',
  ];

  return (
    <section className="section alt">
      <div className="ebook-shell center">
        <h2>How it works</h2>
        <div className="steps-grid">
          {steps.map((desc, idx) => (
            <div key={idx} className="step-card">
              <div className="step-badge">{idx + 1}</div>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
