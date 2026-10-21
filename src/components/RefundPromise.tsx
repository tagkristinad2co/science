import React from 'react';

interface RefundPromiseProps {
  refundSummary: string;
  onOpenRefundPolicy: () => void;
}

export const RefundPromise: React.FC<RefundPromiseProps> = ({
  refundSummary,
  onOpenRefundPolicy,
}) => {
  return (
    <section className="section">
      <div className="ebook-shell center">
        <div className="promise-card">
          <div className="promise-shield" aria-hidden="true">
            🛡️
          </div>
          <h2>Our promise</h2>
          <p style={{ fontSize: '15px', color: '#5a667f', lineHeight: 1.65, margin: '14px 0 16px' }}>
            {refundSummary}
          </p>
          <button
            type="button"
            onClick={onOpenRefundPolicy}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--purple)',
              fontWeight: 700,
              textDecoration: 'underline',
              fontSize: '14px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Read our full refund policy →
          </button>
        </div>
      </div>
    </section>
  );
};
