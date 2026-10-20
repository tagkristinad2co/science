import React from 'react';

interface StickyBarProps {
  onCheckout: () => void;
  price?: string;
}

export const StickyBar: React.FC<StickyBarProps> = ({ onCheckout, price = '$12.99' }) => {
  return (
    <div className="sticky">
      <div>
        <strong style={{ color: '#101d3d' }}>50 science sheets</strong>
        <div className="fine">Only {price} USD</div>
      </div>
      <button
        type="button"
        className="btn"
        onClick={onCheckout}
      >
        Get the pack →
      </button>
    </div>
  );
};
