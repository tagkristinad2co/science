import React, { useState, useEffect, useRef } from 'react';
import { config } from '../config';

interface RecentSale {
  displayName: string;
  pack: '100' | '200';
  paidAt: string;
}

interface RecentSalesData {
  sales: RecentSale[];
  last24hCount: number;
}

type PopupItem =
  | { type: 'sale'; sale: RecentSale }
  | { type: 'count_24h'; count: number };

interface SocialProofPopupProps {
  isBlocked?: boolean; // True when modal, lightbox, policy, or other page is active
}

function getRelativeTimeString(isoDate: string): string {
  try {
    const timestamp = new Date(isoDate).getTime();
    if (isNaN(timestamp)) return 'recently';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 120) {
      return 'just now';
    }
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    }
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (diffHours < 48) {
      return 'yesterday';
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } catch {
    return 'recently';
  }
}

export const SocialProofPopup: React.FC<SocialProofPopupProps> = ({ isBlocked = false }) => {
  const [items, setItems] = useState<PopupItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('smv_social_proof_dismissed') === 'true';
    } catch {
      return false;
    }
  });


  const isBlockedRef = useRef<boolean>(isBlocked);
  isBlockedRef.current = isBlocked;

  // Hide immediately if blocked
  useEffect(() => {
    if (isBlocked && isVisible) {
      setIsVisible(false);
    }
  }, [isBlocked, isVisible]);

  // Fetch real sales once per page view
  useEffect(() => {
    if (isDismissed) return;
    if (!config.socialProof?.enabled) return;

    let mounted = true;

    fetch('/api/recent-sales')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch sales');
        return res.json();
      })
      .then((data: RecentSalesData) => {
        if (!mounted) return;
        const sales = data?.sales || [];
        const minSales = config.socialProof?.minSalesToShow ?? 1;

        if (sales.length < minSales) {
          // If no qualifying real sales, show nothing
          return;
        }

        // Build queue of real sales without repeats
        const queue: PopupItem[] = [];
        let saleIdx = 0;

        // If 24h count >= 3, insert a 24h count summary card as the 2nd popup
        const show24h = (data.last24hCount || 0) >= 3;

        while (saleIdx < sales.length && queue.length < 4) {
          if (queue.length === 1 && show24h) {
            queue.push({ type: 'count_24h', count: data.last24hCount });
          } else {
            queue.push({ type: 'sale', sale: sales[saleIdx] });
            saleIdx++;
          }
        }

        if (queue.length > 0) {
          setItems(queue);
        }
      })
      .catch((err) => {
        console.warn('[SocialProof] Could not load real sales:', err);
      });

    return () => {
      mounted = false;
    };
  }, [isDismissed]);

  // Schedule sequence of popups
  useEffect(() => {
    if (isDismissed || items.length === 0) return;

    let timeoutId: any = null;
    let hideTimeoutId: any = null;
    let cancelled = false;

    // Check how many have been shown this visit
    let currentCount = 0;
    try {
      currentCount = parseInt(sessionStorage.getItem('smv_social_proof_count') || '0', 10);
    } catch {}

    if (currentCount >= 4) {
      return;
    }

    let queueIdx = 0;

    const showNext = () => {
      if (cancelled) return;

      let visitsSoFar = 0;
      try {
        visitsSoFar = parseInt(sessionStorage.getItem('smv_social_proof_count') || '0', 10);
      } catch {}

      if (visitsSoFar >= 4 || queueIdx >= items.length) {
        return;
      }

      // If currently blocked by open modal or other page, retry in 5s
      if (isBlockedRef.current) {
        timeoutId = setTimeout(showNext, 5000);
        return;
      }

      setCurrentIndex(queueIdx);
      setIsVisible(true);

      // Record popup shown in session
      try {
        sessionStorage.setItem('smv_social_proof_count', (visitsSoFar + 1).toString());
      } catch {}

      queueIdx++;

      // Stays for 6 seconds
      hideTimeoutId = setTimeout(() => {
        if (cancelled) return;
        setIsVisible(false);

        // Gap of 25 seconds before next popup
        timeoutId = setTimeout(showNext, 25000);
      }, 6000);
    };

    // First popup: 8 seconds after page load
    timeoutId = setTimeout(showNext, 8000);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (hideTimeoutId) clearTimeout(hideTimeoutId);
    };
  }, [items, isDismissed]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem('smv_social_proof_dismissed', 'true');
    } catch {}
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.social-proof-close-btn')) {
      return;
    }
    const pricing = document.getElementById('pricing');
    if (pricing) {
      pricing.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = 'pricing';
    }
  };

  if (isDismissed || currentIndex < 0 || currentIndex >= items.length) {
    return null;
  }

  const currentItem = items[currentIndex];

  return (
    <>
      <style>{`
        .social-proof-popup {
          position: fixed;
          top: 76px;
          left: 20px;
          z-index: 40;
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #e1e8f2;
          box-shadow: 0 4px 20px rgba(16, 29, 61, 0.12);
          padding: 12px 14px;
          max-width: 320px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
          user-select: none;
        }
        .social-proof-popup:hover {
          box-shadow: 0 8px 26px rgba(16, 29, 61, 0.16);
          border-color: #cbd5e1;
        }
        .social-proof-close-btn:hover {
          color: #1e293b !important;
          background: #f1f5f9 !important;
        }
        @media (max-width: 600px) {
          .social-proof-popup {
            left: 12px !important;
            right: 12px !important;
            max-width: 360px !important;
            top: 72px !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .social-proof-popup {
            transition: opacity 0.15s ease !important;
            transform: none !important;
          }
        }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        onClick={handleCardClick}
        className="social-proof-popup"
        style={{
          opacity: isVisible && !isBlocked ? 1 : 0,
          transform: isVisible && !isBlocked ? 'translateX(0)' : 'translateX(-28px)',
          pointerEvents: isVisible && !isBlocked ? 'auto' : 'none',
        }}
      >
        {/* Thumbnail */}
        {currentItem.type === 'count_24h' ? (
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            🔥
          </div>
        ) : (
          <img
            src={currentItem.sale.pack === '200' ? '/assets/page-42.webp' : '/assets/page-3.webp'}
            alt=""
            aria-hidden="true"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              objectFit: 'cover',
              flexShrink: 0,
              border: '1px solid #edf0f8',
            }}
          />
        )}

        {/* Text lines */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
          {currentItem.type === 'count_24h' ? (
            <>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '14px',
                  color: 'var(--navy)',
                  lineHeight: 1.3,
                }}
              >
                🔥 {currentItem.count} people bought in the last 24 hours
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#65728d',
                  marginTop: '3px',
                }}
              >
                ✓ Verified purchases
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '14px',
                  color: 'var(--navy)',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentItem.sale.displayName} bought the {currentItem.sale.pack}-sheet pack
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#65728d',
                  marginTop: '3px',
                }}
              >
                {getRelativeTimeString(currentItem.sale.paidAt)} · ✓ Verified purchase
              </div>
            </>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          className="social-proof-close-btn"
          aria-label="Close"
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            background: 'none',
            border: 'none',
            fontSize: '18px',
            lineHeight: 1,
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>
    </>
  );
};
