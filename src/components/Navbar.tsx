import React from 'react';

interface NavbarProps {
  currentView: 'home' | 'sample';
  onNavigate: (view: 'home' | 'sample', hash?: string) => void;
  onCheckout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onCheckout }) => {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="notice">
        {currentView === 'home' ? (
          <>✨ Printable digital resource · <b>50 illustrated sheets</b> · One-time purchase</>
        ) : (
          <>🎁 Free printable science resources · <b>5 real sheets</b> from our collection</>
        )}
      </div>
      <header>
        <nav className="nav shell" aria-label="Main navigation">
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
          <div className="navlinks">
            {currentView === 'home' ? (
              <>
                <button
                  type="button"
                  className="nav-link-btn"
                  onClick={() => onNavigate('home', 'inside')}
                >
                  What's inside
                </button>
                <button
                  type="button"
                  className="nav-link-btn"
                  onClick={() => onNavigate('home', 'benefits')}
                >
                  Why it works
                </button>
                <button
                  type="button"
                  className="nav-link-btn"
                  onClick={() => onNavigate('home', 'faq')}
                >
                  FAQ
                </button>
                <button
                  type="button"
                  className="nav-link-btn"
                  onClick={() => onNavigate('sample')}
                >
                  Free sample
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={onCheckout}
                >
                  Get the pack →
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="nav-link-btn"
                  onClick={() => onNavigate('home')}
                >
                  Home
                </button>
                <button
                  type="button"
                  className="nav-link-btn"
                  onClick={() => onNavigate('home', 'inside')}
                >
                  Preview 50-sheet pack
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => onNavigate('home', 'pricing')}
                >
                  Shop the collection →
                </button>
              </>
            )}
          </div>
        </nav>
      </header>
    </>
  );
};
