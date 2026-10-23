import React, { useEffect, useRef } from 'react';
import { config } from '../config';

export type PolicyType = 'privacy' | 'terms' | 'refund' | 'contact' | null;

interface PolicyModalProps {
  type: PolicyType;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ type, onClose }) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!type) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [type]);

  if (!type) return null;

  const content = {
    privacy: {
      title: 'Privacy Policy',
      body: (
        <>
          <p>
            At <strong>Science Made Visual</strong>, your privacy is paramount.
            We do not sell, rent, or trade your personal information. When you
            reach out for support or make a purchase, your contact information is
            used strictly to assist you and process your order.
          </p>
          <p>
            You may unsubscribe from email updates at any time with a single click.
            Payment processing is securely handled by independent, PCI-compliant payment gateways.
            We never store or view your credit card details on our servers.
          </p>
          <p>
            If you buy, your first name and the first letter of your second name may appear in a 'recent purchase' notification on our website for up to 14 days (for example, 'Aisyah R. bought the 200-sheet pack'). We never show your full name, email or phone. Email {config.business.email} if you'd like yours hidden.
          </p>
        </>
      ),
    },
    terms: {
      title: 'Terms of Service',
      body: (
        <>
          <p>
            <strong>Personal Use License:</strong> The Science Made Visual study
            sheets are intended solely for personal, household, and homeschool learning.
            Classroom redistribution, mass copying, public web hosting, and resale of
            these digital files are strictly prohibited.
          </p>
          <p>
            <strong>Supplemental Resource:</strong> These study sheets are created as an
            illustrative visual study aid. They do not claim formal accreditation or alignment
            with any specific government curriculum or examination board.
          </p>
        </>
      ),
    },
    refund: {
      title: 'Refund Policy',
      body: (
        <>
          <p>
            We take pride in the quality and clarity of our illustrated science sheets.
            Because this is an instantly downloadable digital product with genuine
            previews available on the site, please review the preview pages
            to confirm it fits your learner's level before purchasing.
          </p>
          <p>
            If you experience technical issues downloading your files or find a corrupt document,
            please reach out to support and we will ensure you receive your complete pack immediately.
          </p>
        </>
      ),
    },
    contact: {
      title: 'Contact & Support',
      body: (
        <>
          <p>
            Have a question about the collection or need help with your digital download?
          </p>
          {config.supportEmail ? (
            <p>
              You can reach our team at:{' '}
              <a
                href={`mailto:${config.supportEmail}`}
                style={{ color: 'var(--purple)', fontWeight: 700, textDecoration: 'underline' }}
              >
                {config.supportEmail}
              </a>
            </p>
          ) : (
            <p style={{ fontStyle: 'italic', color: '#65728d' }}>
              Contact details coming soon.
            </p>
          )}
          <p>
            We typically respond to learner and parent inquiries within 24–48 hours on business days.
          </p>
        </>
      ),
    },
  }[type];

  return (
    <div
      className="modal open"
      role="dialog"
      aria-modal="true"
      aria-label={content.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="policy-card">
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        <h2>{content.title}</h2>
        {content.body}
        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button
            className="btn"
            style={{ minHeight: '44px', padding: '10px 20px', fontSize: '13px' }}
            onClick={onClose}
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
