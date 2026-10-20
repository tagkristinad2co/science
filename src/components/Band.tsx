import React from 'react';

interface BandProps {
  onGoToSample: () => void;
}

export const Band: React.FC<BandProps> = ({ onGoToSample }) => {
  return (
    <section className="band">
      <div className="shell band-inner">
        <div>
          <h2 style={{ marginBottom: '8px' }}>Want to try before you buy?</h2>
          <p>Get five real sample sheets from the collection, free.</p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={onGoToSample}
        >
          Get 5 free science sheets →
        </button>
      </div>
    </section>
  );
};
