import React from 'react';

export const WhoItIsFor: React.FC = () => {
  const personas = [
    { emoji: '👨‍👩‍👧', title: 'Parents helping at home' },
    { emoji: '🏠', title: 'Homeschool families' },
    { emoji: '🎒', title: 'Students revising on their own' },
  ];

  return (
    <section className="section alt">
      <div className="ebook-shell center">
        <h2>Perfect for</h2>
        <div className="chips-grid">
          {personas.map((p) => (
            <div key={p.title} className="chip-card">
              <div className="chip-emoji">{p.emoji}</div>
              <div className="chip-title">{p.title}</div>
            </div>
          ))}
        </div>
        <p className="fine" style={{ maxWidth: '480px', margin: '20px auto 0' }}>
          Broadly suits upper primary and lower secondary learners. Browse the preview
          pages above to see if it suits your child.
        </p>
      </div>
    </section>
  );
};
