import React from 'react';
import { PolicyType } from './PolicyModal';

interface FooterProps {
  currentView: 'home' | 'sample';
  onNavigate: (view: 'home' | 'sample', hash?: string) => void;
  onOpenPolicy: (type: PolicyType) => void;
}

export const Footer: React.FC<FooterProps> = ({ currentView, onNavigate, onOpenPolicy }) => {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <div>
          <button
            type="button"
            className="brand"
            onClick={() => onNavigate('home')}
            style={{ cursor: 'pointer' }}
          >
            <span className="brand-symbol">✦</span>
            <span>
              SCIENCE<br />MADE VISUAL
            </span>
          </button>
          <p className="fine" style={{ maxWidth: '400px', color: '#b9c4d8', marginTop: '15px' }}>
            Illustrated learning resources for science explorers worldwide. Digital
            supplement, not a replacement for school instruction.
          </p>
        </div>
        <div className="footer-nav">
          {currentView === 'home' ? (
            <>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => onNavigate('sample')}
              >
                Free sample
              </button>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => onNavigate('home', 'faq')}
              >
                FAQ
              </button>
            </>
          ) : (
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => onNavigate('home')}
            >
              Home
            </button>
          )}
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
