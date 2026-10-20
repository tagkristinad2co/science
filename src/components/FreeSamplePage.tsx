import React, { useState } from 'react';
import { SMVConfig, isSecureUrl } from '../config';
import { PolicyType } from './PolicyModal';

interface FreeSamplePageProps {
  config: SMVConfig;
  onNavigateHome: (hash?: string) => void;
  onOpenPolicy: (type: PolicyType) => void;
  onPreviewImage: (image: string, title: string, alt: string) => void;
}

export const FreeSamplePage: React.FC<FreeSamplePageProps> = ({
  config,
  onNavigateHome,
  onOpenPolicy,
  onPreviewImage,
}) => {
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'idle' | 'demo' | 'success' | 'error';
    text: string;
    downloadUrl?: string;
  }>({ type: 'idle', text: '' });

  const isConfigured = isSecureUrl(config.emailFormEndpoint);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfigured) {
      setStatusMessage({
        type: 'demo',
        text: 'Demo mode: no information has been sent or saved. Use the direct PDF link below.',
        downloadUrl: '/downloads/science-made-visual-free-5-sheet-sample.pdf',
      });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: 'idle', text: 'Submitting your request…' });

    try {
      const response = await fetch(config.emailFormEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'science-made-visual-free-sample',
          marketing_consent: marketingConsent,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not submit');
      }

      setStatusMessage({
        type: 'success',
        text: 'Thank you! Your sample is ready.',
        downloadUrl: '/downloads/science-made-visual-free-5-sheet-sample.pdf',
      });
      setEmail('');
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'We could not submit your request. Please try again or use the sample download below.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main">
      <section className="sample-hero">
        <div className="shell sample-layout">
          <div>
            <div className="eyebrow">Free visual science sample</div>
            <h1>
              Explore science.
              <br />
              <em>On us.</em>
            </h1>
            <p className="lead">
              Download five beautifully illustrated science study sheets covering the
              carbon cycle, acids & bases, the human heart, electric current and the
              periodic table.
            </p>
            <div className="sample-strip" aria-label="Genuine sample page previews">
              <img
                src="/assets/page-3.webp"
                alt="Carbon cycle sample preview"
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  onPreviewImage(
                    '/assets/page-3.webp',
                    'Carbon cycle',
                    'Carbon cycle sample preview'
                  )
                }
              />
              <img
                src="/assets/page-22.webp"
                alt="Human heart sample preview"
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  onPreviewImage(
                    '/assets/page-22.webp',
                    'Human heart',
                    'Human heart sample preview'
                  )
                }
              />
              <img
                src="/assets/page-42.webp"
                alt="Periodic table sample preview"
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  onPreviewImage(
                    '/assets/page-42.webp',
                    'Periodic table',
                    'Periodic table sample preview'
                  )
                }
              />
            </div>
            <div className="trust" style={{ marginTop: '32px' }}>
              <span>Five real science sheets</span>
              <span>Printable PDF</span>
              <span>No purchase required</span>
            </div>
          </div>

          <div className="formcard">
            <h2 style={{ fontSize: '31px' }}>Get your free 5-sheet pack</h2>
            <p style={{ color: '#65728d' }}>
              Enter your email to receive access to your printable study samples. No
              credit card needed.
            </p>

            <form id="lead-form" onSubmit={handleSubmit}>
              <label htmlFor="lead-email">Email address</label>
              <input
                id="lead-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="checkline" style={{ fontWeight: 'normal' }}>
                <input
                  id="marketing-consent"
                  type="checkbox"
                  name="marketing_consent"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                />
                <span>
                  I'd also like occasional emails about science learning resources
                  and product releases. I can unsubscribe anytime.
                </span>
              </label>

              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Submitting…' : 'Send my free science sheets →'}
              </button>

              <div
                className="form-status"
                id="lead-status"
                role="status"
                aria-live="polite"
              >
                {statusMessage.text && (
                  <div>
                    {statusMessage.text}{' '}
                    {statusMessage.downloadUrl && (
                      <a
                        href={statusMessage.downloadUrl}
                        download
                        style={{
                          textDecoration: 'underline',
                          fontWeight: 700,
                          color: 'var(--purple)',
                          display: 'inline-block',
                          marginTop: '6px',
                        }}
                      >
                        Download your five science sheets →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </form>

            <p className="fine">
              Your sample is free regardless of whether you opt in to marketing. Read
              our{' '}
              <button
                type="button"
                onClick={() => onOpenPolicy('privacy')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  textDecoration: 'underline',
                  color: 'inherit',
                  font: 'inherit',
                  cursor: 'pointer',
                }}
              >
                privacy policy
              </button>
              .
            </p>

            {!isConfigured && (
              <div className="alert" id="demo-warning">
                <b>Email setup required.</b> The form is in demo mode until an email
                integration is connected. You can still download the sample below.
              </div>
            )}

            <a
              href="/downloads/science-made-visual-free-5-sheet-sample.pdf"
              download
              id="fallback-download"
              style={{
                display: 'block',
                marginTop: '14px',
                textDecoration: 'underline',
                color: '#6340d4',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Download sample PDF directly (free 5 sheets)
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell center">
          <div className="mini-title">Love your free sample?</div>
          <h2>There's more science to explore.</h2>
          <p className="section-intro">
            The 50-sheet Founder's Edition is ready for more exciting topics from
            biology, chemistry, physics and Earth science.
          </p>
          <button
            type="button"
            className="btn"
            onClick={() => onNavigateHome('pricing')}
          >
            See the full 50-sheet collection — {config.productPrice || '$12.99'} →
          </button>
        </div>
      </section>
    </main>
  );
};
