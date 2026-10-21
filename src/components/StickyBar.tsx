import React from 'react';

interface StickyBarProps {
  onScrollToPricing: () => void;
  price100: string;
}

export const StickyBar: React.FC<StickyBarProps> = ({ onScrollToPricing, price100 }) => {
  return (
    <div className="sticky">
      <div>
        <strong style={{ color: '#101d3d', fontSize: '14px', display: 'block' }}>
          100 science sheets
        </strong>
        <div className="fine" style={{ color: 'var(--purple)', fontWeight: 800 }}>
          {price100}
        </div>
      </div>
      <button
        type="button"
        className="btn-lime"
        onClick={onScrollToPricing}
      >
        GET IT →
      </button>
    </div>
  );
};
