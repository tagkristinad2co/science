import React, { useEffect, useRef } from 'react';
import { SheetPreview } from '../data/content';

interface PreviewModalProps {
  sheet: SheetPreview | null;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ sheet, onClose }) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (sheet) {
      document.body.style.overflow = 'hidden';
      closeBtnRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [sheet, onClose]);

  if (!sheet) return null;

  return (
    <div
      className="modal open"
      id="preview-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Science sheet preview: ${sheet.title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <button
        ref={closeBtnRef}
        className="close"
        aria-label="Close preview"
        onClick={onClose}
      >
        ×
      </button>
      <div style={{ textAlign: 'center', maxWidth: 'min(90vw, 850px)' }}>
        <img
          src={sheet.image}
          alt={sheet.alt}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        <div
          style={{
            color: '#fff',
            marginTop: '12px',
            fontSize: '14px',
            fontWeight: 600,
            textShadow: '0 2px 6px rgba(0,0,0,0.6)',
          }}
        >
          {sheet.title} ({sheet.category}) — <span style={{ opacity: 0.85 }}>Watermarked online preview</span>
        </div>
      </div>
    </div>
  );
};
