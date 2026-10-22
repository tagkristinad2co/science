import React from 'react';
import { config } from '../config';
import { PolicyPageLayout, TocItem } from '../components/PolicyPageLayout';
import { PolicyValue } from '../components/PolicyValue';
import { PolicyType } from '../components/PolicyModal';

interface PaymentPolicyPageProps {
  onNavigate: (path: string) => void;
  onOpenPolicy: (type: PolicyType) => void;
  allowsCards?: boolean;
}

const toc: TocItem[] = [
  { id: 'section-1', title: 'Payment provider' },
  { id: 'section-2', title: 'Accepted payment methods' },
  { id: 'section-3', title: 'Currency and prices' },
  { id: 'section-4', title: 'Founding and official prices' },
  { id: 'section-5', title: 'One-time payment' },
  { id: 'section-6', title: 'Payment confirmation' },
  { id: 'section-7', title: 'Pending, failed and cancelled payments' },
  { id: 'section-8', title: 'Receipts' },
  { id: 'section-9', title: 'Duplicate payments' },
  { id: 'section-10', title: 'Refunds' },
  { id: 'section-11', title: 'Disputes' },
  { id: 'section-12', title: 'Price changes and errors' },
  { id: 'section-13', title: 'Contact' },
];

export const PaymentPolicyPage: React.FC<PaymentPolicyPageProps> = ({
  onNavigate,
  onOpenPolicy,
  allowsCards = false,
}) => {
  const { business, policiesLastUpdated, founding, official } = config;

  return (
    <PolicyPageLayout
      title="Payment Policy"
      lastUpdated={policiesLastUpdated}
      toc={toc}
      onNavigate={onNavigate}
      onOpenPolicy={onOpenPolicy}
    >
      <section id="section-1" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>1. Payment provider.</strong> Payments are processed by toyyibPay, a Malaysian payment gateway.
          You pay on toyyibPay's own secure page. We never see or store your online banking login, PIN or card details.
        </p>
      </section>

      <section id="section-2" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>2. Accepted payment methods.</strong> FPX online banking with participating Malaysian banks.
          {allowsCards && ' Debit and credit cards are also accepted at checkout.'}
        </p>
      </section>

      <section id="section-3" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>3. Currency and prices.</strong> All prices are in Malaysian Ringgit (RM). The total shown on the
          toyyibPay payment page is the full amount you pay; we do not add delivery fees, and we cover the payment gateway's
          transaction fee.
        </p>
      </section>

      <section id="section-4" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>4. Founding and official prices.</strong> During our launch, founding prices apply until the date and
          time shown on the website: 100 sheets {founding.price100}, or 200 sheets {founding.price200} with the upgrade.
          After that, official prices apply: 100 sheets {official.price100}, or 200 sheets {official.price200} with the
          upgrade.
        </p>
      </section>

      <section id="section-5" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>5. One-time payment.</strong> Each purchase is a single one-time payment. There are no subscriptions
          or recurring charges.
        </p>
      </section>

      <section id="section-6" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>6. Payment confirmation.</strong> Your order is paid only when toyyibPay confirms the payment and our
          system verifies it directly with toyyibPay. Payment results shown in your browser or in the web address are not
          treated as confirmation by themselves.
        </p>
      </section>

      <section id="section-7" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>7. Pending, failed and cancelled payments.</strong> If a payment is pending, we wait for the bank's
          confirmation before delivering. If a payment fails or you cancel it, you are not charged and no files are delivered.
          If money left your account but the order shows as failed, contact us with your bank reference and we will check it
          with toyyibPay.
        </p>
      </section>

      <section id="section-8" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>8. Receipts.</strong> toyyibPay emails a payment receipt to the email address you entered. Your order
          number is shown on the thank-you page.
        </p>
      </section>

      <section id="section-9" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>9. Duplicate payments.</strong> If you are charged twice for the same order, contact us and we will
          refund the duplicate payment once it is confirmed.
        </p>
      </section>

      <section id="section-10" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>10. Refunds.</strong> Refunds are handled under our{' '}
          <button
            type="button"
            onClick={() => onOpenPolicy('refund')}
            style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
          >
            Refund Policy
          </button>
          . Approved refunds are returned to the original payment method or by bank transfer to the account holder, normally
          within 14 working days of approval. Bank processing times may vary.
        </p>
      </section>

      <section id="section-11" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>11. Disputes.</strong> Please contact us first if there is a problem with a payment, so we can fix it
          quickly. Payments found to be fraudulent may be cancelled and access to the files withdrawn.
        </p>
      </section>

      <section id="section-12" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>12. Price changes and errors.</strong> We may change prices for future orders. If an obvious pricing
          error happens, we will contact you before delivering and offer a refund or the correct price.
        </p>
      </section>

      <section id="section-13" style={{ scrollMarginTop: '80px' }}>
        <p>
          <strong>13. Contact.</strong> <PolicyValue value={business.email} isEmail /> · <PolicyValue value={business.phone} isPhone />.
          Please include your order number.
        </p>
      </section>
    </PolicyPageLayout>
  );
};
