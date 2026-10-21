import React from 'react';

export const WhyItWorks: React.FC = () => {
  const reasons = [
    'One topic per page — easy to find, easy to revise',
    'Diagrams and labels show how ideas connect',
    'Print for the study table, or view on a phone or tablet',
    'Great alongside school lessons, tuition or homeschooling',
  ];

  return (
    <section className="section navy">
      <div className="ebook-shell center">
        <h2>Why visual sheets work</h2>
        <div className="benefit-list">
          {reasons.map((text, i) => (
            <div key={i} className="benefit-item">
              <span className="benefit-icon" aria-hidden="true">
                ✓
              </span>
              <span style={{ fontSize: '15px', color: '#fff', lineHeight: 1.5, fontWeight: 500 }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
