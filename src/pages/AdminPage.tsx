import React, { useState, useEffect } from 'react';

interface OrderItem {
  orderId: string;
  pack: '100' | '200';
  amount: number;
  name: string;
  email: string;
  phone: string;
  method?: 'stripe' | 'manual' | 'fpx';
  status: 'pending' | 'awaiting_payment' | 'under_review' | 'paid' | 'failed' | 'rejected';
  createdAt: string;
  paidAt?: string;
  approvedAt?: string;
  customerReference?: string;
  receiptKey?: string;
  receiptContentType?: string;
  duplicateReceipt?: boolean;
  duplicateOrderId?: string;
  rejectReason?: string;
  accessToken?: string;
  receiptUploadedAt?: string;
  hideFromSocialProof?: boolean;
}

export const AdminPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Tab & Orders state
  const [tab, setTab] = useState<'to_review' | 'awaiting_payment' | 'all'>('to_review');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Rejection modal
  const [rejectingOrder, setRejectingOrder] = useState<OrderItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Amount does not match order total');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Receipt modal viewer
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<OrderItem | null>(null);

  // Check login status on mount
  useEffect(() => {
    fetchOrders('to_review', '');
  }, []);

  const fetchOrders = async (currentTab: string, currentSearch: string) => {
    setLoadingOrders(true);
    try {
      const q = new URLSearchParams({
        tab: currentTab,
        ...(currentSearch ? { search: currentSearch } : {}),
      });

      const res = await fetch(`/api/admin/orders?${q.toString()}`);
      if (res.status === 401) {
        setIsAuthenticated(false);
        setLoadingOrders(false);
        return;
      }

      const data = await res.json();
      setIsAuthenticated(true);
      setOrders(data.orders || []);
    } catch (err) {
      console.error('[Admin fetch error]', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setIsAuthenticated(true);
      setPasswordInput('');
      fetchOrders(tab, search);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleApprove = async (order: OrderItem) => {
    if (!confirm(`Are you sure you want to APPROVE order ${order.orderId} (RM${(order.amount / 100).toFixed(2)})?\n\nPlease confirm you have checked your banking/TnG app and the money has really arrived.`)) {
      return;
    }

    setProcessingAction(order.orderId);
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.orderId,
          action: 'approve',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Approval failed');
        return;
      }

      fetchOrders(tab, search);
    } catch (err) {
      console.error('[Approve error]', err);
      alert('Approval request failed.');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    const finalReason = rejectReason === 'Other' ? customRejectReason.trim() : rejectReason;
    if (!finalReason) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setProcessingAction(rejectingOrder.orderId);
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: rejectingOrder.orderId,
          action: 'reject',
          reason: finalReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Rejection failed');
        return;
      }

      setRejectingOrder(null);
      fetchOrders(tab, search);
    } catch (err) {
      console.error('[Reject error]', err);
      alert('Rejection request failed.');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleToggleHideSocialProof = async (order: OrderItem) => {
    setProcessingAction(order.orderId);
    try {
      const nextVal = !order.hideFromSocialProof;
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.orderId,
          action: 'toggle_social_proof',
          hideFromSocialProof: nextVal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update visibility');
        return;
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === order.orderId ? { ...o, hideFromSocialProof: nextVal } : o
        )
      );
    } catch (err) {
      console.error('[Toggle social proof error]', err);
      alert('Failed to update social proof visibility.');
    } finally {
      setProcessingAction(null);
    }
  };

  const formatCleanPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) return '6' + digits;
    if (digits.startsWith('60')) return digits;
    return '60' + digits;
  };

  // If not logged in, render login form
  if (isAuthenticated === false || isAuthenticated === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '400px', width: '100%', background: '#fff', padding: '36px 30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(16, 29, 61, 0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔐</div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--navy)', margin: '0 0 6px' }}>
              Owner Admin Portal
            </h1>
            <p style={{ color: '#65728d', fontSize: '13px', margin: 0 }}>
              Enter your master ADMIN_PASSWORD to manage orders
            </p>
          </div>

          {loginError && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '13px', marginBottom: '16px' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>
                Admin Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter admin password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                disabled={loggingIn}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
              />
            </div>

            <button
              type="submit"
              className="btn-lime"
              disabled={loggingIn}
              style={{ width: '100%', minHeight: '48px', marginTop: '6px' }}
            >
              {loggingIn ? 'VERIFYING…' : 'SIGN IN →'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              style={{ background: 'none', border: 'none', color: 'var(--purple)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              ← Back to Science Made Visual
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9ff', paddingBottom: '80px' }}>
      {/* Top Bar */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span style={{ color: 'var(--purple)', fontSize: '18px' }}>✦</span>
              <span style={{ fontWeight: 900, color: 'var(--navy)', fontSize: '15px' }}>SCIENCE MADE VISUAL</span>
            </button>
            <span style={{ background: '#e0e7ff', color: 'var(--purple)', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
              ADMIN
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => fetchOrders(tab, search)}
              style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: 'var(--navy)' }}
            >
              🔄 Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                document.cookie = 'admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                setIsAuthenticated(false);
              }}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '32px auto 0', padding: '0 16px' }}>
        {/* Prominent Reminder Banner */}
        <div
          style={{
            background: '#fefce8',
            border: '2px solid #fef08a',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div style={{ fontSize: '14px', color: '#854d0e', lineHeight: 1.5 }}>
            <strong>CRITICAL RULE:</strong> Approve only after you see the money in your DuitNow / TnG account with the correct amount. Receipts can be faked or altered. A receipt upload is never proof of payment.
          </div>
        </div>

        {/* Tabs & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setTab('to_review');
                fetchOrders('to_review', search);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: tab === 'to_review' ? 'var(--navy)' : '#ffffff',
                color: tab === 'to_review' ? '#ffffff' : 'var(--navy)',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              ⏳ To Review {tab === 'to_review' && orders.length > 0 && `(${orders.length})`}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('awaiting_payment');
                fetchOrders('awaiting_payment', search);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: tab === 'awaiting_payment' ? 'var(--navy)' : '#ffffff',
                color: tab === 'awaiting_payment' ? '#ffffff' : 'var(--navy)',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              📱 Awaiting Payment
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('all');
                fetchOrders('all', search);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: tab === 'all' ? 'var(--navy)' : '#ffffff',
                color: tab === 'all' ? '#ffffff' : 'var(--navy)',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              📋 All Orders
            </button>
          </div>

          {/* Search box */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Search order #, name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchOrders(tab, search);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                width: '280px',
                background: '#ffffff',
              }}
            />
            <button
              type="button"
              onClick={() => fetchOrders(tab, search)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Orders List */}
        {loadingOrders ? (
          <div style={{ padding: '48px', textAlign: 'center', background: '#fff', borderRadius: '16px', color: '#65728d' }}>
            Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#65728d' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              {tab === 'to_review' ? '🎉' : '📭'}
            </div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--navy)' }}>
              {tab === 'to_review' ? 'No orders waiting for review!' : 'No orders found.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map((o) => {
              const amountStr = `RM${(o.amount / 100).toFixed(2)}`;
              const orderPageUrl = `${window.location.origin}/order/${o.orderId}?t=${o.accessToken || ''}`;
              const cleanPhone = formatCleanPhone(o.phone);
              const waTextApproved = encodeURIComponent(
                `Hi ${o.name}, your payment for order ${o.orderId} is confirmed! Download your science sheets here: ${orderPageUrl}. Thank you!`
              );
              const waTextRejected = encodeURIComponent(
                `Hi ${o.name}, regarding your order ${o.orderId}: we could not verify your payment receipt (${o.rejectReason || 'Details do not match'}). Please visit your order link to re-upload: ${orderPageUrl}`
              );

              return (
                <div
                  key={o.orderId}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: o.duplicateReceipt ? '2px solid #ef4444' : '1px solid #e2e8f0',
                    padding: '24px',
                    boxShadow: '0 2px 10px rgba(16, 29, 61, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '17px', color: 'var(--navy)' }}>
                          {o.orderId}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            background:
                              o.status === 'paid'
                                ? '#dcfce7'
                                : o.status === 'under_review'
                                ? '#fef3c7'
                                : o.status === 'rejected'
                                ? '#fee2e2'
                                : '#f1f5f9',
                            color:
                              o.status === 'paid'
                                ? '#15803d'
                                : o.status === 'under_review'
                                ? '#b45309'
                                : o.status === 'rejected'
                                ? '#b91c1c'
                                : '#475569',
                          }}
                        >
                          {o.status.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: '11px', background: '#e0e7ff', color: 'var(--purple)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                          {o.method === 'manual'
                            ? '📱 QR Manual'
                            : o.method === 'stripe'
                            ? '💳 Stripe'
                            : 'toyyibPay (old)'}
                        </span>
                        {o.status === 'paid' && o.hideFromSocialProof && (
                          <span style={{ fontSize: '11px', background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            Hidden from popup
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '13px', color: '#65728d' }}>
                        Created: {new Date(o.createdAt).toLocaleString('en-MY')}
                        {o.receiptUploadedAt && (
                          <span> · Receipt: {new Date(o.receiptUploadedAt).toLocaleString('en-MY')}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--navy)' }}>
                        {amountStr}
                      </div>
                      <div style={{ fontSize: '12px', color: '#65728d' }}>
                        {o.pack} sheets pack
                      </div>
                    </div>
                  </div>

                  {/* Duplicate receipt alert */}
                  {o.duplicateReceipt && (
                    <div
                      style={{
                        padding: '10px 14px',
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        borderRadius: '8px',
                        color: '#991b1b',
                        fontSize: '13px',
                        fontWeight: 700,
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>⚠ SAME RECEIPT HASH USED ON ANOTHER ORDER!</span>
                      {o.duplicateOrderId && (
                        <span>(Order #{o.duplicateOrderId})</span>
                      )}
                    </div>
                  )}

                  {/* Customer details */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      fontSize: '13px',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>CUSTOMER</div>
                      <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{o.name}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>EMAIL</div>
                      <div>
                        <a href={`mailto:${o.email}`} style={{ color: 'var(--purple)', textDecoration: 'none' }}>
                          {o.email}
                        </a>
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>PHONE</div>
                      <div>
                        <a href={`tel:${o.phone}`} style={{ color: 'var(--purple)', textDecoration: 'none' }}>
                          {o.phone}
                        </a>
                      </div>
                    </div>
                    {o.customerReference && (
                      <div>
                        <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>CUSTOMER REF</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{o.customerReference}</div>
                      </div>
                    )}
                  </div>

                  {/* Rejection reason if rejected */}
                  {o.status === 'rejected' && o.rejectReason && (
                    <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', color: '#991b1b', fontSize: '12px', marginBottom: '14px' }}>
                      <strong>Rejection reason:</strong> {o.rejectReason}
                    </div>
                  )}

                  {/* Actions / Receipt preview */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {o.receiptKey ? (
                        <button
                          type="button"
                          onClick={() => setViewingReceiptOrder(o)}
                          style={{
                            padding: '8px 14px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            color: 'var(--navy)',
                          }}
                        >
                          👁 View Uploaded Receipt
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>No receipt uploaded</span>
                      )}

                      {o.accessToken && (
                        <a
                          href={orderPageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '8px 14px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--purple)',
                            textDecoration: 'none',
                          }}
                        >
                          Customer Page ↗
                        </a>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Hide from sales popup toggle for paid orders */}
                      {o.status === 'paid' && (
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            background: o.hideFromSocialProof ? '#fff1f2' : '#f8fafc',
                            border: o.hideFromSocialProof ? '1px solid #fecdd3' : '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: o.hideFromSocialProof ? '#e11d48' : '#475569',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          title="Toggle whether this sale appears in the recent purchases popup on the site"
                        >
                          <input
                            type="checkbox"
                            checked={!!o.hideFromSocialProof}
                            disabled={processingAction === o.orderId}
                            onChange={() => handleToggleHideSocialProof(o)}
                            style={{ cursor: 'pointer', accentColor: '#7855f5' }}
                          />
                          <span>{o.hideFromSocialProof ? '🙈 Hidden from sales popup' : 'Hide from sales popup'}</span>
                        </label>
                      )}

                      {/* Approve / Reject buttons for manual orders */}
                      {o.method === 'manual' && o.status !== 'paid' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setRejectingOrder(o)}
                            disabled={processingAction === o.orderId}
                            style={{
                              padding: '8px 16px',
                              background: '#ffffff',
                              border: '1px solid #ef4444',
                              color: '#ef4444',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(o)}
                            disabled={processingAction === o.orderId}
                            style={{
                              padding: '8px 18px',
                              background: '#22c55e',
                              border: 'none',
                              color: '#ffffff',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {processingAction === o.orderId ? 'Approving…' : '✓ Approve & Unlock'}
                          </button>
                        </>
                      )}

                      {/* WhatsApp shortcut button */}
                      {o.status === 'paid' && (
                        <a
                          href={`https://wa.me/${cleanPhone}?text=${waTextApproved}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '8px 14px',
                            background: '#25d366',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          💬 Send via WhatsApp
                        </a>
                      )}

                      {o.status === 'rejected' && (
                        <a
                          href={`https://wa.me/${cleanPhone}?text=${waTextRejected}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '8px 14px',
                            background: '#64748b',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          💬 WhatsApp Rejection
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Rejection Modal */}
      {rejectingOrder && (
        <div className="modal open" role="dialog" aria-modal="true" onClick={() => setRejectingOrder(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: '440px', padding: '28px', background: '#ffffff', borderRadius: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--navy)', margin: '0 0 8px' }}>
              Reject Order #{rejectingOrder.orderId}
            </h3>
            <p style={{ color: '#65728d', fontSize: '13px', margin: '0 0 16px' }}>
              Select or enter the reason for rejection. The customer will see this message.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {[
                'Amount does not match order total',
                'Payment not received in bank/TnG account',
                'Receipt is unreadable or blurry',
                'Duplicate or fraudulent receipt',
                'Other',
              ].map((reasonOption) => (
                <label key={reasonOption} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="rejectReason"
                    checked={rejectReason === reasonOption}
                    onChange={() => setRejectReason(reasonOption)}
                  />
                  <span>{reasonOption}</span>
                </label>
              ))}
            </div>

            {rejectReason === 'Other' && (
              <div style={{ marginBottom: '16px' }}>
                <textarea
                  placeholder="Explain why the receipt was rejected…"
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', minHeight: '80px' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={processingAction === rejectingOrder.orderId}
                style={{ padding: '8px 18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
              >
                {processingAction === rejectingOrder.orderId ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal Viewer */}
      {viewingReceiptOrder && (
        <div className="modal open" role="dialog" aria-modal="true" onClick={() => setViewingReceiptOrder(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: '680px', width: '90%', padding: '24px', background: '#ffffff', borderRadius: '16px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                Receipt: Order #{viewingReceiptOrder.orderId}
              </h3>
              <button
                type="button"
                onClick={() => setViewingReceiptOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#65728d' }}
              >
                ×
              </button>
            </div>

            {viewingReceiptOrder.receiptContentType === 'application/pdf' ? (
              <div style={{ padding: '32px', background: '#f8fafc', borderRadius: '10px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>PDF Receipt Document</div>
                <a
                  href={`/api/admin/receipt?order_id=${viewingReceiptOrder.orderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-lime"
                  style={{ textDecoration: 'none', padding: '10px 20px', display: 'inline-block' }}
                >
                  Open PDF in New Tab ↗
                </a>
              </div>
            ) : (
              <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <img
                  src={`/api/admin/receipt?order_id=${viewingReceiptOrder.orderId}`}
                  alt={`Receipt for ${viewingReceiptOrder.orderId}`}
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
