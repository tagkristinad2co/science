import React from 'react';
import { GALLERY_SHEETS, SheetPreview } from '../data/content';

interface GalleryProps {
  onSelectSheet: (sheet: SheetPreview) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ onSelectSheet }) => {
  return (
    <section className="section alt" id="inside">
      <div className="shell">
        <div className="center">
          <div className="mini-title">Real pages from the collection</div>
          <h2>Here's what your science pack looks like.</h2>
          <p className="section-intro">
            Explore genuine page previews from the uploaded 50-sheet collection.
            Tap any sheet to enlarge it. Online previews are watermarked; your
            purchased PDFs are not.
          </p>
        </div>
        <div className="gallery" id="gallery">
          {GALLERY_SHEETS.map((sheet) => (
            <button
              key={sheet.id}
              type="button"
              className="page"
              onClick={() => onSelectSheet(sheet)}
              aria-label={`Preview ${sheet.alt}`}
            >
              <img
                loading="lazy"
                src={sheet.image}
                alt={sheet.alt}
              />
              <span>{sheet.title}</span>
            </button>
          ))}
        </div>
        <p className="fine center" style={{ marginTop: '20px' }}>
          This is a supplementary science resource and is not represented as
          certified curriculum-aligned material.
        </p>
      </div>
    </section>
  );
};
