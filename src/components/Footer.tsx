import React from 'react';
import { PolicyType } from './PolicyModal';

interface FooterProps {
  onScrollTo: (hash: string) => void;
  onOpenPolicy: (type: PolicyType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollTo, onOpenPolicy }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <div>
          <button
            type="button"
            className="brand"
            onClick={() => onScrollTo('')}
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

        <div className="footer-nav">
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
            onClick={() => onOpenPolicy('terms')}
          >
            Terms
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
      </div>
    </footer>
  );
};
