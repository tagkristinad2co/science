import React from 'react';
import { PolicyType } from './PolicyModal';
import { BusinessDetailsLine } from './PolicyValue';

interface FooterProps {
  onScrollTo: (hash: string) => void;
  onOpenPolicy: (type: PolicyType) => void;
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollTo, onOpenPolicy, onNavigate }) => {
  const currentYear = new Date().getFullYear();

  const handlePageNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <footer className="footer">
      <div className="shell footer-inner" style={{ alignItems: 'flex-start' }}>
        <div>
          <button
            type="button"
            className="brand"
            onClick={() => (onNavigate ? onNavigate('/') : onScrollTo(''))}
            style={{ cursor: 'pointer' }}
          >
            <span className="brand-symbol">✦</span>
            <span>
              SCIENCE<br />MADE VISUAL
            </span>
          </button>
          <p className="fine" style={{ maxWidth: '400px', color: '#b9c4d8', marginTop: '14px' }}>
            Illustrated learning resources for science explorers. Digital supplement,
            not a replacement for school instruction.
          </p>
          <div style={{ fontSize: '12px', color: '#8896ab', marginTop: '10px' }}>
            © {currentYear} Science Made Visual
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div className="footer-nav" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => onScrollTo('faq')}
            >
              FAQ
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => onOpenPolicy('privacy')}
            >
              Privacy
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handlePageNavigate('/terms')}
            >
              Terms & Conditions
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handlePageNavigate('/booking-policy')}
            >
              Booking Policy
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handlePageNavigate('/payment-policy')}
            >
              Payment Policy
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handlePageNavigate('/security-policy')}
            >
              Security Policy
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => onOpenPolicy('refund')}
            >
              Refund policy
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => onOpenPolicy('contact')}
            >
              Contact
            </button>
          </div>

          <BusinessDetailsLine style={{ marginTop: '10px', textAlign: 'right' }} />
        </div>
      </div>
    </footer>
  );
};
