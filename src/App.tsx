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

  // Sync title and meta description for both pages
  useEffect(() => {
    if (currentView === 'home') {
      document.title = 'Science Made Visual | 100 Illustrated Science Study Sheets';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          'Discover 100 colorful illustrated science study sheets covering biology, chemistry, physics and Earth science. Printable PDF. RM39.90 one-time.'
        );
      }
    } else {
      document.title = 'Free Science Study Sheets | Science Made Visual';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          'Try 5 free genuine illustrated science study sheets. Printable PDF sample from Science Made Visual.'
        );
      }
    }
  }, [currentView]);

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

  const handleCheckout = (includeUpgrade: boolean = false) => {
    const targetUrl = includeUpgrade ? config.bundleCheckoutUrl : config.checkoutUrl;
    if (isSecureUrl(targetUrl)) {
      window.location.href = targetUrl;
    } else {
      setToastMessage(
        includeUpgrade
          ? 'Checkout is not connected yet. Site owner: add the live payment link to bundleCheckoutUrl in config.js.'
          : 'Checkout is not connected yet. Site owner: add the live payment link to checkoutUrl in config.js.'
      );
    }
  };

  const handleOpenPolicy = (type: PolicyType) => {
    if (!type) return;

    if (type === 'privacy') {
      if (isSecureUrl(config.privacyUrl)) {
        window.location.href = config.privacyUrl;
      } else {
        setToastMessage('This link has not been configured yet. Site owner: update config.js.');
      }
      return;
    }
    if (type === 'terms') {
      if (isSecureUrl(config.termsUrl)) {
        window.location.href = config.termsUrl;
      } else {
        setToastMessage('This link has not been configured yet. Site owner: update config.js.');
      }
      return;
    }
    if (type === 'refund') {
      if (isSecureUrl(config.refundUrl)) {
        window.location.href = config.refundUrl;
      } else {
        setToastMessage('This link has not been configured yet. Site owner: update config.js.');
      }
      return;
    }
    if (type === 'contact') {
      if (isValidEmail(config.supportEmail)) {
        window.location.href = `mailto:${config.supportEmail}`;
      } else {
        setToastMessage('This link has not been configured yet. Site owner: update config.js.');
      }
      return;
    }

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
      />

      {currentView === 'home' ? (
        <main id="main">
          <Hero
            onScrollToPricing={() => handleNavigate('home', 'pricing')}
            onGoToSample={() => handleNavigate('sample')}
            onPreviewImage={handlePreviewCustomImage}
          />
          <Benefits />
          <Gallery onSelectSheet={setActiveSheet} />
          <Band onGoToSample={() => handleNavigate('sample')} />
          <Topics />
          <Pricing
            onCheckout={handleCheckout}
            basePrice={config.productPrice || 'RM39.90'}
            bundlePrice={config.bundlePrice || 'RM49.90'}
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
          onScrollToPricing={() => handleNavigate('home', 'pricing')}
          price={config.productPrice || 'RM39.90'}
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
