import React, { useState, useEffect, useCallback } from 'react';
import { config, isSecureUrl } from './config';
import { SheetPreview, getFaqItems } from './data/content';
import { useFoundingTimer } from './hooks/useFoundingTimer';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SoundFamiliar } from './components/SoundFamiliar';
import { WhatInside } from './components/WhatInside';
import { WhyItWorks } from './components/WhyItWorks';
import { WhoItIsFor } from './components/WhoItIsFor';
import { Pricing } from './components/Pricing';
import { HowItWorks } from './components/HowItWorks';
import { Reviews } from './components/Reviews';
import { RefundPromise } from './components/RefundPromise';
import { FAQ } from './components/FAQ';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { StickyBar } from './components/StickyBar';
import { PreviewModal } from './components/PreviewModal';
import { PolicyModal, PolicyType } from './components/PolicyModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ThankYouPage } from './components/ThankYouPage';
import { Toast } from './components/Toast';

export const App: React.FC = () => {
  const countdown = useFoundingTimer();
  const [activeSheet, setActiveSheet] = useState<SheetPreview | null>(null);
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic payment methods from server
  const [allowsCards, setAllowsCards] = useState(false);

  useEffect(() => {
    fetch('/api/payment-methods')
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.allowsCards === 'boolean') {
          setAllowsCards(d.allowsCards);
        }
      })
      .catch((err) => console.warn('[App] Could not load payment methods:', err));
  }, []);

  // View state: main sales page or /thank-you confirmation
  const [isThankYouView, setIsThankYouView] = useState(() => {
    return (
      window.location.pathname.startsWith('/thank-you') ||
      window.location.hash.startsWith('#thank-you')
    );
  });

  // toyyibPay checkout modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<'100' | '200'>('100');
  const [checkoutDisplayPrice, setCheckoutDisplayPrice] = useState<string>('');

  // Dynamic pricing based on founding state
  const currentTier = countdown.isFounding ? config.founding : config.official;
  const price100 = currentTier.price100;
  const price200 = currentTier.price200;
  const upgrade = currentTier.upgrade;
  const futurePrice100 = config.official.price100;
  const futurePrice200 = config.official.price200;

  const perSheet100 = countdown.isFounding
    ? 'about RM0.40 per sheet'
    : 'about RM0.60 per sheet';
  const perSheet200 = countdown.isFounding
    ? 'about RM0.25 per sheet with 200'
    : 'about RM0.40 per sheet with 200';

  // Handle routing, redirects, and hash changes
  useEffect(() => {
    if (window.location.pathname.includes('free-sample')) {
      window.history.replaceState(null, '', '/');
    }

    if (window.location.pathname.startsWith('/thank-you')) {
      setIsThankYouView(true);
    }

    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'free-sample' || hash === 'sample') {
        window.history.replaceState(null, '', '/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === 'thank-you') {
        setIsThankYouView(true);
      } else if (hash) {
        setIsThankYouView(false);
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

  // Sync document title and meta description
  useEffect(() => {
    if (isThankYouView) {
      document.title = 'Thank You | Science Made Visual';
      return;
    }

    document.title = 'Science Made Visual | 100 Illustrated Science Study Sheets';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Discover 100 colourful illustrated science study sheets covering biology, chemistry, physics and Earth science. Printable PDF, instant download.'
      );
    }
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute(
        'content',
        'Discover 100 colourful illustrated science study sheets covering biology, chemistry, physics and Earth science. Printable PDF, instant download.'
      );
    }
  }, [isThankYouView]);

  const handleScrollTo = (hash: string) => {
    if (isThankYouView) {
      setIsThankYouView(false);
      window.history.pushState(null, '', `/#${hash}`);
    }

    if (!hash) {
      window.history.replaceState(null, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.location.hash = hash;
    setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleScrollToPricing = () => {
    handleScrollTo('pricing');
  };

  const handleCheckout = (includeUpgrade: boolean = false) => {
    const pack = includeUpgrade ? '200' : '100';
    const price = includeUpgrade ? price200 : price100;
    setSelectedPack(pack);
    setCheckoutDisplayPrice(price);
    setCheckoutModalOpen(true);
  };

  const handleOpenPolicy = (type: PolicyType) => {
    if (!type) return;

    if (type === 'privacy') {
      if (isSecureUrl(config.privacyUrl)) {
        window.open(config.privacyUrl, '_blank', 'noopener,noreferrer');
      } else {
        setToastMessage('This link has not been configured yet. Site owner: update config.ts.');
      }
      return;
    }
    if (type === 'terms') {
      if (isSecureUrl(config.termsUrl)) {
        window.open(config.termsUrl, '_blank', 'noopener,noreferrer');
      } else {
        setToastMessage('This link has not been configured yet. Site owner: update config.ts.');
      }
      return;
    }
    if (type === 'refund') {
      if (isSecureUrl(config.refundUrl)) {
        window.open(config.refundUrl, '_blank', 'noopener,noreferrer');
      } else {
        setToastMessage('This link has not been configured yet. Site owner: update config.ts.');
      }
      return;
    }
    if (type === 'contact') {
      setActivePolicy('contact');
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

  const handleBackToHomeFromThankYou = () => {
    window.history.pushState(null, '', '/');
    setIsThankYouView(false);
    setTimeout(() => {
      const el = document.getElementById('pricing');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCloseCheckoutModal = useCallback(() => {
    setCheckoutModalOpen(false);
  }, []);

  const handleClosePreviewModal = useCallback(() => {
    setActiveSheet(null);
  }, []);

  const handleClosePolicyModal = useCallback(() => {
    setActivePolicy(null);
  }, []);

  const handleCloseToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const faqItems = getFaqItems(
    countdown.isFounding,
    countdown.endDateText,
    upgrade,
    price200,
    allowsCards
  );

  return (
    <div>
      {/* 1. Top bar & Header */}
      <Navbar
        onScrollTo={handleScrollTo}
        countdown={countdown}
        allowsCards={allowsCards}
      />

      {isThankYouView ? (
        <ThankYouPage onBackToHome={handleBackToHomeFromThankYou} />
      ) : (
        <main id="main">
          {/* 2. Hero with Mockup & Offer box */}
          <Hero
            onScrollToPricing={handleScrollToPricing}
            onPreviewImage={handlePreviewCustomImage}
            price100={price100}
            perSheet100={perSheet100}
            futurePrice100={futurePrice100}
            countdown={countdown}
            allowsCards={allowsCards}
          />

          {/* 3. Sound familiar? */}
          <SoundFamiliar />

          {/* 4. What's inside */}
          <WhatInside
            onSelectSheet={setActiveSheet}
            onScrollToPricing={handleScrollToPricing}
            price100={price100}
          />

          {/* 5. Why it works (navy section) */}
          <WhyItWorks />

          {/* 6. Who it's for */}
          <WhoItIsFor />

          {/* 7. Pricing / offer */}
          <Pricing
            onCheckout={handleCheckout}
            price100={price100}
            price200={price200}
            upgrade={upgrade}
            futurePrice100={futurePrice100}
            futurePrice200={futurePrice200}
            perSheet100={perSheet100}
            perSheet200={perSheet200}
            countdown={countdown}
            allowsCards={allowsCards}
          />

          {/* 8. How it works */}
          <HowItWorks allowsCards={allowsCards} />

          {/* 9. Reviews (hidden when config.testimonials is empty) */}
          <Reviews testimonials={config.testimonials} />

          {/* 10. Refund promise */}
          <RefundPromise
            refundSummary={config.refundSummary}
            onOpenRefundPolicy={() => handleOpenPolicy('refund')}
          />

          {/* 11. FAQ */}
          <FAQ items={faqItems} />

          {/* 12. Final CTA (navy) */}
          <FinalCTA
            onScrollToPricing={handleScrollToPricing}
            price100={price100}
            countdown={countdown}
            allowsCards={allowsCards}
          />
        </main>
      )}

      {/* 13. Footer */}
      <Footer
        onScrollTo={handleScrollTo}
        onOpenPolicy={handleOpenPolicy}
      />

      {/* 14. Mobile sticky bar (below 600px) */}
      {!isThankYouView && (
        <StickyBar
          onScrollToPricing={handleScrollToPricing}
          price100={price100}
        />
      )}

      <PreviewModal
        sheet={activeSheet}
        onClose={handleClosePreviewModal}
        onScrollToPricing={handleScrollToPricing}
      />

      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={handleCloseCheckoutModal}
        pack={selectedPack}
        displayPrice={checkoutDisplayPrice}
        allowsCards={allowsCards}
      />

      <PolicyModal
        type={activePolicy}
        onClose={handleClosePolicyModal}
      />

      <Toast
        message={toastMessage}
        onClose={handleCloseToast}
      />
    </div>
  );
};

export default App;
