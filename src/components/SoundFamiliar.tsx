import React from 'react';

export const SoundFamiliar: React.FC = () => {
  const painPoints = [
    "Your child reads the textbook chapter… and still can't explain it.",
    'Pages of text, few pictures — science starts to feel boring.',
    'Exam season comes and revision notes are all over the place.',
    "You want to help at home, but don't know where to start.",
  ];

  return (
    <section className="section alt">
      <div className="ebook-shell center">
        <h2>Does this sound familiar?</h2>
        <div className="pain-list">
          {painPoints.map((text, i) => (
            <div key={i} className="pain-item">
              <span className="pain-icon" aria-hidden="true">
                ✕
              </span>
              <span style={{ fontSize: '15px', color: 'var(--navy)', lineHeight: 1.5, fontWeight: 500 }}>
                {text}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '17px', fontWeight: 800, color: 'var(--navy)', marginTop: '24px', lineHeight: 1.5 }}>
          Science is easier when you can see it. That's why we made Science Made Visual.
        </p>
      </div>
    </section>
  );
};
