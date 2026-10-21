import React from 'react';
import { CountdownState } from '../hooks/useFoundingTimer';

interface NavbarProps {
  onScrollTo: (hash: string) => void;
  countdown: CountdownState;
  allowsCards?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onScrollTo, countdown, allowsCards = false }) => {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>

      {/* 1. Top bar */}
      <div className="top-bar">
        {countdown.isFounding ? (
          <>
            🚀 Founding price ends in <b>{countdown.formattedTime}</b> · {countdown.endDateText}
          </>
        ) : (
          <>
            🇲🇾 Made for Malaysian families · Instant PDF download · Pay with{' '}
            {allowsCards ? 'FPX or card' : 'FPX online banking'}
          </>
        )}
      </div>

      <header>
        <div className="shell nav" aria-label="Main navigation">
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
          <div className="navlinks">
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => onScrollTo('inside')}
            >
              What's inside
            </button>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => onScrollTo('faq')}
            >
              FAQ
            </button>
            <button
              type="button"
              className="btn"
              style={{ minHeight: '44px', padding: '10px 18px', fontSize: '13px' }}
              onClick={() => onScrollTo('pricing')}
            >
              Get the sheets →
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
