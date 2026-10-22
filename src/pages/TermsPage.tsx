import React from 'react';
import { config } from '../config';
import { PolicyPageLayout, TocItem } from '../components/PolicyPageLayout';
import { PolicyValue } from '../components/PolicyValue';
import { PolicyType } from '../components/PolicyModal';

interface TermsPageProps {
  onNavigate: (path: string) => void;
  onOpenPolicy: (type: PolicyType) => void;
}

const toc: TocItem[] = [
  { id: 'section-1', title: 'About these terms' },
  { id: 'section-2', title: 'The product' },
  { id: 'section-3', title: 'Educational use' },
  { id: 'section-4', title: 'Eligibility' },
  { id: 'section-5', title: 'Prices' },
  { id: 'section-6', title: 'Licence to use' },
  { id: 'section-7', title: 'Delivery' },
  { id: 'section-8', title: 'Refunds' },
  { id: 'section-9', title: 'Acceptable use of the website' },
  { id: 'section-10', title: 'Our liability' },
  { id: 'section-11', title: 'Suspension' },
  { id: 'section-12', title: 'Changes to these terms' },
  { id: 'section-13', title: 'Governing law' },
  { id: 'section-14', title: 'Contact' },
];

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate, onOpenPolicy }) => {
  const { business, policiesLastUpdated } = config;
  const regTrimmed = business.registrationNo ? business.registrationNo.trim() : '';

  return (
    <PolicyPageLayout
      title="Service Terms and Conditions"
      lastUpdated={policiesLastUpdated}
      toc={toc}
      onNavigate={onNavigate}
      onOpenPolicy={onOpenPolicy}
    >
      <section id="section-1" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>1. About these terms.</strong> These terms apply when you buy from Science Made Visual, operated
          by <PolicyValue value={business.name} />
          {regTrimmed && (
            <>
              {' ('}
              <PolicyValue value={regTrimmed} />
              {')'}
            </>
          )}
          , <PolicyValue value={business.address} />. By placing an order you agree to these terms, our{' '}
          <button
            type="button"
            onClick={() => onNavigate('/booking-policy')}
            style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
          >
            Booking Policy
          </button>
          ,{' '}
          <button
            type="button"
            onClick={() => onNavigate('/payment-policy')}
            style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
          >
            Payment Policy
          </button>
          ,{' '}
          <button
            type="button"
            onClick={() => onNavigate('/security-policy')}
            style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
          >
            Security Policy
          </button>
          ,{' '}
          <button
            type="button"
            onClick={() => onOpenPolicy('privacy')}
            style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
          >
            Privacy Policy
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={() => onOpenPolicy('refund')}
            style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
          >
            Refund Policy
          </button>
          . If you do not agree, please do not place an order.
        </p>
      </section>

      <section id="section-2" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>2. The product.</strong> Science Made Visual sells digital science study sheets in PDF format: a 100-sheet
          pack, or a 200-sheet pack when the optional upgrade is selected. The product is delivered digitally only. Nothing is
          shipped. The preview images on this website are watermarked samples; the files you receive are not watermarked.
        </p>
      </section>

      <section id="section-3" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>3. Educational use.</strong> The sheets are a supplementary visual learning resource. They are not an
          official KSSR, KSSM or other syllabus resource, and we do not claim formal alignment with any curriculum or exam.
          We take care to keep the content accurate, but we cannot guarantee it is free of errors, and the sheets are not a
          replacement for school teaching. If you spot an error, please tell us at <PolicyValue value={business.email} isEmail />.
        </p>
      </section>

      <section id="section-4" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>4. Eligibility.</strong> You must be 18 or older, or have a parent or guardian's permission, to place an
          order. You must give accurate name, email and phone details at checkout.
        </p>
      </section>

      <section id="section-5" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>5. Prices.</strong> Prices are shown in Malaysian Ringgit (RM) and are one-time payments with no
          subscription. Founding and official prices are explained in our{' '}
          <button
            type="button"
            onClick={() => onNavigate('/payment-policy')}
            style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
          >
            Payment Policy
          </button>
          . The price that applies to your order is the price shown on the toyyibPay payment page when your order is created.
        </p>
      </section>

      <section id="section-6" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>6. Licence to use.</strong> When your payment is confirmed, we grant you a personal, non-exclusive,
          non-transferable licence to download, view and print the sheets for personal and household learning, including home
          schooling of children in your own household. You may not:
        </p>
        <ul style={{ paddingLeft: '24px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>share, upload, email or post the files, or your download link, to anyone outside your household;</li>
          <li>use the sheets in a classroom, tuition centre or school, or with students outside your household;</li>
          <li>resell, sublicense, rent or give away the files or printed copies;</li>
          <li>edit the sheets, remove branding or present them as your own work;</li>
          <li>use the sheets to train or build AI models or datasets.</li>
        </ul>
        <p>
          All sheets, illustrations and text remain the intellectual property of <PolicyValue value={business.name} />. For
          classroom or bulk licences, contact <PolicyValue value={business.email} isEmail />.
        </p>
      </section>

      <section id="section-7" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>7. Delivery.</strong> Delivery is digital and is explained in our{' '}
          <button
            type="button"
            onClick={() => onNavigate('/booking-policy')}
            style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
          >
            Booking Policy
          </button>
          . Please download and save your files promptly. We may update or move the download link, and we will help you get a
          working copy if you have a problem.
        </p>
      </section>

      <section id="section-8" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>8. Refunds.</strong> Because the product is an instant digital download, refunds are handled under our{' '}
          <button
            type="button"
            onClick={() => onOpenPolicy('refund')}
            style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
          >
            Refund Policy
          </button>
          : mainly for faulty files, failed delivery or duplicate payments. Nothing in these terms limits your rights under
          the Consumer Protection Act 1999 or other Malaysian law.
        </p>
      </section>

      <section id="section-9" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>9. Acceptable use of the website.</strong> You must not misuse the website or checkout, attempt to access
          systems or data you are not authorised to access, interfere with payments, or use automated tools to copy the site
          or its previews.
        </p>
      </section>

      <section id="section-10" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>10. Our liability.</strong> We provide the sheets "as is" for educational use. To the extent the law allows,
          our total liability for any claim relating to an order is limited to the amount you paid for that order, and we are
          not liable for indirect or consequential loss. This does not limit liability that cannot be limited under Malaysian
          law.
        </p>
      </section>

      <section id="section-11" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>11. Suspension.</strong> If we reasonably believe an order involves fraud, chargeback abuse or breach of the
          licence, we may cancel the order, refund it where appropriate, and disable access.
        </p>
      </section>

      <section id="section-12" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>12. Changes to these terms.</strong> We may update these terms from time to time. The version in force when
          you place your order applies to that order. The date at the top shows when the terms were last updated.
        </p>
      </section>

      <section id="section-13" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>13. Governing law.</strong> These terms are governed by the laws of Malaysia. We will try to resolve any
          problem with you directly first. You may also have the right to file a claim with the Tribunal for Consumer Claims
          Malaysia.
        </p>
      </section>

      <section id="section-14" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>14. Contact.</strong> <PolicyValue value={business.name} /> · <PolicyValue value={business.address} /> ·{' '}
          <PolicyValue value={business.email} isEmail /> · <PolicyValue value={business.phone} isPhone />. We aim to reply
          within <PolicyValue value={business.responseTime} />.
        </p>
      </section>
    </PolicyPageLayout>
  );
};
