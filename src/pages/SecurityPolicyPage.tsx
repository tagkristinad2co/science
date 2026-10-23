import React from 'react';
import { config } from '../config';
import { PolicyPageLayout, TocItem } from '../components/PolicyPageLayout';
import { PolicyValue } from '../components/PolicyValue';
import { PolicyType } from '../components/PolicyModal';

interface SecurityPolicyPageProps {
  onNavigate: (path: string) => void;
  onOpenPolicy: (type: PolicyType) => void;
}

const toc: TocItem[] = [
  { id: 'section-1', title: 'Our approach' },
  { id: 'section-2', title: 'Secure connection' },
  { id: 'section-3', title: 'Payment security' },
  { id: 'section-4', title: 'Payment verification' },
  { id: 'section-5', title: 'What we store' },
  { id: 'section-6', title: 'Access and secrets' },
  { id: 'section-7', title: 'Prices are set by our server' },
  { id: 'section-8', title: 'Protection against abuse' },
  { id: 'section-9', title: 'Your part' },
  { id: 'section-10', title: 'Data retention' },
  { id: 'section-11', title: 'If something goes wrong' },
  { id: 'section-12', title: 'Reporting a problem' },
  { id: 'section-13', title: 'Contact' },
];

export const SecurityPolicyPage: React.FC<SecurityPolicyPageProps> = ({ onNavigate, onOpenPolicy }) => {
  const { business, policiesLastUpdated } = config;

  return (
    <PolicyPageLayout
      title="Security Policy"
      lastUpdated={policiesLastUpdated}
      toc={toc}
      onNavigate={onNavigate}
      onOpenPolicy={onOpenPolicy}
    >
      <section id="section-1" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>1. Our approach.</strong> We collect as little information as possible and protect what we do collect.
          This page explains how we keep payments and your information safe.
        </p>
      </section>

      <section id="section-2" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>2. Secure connection.</strong> The website uses HTTPS encryption, so information you enter at checkout is
          encrypted between your browser and our servers.
        </p>
      </section>

      <section id="section-3" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>3. Payment security.</strong> Payments are made on Stripe's secure checkout page. We do not receive, process or store your online banking credentials, PINs or card numbers.
        </p>
      </section>

      <section id="section-4" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>4. Payment verification.</strong> We confirm every payment on our servers before delivering any files:
        </p>
        <ul style={{ paddingLeft: '24px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>each payment notification from Stripe must carry a valid Stripe signature;</li>
          <li>it must match the checkout session created for your order;</li>
          <li>we check the amount and currency.</li>
        </ul>
        <p>Download links are released only after these checks pass.</p>
      </section>

      <section id="section-5" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>5. What we store.</strong> For each order we store: order number, pack, amount, your name, email address
          and phone number, payment status, Stripe session and payment reference, receipt images you upload and your
          reference number, and the order date. This is stored with our hosting provider, and only our server can access it.
          Receipts are only visible to the business owner. It is not visible to other visitors.
          If you buy, your first name and the first letter of your second name may appear in a 'recent purchase' notification on our website for up to 14 days (for example, 'Aisyah R. bought the 200-sheet pack'). We never show your full name, email or phone. Email <PolicyValue value={business.email} isEmail /> if you'd like yours hidden.
          We use the Meta Pixel and Meta Conversions API to measure our Facebook and Instagram ads. This shares information such as pages viewed, purchase events and hashed (encrypted) contact details with Meta Platforms. Meta uses it under its own Data Policy. You can manage ad preferences in your Facebook settings.
        </p>
      </section>

      <section id="section-6" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>6. Access and secrets.</strong> Payment keys and download links are kept in secure server settings, never
          in the website's public code. Only the business owner can access order data and admin settings.
        </p>
      </section>

      <section id="section-7" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>7. Prices are set by our server.</strong> The amount you pay is calculated by our server, not by your
          browser, so it cannot be changed by editing the web page.
        </p>
      </section>

      <section id="section-8" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>8. Protection against abuse.</strong> We limit repeated checkout attempts to help prevent spam and
          automated misuse.
        </p>
      </section>

      <section id="section-9" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>9. Your part.</strong>
        </p>
        <ul style={{ paddingLeft: '24px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>Keep your download link private. Anyone with the link may be able to download the files.</li>
          <li>Only enter your details on science.bloxmath.quest and on Stripe's secure checkout page.</li>
          <li>We will never ask for your banking password, PIN or TAC by email, phone or WhatsApp.</li>
        </ul>
      </section>

      <section id="section-10" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>10. Data retention.</strong> We keep order records for as long as needed to deliver your purchase, provide
          support, and meet accounting and tax record-keeping requirements (generally up to 7 years), then delete them. You
          can ask about or correct your personal data by contacting us; see our{' '}
          <button
            type="button"
            onClick={() => onOpenPolicy('privacy')}
            style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
          >
            Privacy Policy
          </button>
          .
        </p>
      </section>

      <section id="section-11" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>11. If something goes wrong.</strong> If we become aware of a security incident affecting your personal
          data, we will take steps to contain it and notify affected customers and authorities where required by law,
          including the Personal Data Protection Act 2010.
        </p>
      </section>

      <section id="section-12" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>12. Reporting a problem.</strong> If you notice a security issue on this website, please email{' '}
          <PolicyValue value={business.email} isEmail /> with the subject "Security". Please do not test it on other people's
          orders.
        </p>
      </section>

      <section id="section-13" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>13. Contact.</strong> <PolicyValue value={business.email} isEmail /> · <PolicyValue value={business.phone} isPhone />.
        </p>
      </section>
    </PolicyPageLayout>
  );
};
