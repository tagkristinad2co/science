import React from 'react';
import { GALLERY_SHEETS, SheetPreview } from '../data/content';

interface WhatInsideProps {
  onSelectSheet: (sheet: SheetPreview) => void;
  onScrollToPricing: () => void;
  price100: string;
}

export const WhatInside: React.FC<WhatInsideProps> = ({
  onSelectSheet,
  onScrollToPricing,
  price100,
}) => {
  const subjects = [
    {
      emoji: '🧬',
      title: 'Biology',
      desc: 'Human heart, cells, enzymes, respiration and more',
    },
    {
      emoji: '⚗️',
      title: 'Chemistry',
      desc: 'Acids & bases, periodic table, bonding',
    },
    {
      emoji: '⚡',
      title: 'Physics',
      desc: 'Electricity, magnetism, light, sound',
    },
    {
      emoji: '🌋',
      title: 'Earth science',
      desc: 'Fossils, rock cycle, climate',
    },
  ];

  return (
    <section className="section" id="inside">
      <div className="wide-shell center">
        <div className="ebook-shell" style={{ padding: 0 }}>
          <h2>What's inside the pack</h2>
          <div className="areas-grid">
            {subjects.map((s) => (
              <div key={s.title} className="area-card">
                <div className="emoji">{s.emoji}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>

          <p style={{ color: '#5a667f', fontSize: '15px', marginBottom: '24px' }}>
            Real pages from the collection. Tap to enlarge. Online previews are
            watermarked; your PDFs are not.
          </p>
        </div>

        {/* 10-image preview gallery */}
        <div className="gallery" id="gallery">
          {GALLERY_SHEETS.map((sheet) => (
            <button
              key={sheet.id}
              type="button"
              className="page"
              onClick={() => onSelectSheet(sheet)}
              aria-label={`Preview ${sheet.alt}`}
            >
              <div
                className="protected-preview"
                onContextMenu={(e) => e.preventDefault()}
                style={{ borderRadius: '7px', width: '100%', position: 'relative' }}
              >
                <div
                  className="watermark-overlay"
                  aria-hidden="true"
                  onContextMenu={(e) => e.preventDefault()}
                />
                <img
                  loading="lazy"
                  src={sheet.image}
                  alt={sheet.alt}
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
              <span>{sheet.title}</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: '36px' }}>
          <button
            type="button"
            className="btn-lime"
            onClick={onScrollToPricing}
            style={{ maxWidth: '440px', width: '100%' }}
          >
            GET ALL 100 SHEETS — {price100} →
          </button>
        </div>
      </div>
    </section>
  );
};
