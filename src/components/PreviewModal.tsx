import React, { useEffect, useRef } from 'react';
import { SheetPreview } from '../data/content';

interface PreviewModalProps {
  sheet: SheetPreview | null;
  onClose: () => void;
  onScrollToPricing: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  sheet,
  onClose,
  onScrollToPricing,
}) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const hasSheet = Boolean(sheet);

  // 1. Focus effect: runs ONLY once when the modal opens
  useEffect(() => {
    if (hasSheet) {
      const timer = setTimeout(() => closeBtnRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [hasSheet]);

  // 2. Escape key and body scroll lock: independent of onClose reference
  useEffect(() => {
    if (!sheet) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sheet]);

  if (!sheet) return null;

  const handlePricingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    onScrollToPricing();
  };

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

      <div style={{ textAlign: 'center', width: '100%', maxWidth: '800px' }}>
        <div
          className="lightbox-card"
          style={{ margin: '0 auto', position: 'relative' }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Watermark overlay across the entire sheet */}
          <div
            className="watermark-overlay"
            aria-hidden="true"
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Protected image */}
          <img
            src={sheet.image}
            alt={sheet.alt}
            draggable={false}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '82vh',
              objectFit: 'contain',
              display: 'block',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Bottom 50% Heavy Blur & Centred Call to Action */}
          <div
            className="lightbox-blur-overlay"
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="lightbox-label">
              🔒 Full sheet included in the pack
            </div>
            <button
              type="button"
              className="btn-lime-sm"
              onClick={handlePricingClick}
            >
              See pricing →
            </button>
          </div>
        </div>

        <div
          style={{
            color: '#fff',
            marginTop: '12px',
            fontSize: '14px',
            fontWeight: 600,
            textShadow: '0 2px 6px rgba(0,0,0,0.7)',
          }}
        >
          {sheet.title} ({sheet.category}) — <span style={{ opacity: 0.85 }}>Watermarked preview</span>
        </div>
      </div>
    </div>
  );
};
