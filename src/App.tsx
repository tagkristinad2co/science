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
import { SocialProofPopup } from './components/SocialProofPopup';

// Policy Pages
import { TermsPage } from './pages/TermsPage';
import { BookingPolicyPage } from './pages/BookingPolicyPage';
import { PaymentPolicyPage } from './pages/PaymentPolicyPage';
import { SecurityPolicyPage } from './pages/SecurityPolicyPage';

// Manual Payment & Admin Pages
import { ManualOrderPage } from './pages/ManualOrderPage';
import { AdminPage } from './pages/AdminPage';
import { checkQrImages } from './utils/qrCheck';

type AppRoute =
  | 'home'
  | 'thank-you'
  | 'terms'
  | 'booking-policy'
  | 'payment-policy'
  | 'security-policy'
  | 'order'
  | 'admin';

interface RouteState {
  route: AppRoute;
  orderId?: string;
  token?: string;
}

function getRouteFromLocation(): RouteState {
  const path = window.location.pathname.replace(/\/+$/, '');
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('t') || searchParams.get('token') || '';

  if (path === '/admin') {
    return { route: 'admin' };
  }

  if (path.startsWith('/order/')) {
    const orderId = path.replace('/order/', '').trim();
    return { route: 'order', orderId, token };
  }

  const hash = window.location.hash.replace('#', '');
  if (path === '/terms' || hash === 'terms') return { route: 'terms' };
  if (path === '/booking-policy' || hash === 'booking-policy') return { route: 'booking-policy' };
  if (path === '/payment-policy' || hash === 'payment-policy') return { route: 'payment-policy' };
  if (path === '/security-policy' || hash === 'security-policy') return { route: 'security-policy' };
  if (path.startsWith('/thank-you') || hash.startsWith('thank-you')) return { route: 'thank-you' };
  return { route: 'home' };
}

export const App: React.FC = () => {
  const countdown = useFoundingTimer();
  const [activeSheet, setActiveSheet] = useState<SheetPreview | null>(null);
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic payment methods from server
  const [allowsCards, setAllowsCards] = useState(false);

  // QR availability check on load
  const [qrAvailable, setQrAvailable] = useState(false);

  useEffect(() => {
    fetch('/api/payment-methods')
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.allowsCards === 'boolean') {
          setAllowsCards(d.allowsCards);
        }
      })
      .catch((err) => console.warn('[App] Could not load payment methods:', err));

    checkQrImages().then((res) => {
      const urlParams = new URLSearchParams(window.location.search);
      const forced = urlParams.get('manual') === '1';
      setQrAvailable(res.anyAvailable || forced);
    });
  }, []);

  // View state / Routing
  const [routeState, setRouteState] = useState<RouteState>(getRouteFromLocation);
  const currentRoute = routeState.route;

  // Checkout modal state
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

  // Navigation handler
  const handleNavigate = useCallback((path: string) => {
    if (path.startsWith('/#')) {
      const hash = path.replace('/#', '');
      window.history.pushState(null, '', `/#${hash}`);
      setRouteState({ route: 'home' });
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    if (path === '/') {
      window.history.pushState(null, '', '/');
      setRouteState({ route: 'home' });
      window.scrollTo(0, 0);
      return;
    }

    window.history.pushState(null, '', path);
    setRouteState(getRouteFromLocation());
    window.scrollTo(0, 0);
  }, []);

  // Handle routing, redirects, popstate, and hash changes
  useEffect(() => {
    if (window.location.pathname.includes('free-sample')) {
      window.history.replaceState(null, '', '/');
    }

    const handlePopState = () => {
      const nextRouteState = getRouteFromLocation();
      setRouteState(nextRouteState);
      const hash = window.location.hash.replace('#', '');
      if (nextRouteState.route === 'home' && hash && hash !== 'sample' && hash !== 'free-sample') {
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Sync document title and meta description
  useEffect(() => {
    if (currentRoute === 'order') {
      document.title = `Order #${routeState.orderId || ''} | Science Made Visual`;
      return;
    }
    if (currentRoute === 'admin') {
      document.title = 'Owner Admin | Science Made Visual';
      return;
    }
    if (currentRoute === 'thank-you') {
      document.title = 'Thank You | Science Made Visual';
      return;
    }
    if (currentRoute === 'terms') {
      document.title = 'Service Terms and Conditions | Science Made Visual';
      return;
    }
    if (currentRoute === 'booking-policy') {
      document.title = 'Booking Policy | Science Made Visual';
      return;
    }
    if (currentRoute === 'payment-policy') {
      document.title = 'Payment Policy | Science Made Visual';
      return;
    }
    if (currentRoute === 'security-policy') {
      document.title = 'Security Policy | Science Made Visual';
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
  }, [currentRoute, routeState.orderId]);

  const handleScrollTo = (hash: string) => {
    if (currentRoute !== 'home') {
      handleNavigate(hash ? `/#${hash}` : '/');
      return;
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

    if (type === 'terms') {
      handleNavigate('/terms');
      return;
    }

    if (type === 'privacy') {
      if (isSecureUrl(config.privacyUrl)) {
        window.open(config.privacyUrl, '_blank', 'noopener,noreferrer');
      } else {
        setActivePolicy('privacy');
      }
      return;
    }

    if (type === 'refund') {
      if (isSecureUrl(config.refundUrl)) {
        window.open(config.refundUrl, '_blank', 'noopener,noreferrer');
      } else {
        setActivePolicy('refund');
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
      {/* Route matching */}
      {currentRoute === 'admin' ? (
        <AdminPage onNavigate={handleNavigate} />
      ) : currentRoute === 'order' ? (
        <ManualOrderPage
          orderId={routeState.orderId || ''}
          token={routeState.token || ''}
          onNavigate={handleNavigate}
        />
      ) : currentRoute === 'terms' ? (
        <TermsPage onNavigate={handleNavigate} onOpenPolicy={handleOpenPolicy} />
      ) : currentRoute === 'booking-policy' ? (
        <BookingPolicyPage onNavigate={handleNavigate} onOpenPolicy={handleOpenPolicy} />
      ) : currentRoute === 'payment-policy' ? (
        <PaymentPolicyPage
          onNavigate={handleNavigate}
          onOpenPolicy={handleOpenPolicy}
          allowsCards={allowsCards}
        />
      ) : currentRoute === 'security-policy' ? (
        <SecurityPolicyPage onNavigate={handleNavigate} onOpenPolicy={handleOpenPolicy} />
      ) : currentRoute === 'thank-you' ? (
        <>
          <Navbar
            onScrollTo={handleScrollTo}
            countdown={countdown}
            allowsCards={allowsCards}
          />
          <ThankYouPage onBackToHome={() => handleNavigate('/')} />
          <Footer
            onScrollTo={handleScrollTo}
            onOpenPolicy={handleOpenPolicy}
            onNavigate={handleNavigate}
          />
        </>
      ) : (
        <>
          {/* 1. Top bar & Header */}
          <Navbar
            onScrollTo={handleScrollTo}
            countdown={countdown}
            allowsCards={allowsCards}
          />

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

          {/* 13. Footer */}
          <Footer
            onScrollTo={handleScrollTo}
            onOpenPolicy={handleOpenPolicy}
            onNavigate={handleNavigate}
          />

          {/* 14. Mobile sticky bar (below 600px) */}
          <StickyBar
            onScrollToPricing={handleScrollToPricing}
            price100={price100}
          />
        </>
      )}

      {/* Modals & Overlays */}
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
        qrAvailable={qrAvailable}
        onNavigate={handleNavigate}
      />

      <PolicyModal
        type={activePolicy}
        onClose={handleClosePolicyModal}
      />

      <Toast
        message={toastMessage}
        onClose={handleCloseToast}
      />

      {/* Social proof popup: only visible on sales page and when modals are closed */}
      {currentRoute === 'home' && (
        <SocialProofPopup
          isBlocked={checkoutModalOpen || activeSheet !== null || activePolicy !== null}
        />
      )}
    </div>
  );
};

export default App;
