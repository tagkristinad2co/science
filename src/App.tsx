import React, { useState, useEffect } from 'react';
import { defaultConfig, isSecureUrl, isValidEmail, SMVConfig } from './config';
import { SheetPreview } from './data/content';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Benefits } from './components/Benefits';
import { Gallery } from './components/Gallery';
import { Band } from './components/Band';
import { Topics } from './components/Topics';
import { Pricing } from './components/Pricing';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { StickyBar } from './components/StickyBar';
import { PreviewModal } from './components/PreviewModal';
import { PolicyModal, PolicyType } from './components/PolicyModal';
import { FreeSamplePage } from './components/FreeSamplePage';
import { Toast } from './components/Toast';

export const App: React.FC = () => {
  const [config] = useState<SMVConfig>(defaultConfig);
  const [currentView, setCurrentView] = useState<'home' | 'sample'>('home');
  const [activeSheet, setActiveSheet] = useState<SheetPreview | null>(null);
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync hash routing with window location
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'free-sample' || hash === 'sample') {
        setCurrentView('sample');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash) {
        setCurrentView('home');
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigate = (view: 'home' | 'sample', hash?: string) => {
    setCurrentView(view);
    if (view === 'sample') {
      window.location.hash = 'free-sample';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (hash) {
        window.location.hash = hash;
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        window.location.hash = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleCheckout = () => {
    if (isSecureUrl(config.checkoutUrl)) {
      window.location.href = config.checkoutUrl;
    } else {
      setToastMessage(
        'Checkout is not connected yet. Site owner: add the live payment link to checkoutUrl in config.js.'
      );
    }
  };

  const handleOpenPolicy = (type: PolicyType) => {
    if (!type) return;

    if (type === 'privacy' && isSecureUrl(config.privacyUrl)) {
      window.location.href = config.privacyUrl;
      return;
    }
    if (type === 'terms' && isSecureUrl(config.termsUrl)) {
      window.location.href = config.termsUrl;
      return;
    }
    if (type === 'refund' && isSecureUrl(config.refundUrl)) {
      window.location.href = config.refundUrl;
      return;
    }
    if (type === 'contact' && isValidEmail(config.supportEmail)) {
      window.location.href = `mailto:${config.supportEmail}`;
      return;
    }

    // Fallback: Display built-in accessible policy dialog
    setActivePolicy(type);
  };

  const handlePreviewCustomImage = (image: string, title: string, alt: string) => {
    setActiveSheet({
      id: 'custom-preview',
      image,
      title,
      alt,
      category: 'Biology',
    });
  };

  return (
    <div>
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onCheckout={handleCheckout}
      />

      {currentView === 'home' ? (
        <main id="main">
          <Hero
            onCheckout={handleCheckout}
            onGoToSample={() => handleNavigate('sample')}
            onPreviewImage={handlePreviewCustomImage}
          />
          <Benefits />
          <Gallery onSelectSheet={setActiveSheet} />
          <Band onGoToSample={() => handleNavigate('sample')} />
          <Topics />
          <Pricing
            onCheckout={handleCheckout}
            price={config.productPrice || '$12.99'}
          />
          <FAQ />
        </main>
      ) : (
        <FreeSamplePage
          config={config}
          onNavigateHome={(hash) => handleNavigate('home', hash)}
          onOpenPolicy={handleOpenPolicy}
          onPreviewImage={handlePreviewCustomImage}
        />
      )}

      <Footer
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenPolicy={handleOpenPolicy}
      />

      {currentView === 'home' && (
        <StickyBar
          onCheckout={handleCheckout}
          price={config.productPrice || '$12.99'}
        />
      )}

      <PreviewModal
        sheet={activeSheet}
        onClose={() => setActiveSheet(null)}
      />

      <PolicyModal
        type={activePolicy}
        onClose={() => setActivePolicy(null)}
      />

      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
};

export default App;
