import React from 'react';

interface StickyBarProps {
  onScrollToPricing: () => void;
  price?: string;
}

export const StickyBar: React.FC<StickyBarProps> = ({ onScrollToPricing, price = 'RM39.90' }) => {
  return (
    <div className="sticky">
      <div>
        <strong style={{ color: '#101d3d' }}>100 science sheets</strong>
        <div className="fine">From {price}</div>
      </div>
      <button
        type="button"
        className="btn"
        onClick={onScrollToPricing}
      >
        Get the pack →
      </button>
    </div>
  );
};
