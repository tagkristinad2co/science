import React from 'react';
import { config } from '../config';
import { PolicyPageLayout, TocItem } from '../components/PolicyPageLayout';
import { PolicyValue } from '../components/PolicyValue';
import { PolicyType } from '../components/PolicyModal';

interface BookingPolicyPageProps {
  onNavigate: (path: string) => void;
  onOpenPolicy: (type: PolicyType) => void;
}

const toc: TocItem[] = [
  { id: 'section-1', title: 'How to place an order' },
  { id: 'section-2', title: 'When your order is created' },
  { id: 'section-3', title: 'Order confirmation' },
  { id: 'section-4', title: 'Unpaid and expired orders' },
  { id: 'section-5', title: 'Founding price orders' },
  { id: 'section-6', title: 'Delivery of your sheets' },
  { id: 'section-7', title: 'Wrong details' },
  { id: 'section-8', title: 'Changes and upgrades' },
  { id: 'section-9', title: 'Cancellation' },
  { id: 'section-10', title: 'Contact' },
];

export const BookingPolicyPage: React.FC<BookingPolicyPageProps> = ({ onNavigate, onOpenPolicy }) => {
  const { business, policiesLastUpdated } = config;

  return (
    <PolicyPageLayout
      title="Booking Policy"
      lastUpdated={policiesLastUpdated}
      intro="A 'booking' on this site means placing an order for a digital study pack."
      toc={toc}
      onNavigate={onNavigate}
      onOpenPolicy={onOpenPolicy}
    >
      <section id="section-1" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>1. How to place an order.</strong> Choose the 100-sheet pack, and tick the optional upgrade if you want
          200 sheets. Click the buy button, enter your full name, email address and Malaysian phone number, then click Pay.
          You are taken to toyyibPay's secure payment page to complete payment.
        </p>
      </section>

      <section id="section-2" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>2. When your order is created.</strong> Your order is created and given an order number (starting with
          "SMV-") as soon as you click Pay. The amount is fixed at that moment and shown on the toyyibPay payment page. Please
          check the pack and amount before paying.
        </p>
      </section>

      <section id="section-3" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>3. Order confirmation.</strong> Your order is confirmed only after toyyibPay confirms that your payment was
          successful and we have verified it. An unpaid order is not a confirmed booking, and we do not reserve prices for
          unpaid orders.
        </p>
      </section>

      <section id="section-4" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>4. Unpaid and expired orders.</strong> If you don't complete payment, the order stays unpaid and the
          payment link expires after about 24 hours. You can place a new order at any time at the price shown then.
        </p>
      </section>

      <section id="section-5" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>5. Founding price orders.</strong> Founding prices apply to orders created before the founding price ends
          at the date and time shown on the website (Malaysia time). An order created before the deadline can be paid at the
          price on its payment page until that payment link expires.
        </p>
      </section>

      <section id="section-6" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>6. Delivery of your sheets.</strong>
        </p>
        <ul style={{ paddingLeft: '24px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>After a successful payment, you are returned to our thank-you page, which shows a "Download your sheets" button.</li>
          <li>toyyibPay also emails your receipt to the address you entered, including your download link.</li>
          <li>Most FPX payments are confirmed within seconds. Some banks take longer, and the thank-you page will keep checking for a few minutes.</li>
          <li>
            If you have not received your link within 24 hours of a successful payment, contact{' '}
            <PolicyValue value={business.email} isEmail /> with your order number, and we will send it manually.
          </li>
        </ul>
      </section>

      <section id="section-7" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>7. Wrong details.</strong> If you entered the wrong email address, contact us with your order number and
          payment receipt and we will send the link to the correct address after checking the order.
        </p>
      </section>

      <section id="section-8" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>8. Changes and upgrades.</strong> Orders cannot be changed after payment. If you bought the 100-sheet pack
          and want the extra 100 sheets, contact us and we will tell you the current upgrade option.
        </p>
      </section>

      <section id="section-9" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>9. Cancellation.</strong> Because the files are made available immediately after payment, a paid order
          cannot be cancelled. If something has gone wrong, see our{' '}
          <button
            type="button"
            onClick={() => onOpenPolicy('refund')}
            style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
          >
            Refund Policy
          </button>
          .
        </p>
      </section>

      <section id="section-10" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>10. Contact.</strong> <PolicyValue value={business.email} isEmail /> · <PolicyValue value={business.phone} isPhone />.
          Please include your order number.
        </p>
      </section>
    </PolicyPageLayout>
  );
};
