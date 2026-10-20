import React, { useEffect } from 'react';

export type PolicyType = 'privacy' | 'terms' | 'refund' | 'contact' | null;

interface PolicyModalProps {
  type: PolicyType;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ type, onClose }) => {
  useEffect(() => {
    if (type) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [type, onClose]);

  if (!type) return null;

  const content = {
    privacy: {
      title: 'Privacy Policy',
      body: (
        <>
          <p>
            At <strong>Science Made Visual</strong>, your privacy is paramount.
            We do not sell, rent, or trade your personal information. When you
            request free samples or join our community, your email address is
            used strictly to send the study material and optional educational updates you requested.
          </p>
          <p>
            You may unsubscribe from email updates at any time with a single click.
            Payment processing is securely handled by independent, PCI-compliant payment gateways.
            We never store or view your credit card details on our servers.
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
            Because this is an instantly downloadable digital product with comprehensive
            free samples available before purchase, please review the free 5-sheet sample
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
          <p>
            You can reach our team at:{' '}
            <a
              href="mailto:support@sciencemadevisual.com"
              style={{ color: 'var(--purple)', fontWeight: 700, textDecoration: 'underline' }}
            >
              support@sciencemadevisual.com
            </a>
          </p>
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
