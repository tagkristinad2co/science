import React from 'react';
import { Testimonial } from '../config';

interface ReviewsProps {
  testimonials: Testimonial[];
}

export const Reviews: React.FC<ReviewsProps> = ({ testimonials }) => {
  // When testimonials array is empty, section must not render at all
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section className="section alt">
      <div className="ebook-shell center">
        <h2>What parents & students say</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '28px' }}>
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                textAlign: 'left',
              }}
            >
              <p style={{ fontStyle: 'italic', marginBottom: '12px', color: 'var(--navy)' }}>
                "{t.text}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {t.photo && (
                  <img
                    src={t.photo}
                    alt={t.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                )}
                <strong style={{ color: 'var(--purple)', fontSize: '14px' }}>{t.name}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
