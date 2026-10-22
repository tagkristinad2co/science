import React, { useEffect } from 'react';
import { Footer } from './Footer';
import { PolicyType } from './PolicyModal';

export interface TocItem {
  id: string;
  title: string;
}

interface PolicyPageLayoutProps {
  title: string;
  lastUpdated: string;
  intro?: string;
  toc: TocItem[];
  children: React.ReactNode;
  onNavigate: (path: string) => void;
  onOpenPolicy: (type: PolicyType) => void;
}

export const PolicyPageLayout: React.FC<PolicyPageLayoutProps> = ({
  title,
  lastUpdated,
  intro,
  toc,
  children,
  onNavigate,
  onOpenPolicy,
}) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f7f9ff' }}>
      {/* Header */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          className="shell"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '14px',
            paddingBottom: '14px',
          }}
        >
          <button
            type="button"
            className="brand"
            onClick={() => onNavigate('/')}
            style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          >
            <span className="brand-symbol">✦</span>
            <span>
              SCIENCE<br />MADE VISUAL
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--purple)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Back to Science Made Visual
          </button>
        </div>
      </header>

      {/* Main Content Card */}
      <main style={{ flex: 1, padding: '48px 16px 80px' }}>
        <article
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e1e9f5',
            boxShadow: '0 4px 24px rgba(16, 29, 61, 0.05)',
            padding: '40px 36px',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#2d3748',
            lineHeight: 1.7,
            fontSize: '16px',
          }}
        >
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 900,
              color: 'var(--navy)',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>

          <div
            style={{
              fontSize: '14px',
              color: '#65728d',
              marginBottom: '28px',
              fontWeight: 500,
            }}
          >
            Last updated: {lastUpdated}
          </div>

          {intro && (
            <p
              style={{
                fontSize: '16px',
                fontStyle: 'italic',
                color: '#4a5568',
                marginBottom: '28px',
                background: '#f8fafc',
                padding: '12px 18px',
                borderRadius: '8px',
                borderLeft: '4px solid var(--purple)',
              }}
            >
              {intro}
            </p>
          )}

          {/* Table of contents */}
          {toc.length > 0 && (
            <nav
              aria-label="Table of contents"
              style={{
                background: '#f0f4fd',
                border: '1px solid #dbe5f7',
                borderRadius: '12px',
                padding: '20px 24px',
                marginBottom: '36px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--navy)',
                  marginBottom: '12px',
                }}
              >
                Contents
              </div>
              <ol
                style={{
                  margin: 0,
                  paddingLeft: '20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '8px 16px',
                  fontSize: '14px',
                }}
              >
                {toc.map((item, idx) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      style={{
                        color: 'var(--purple)',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      {idx + 1}. {item.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Policy Body */}
          <div className="policy-body-content" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {children}
          </div>

          {/* Bottom Back Link */}
          <div
            style={{
              marginTop: '48px',
              paddingTop: '24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={() => onNavigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--purple)',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ← Back to Science Made Visual
            </button>

            <span style={{ fontSize: '12px', color: '#8896ab' }}>
              These policies apply to purchases made on science.bloxmath.quest.
            </span>
          </div>
        </article>
      </main>

      {/* Footer */}
      <Footer
        onScrollTo={(hash) => {
          onNavigate(`/#${hash}`);
        }}
        onOpenPolicy={onOpenPolicy}
        onNavigate={onNavigate}
      />
    </div>
  );
};
