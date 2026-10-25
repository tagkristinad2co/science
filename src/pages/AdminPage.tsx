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
  emailSentAt?: string;
  pendingEmailSentAt?: string;
  rejectionEmailSentAt?: string;
  paymentRefNo?: string;
  paymentRefRecordedAt?: string;
  paymentRefNormalized?: string;
  paymentRefEditedAt?: string;
  stripePaymentIntentId?: string;
  emailSentCount?: number;
  emailLastSentTo?: string;
  emailHistory?: Array<{ email: string; changedAt: string }>;
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

  // Payment ref inputs for "To review" cards
  const [paymentRefInputs, setPaymentRefInputs] = useState<Record<string, string>>({});
  const [duplicateErrors, setDuplicateErrors] = useState<Record<string, { duplicateOrderId: string; message: string } | null>>({});

  // Inline edit state for paymentRefNo (All orders table & cards)
  const [editingOrderRefId, setEditingOrderRefId] = useState<string | null>(null);
  const [editingRefValue, setEditingRefValue] = useState('');
  const [editDuplicateError, setEditDuplicateError] = useState<{ duplicateOrderId: string; message: string } | null>(null);
  const [savingRefEdit, setSavingRefEdit] = useState(false);

  // Send Download Email Modal & Toast state
  const [sendingEmailOrder, setSendingEmailOrder] = useState<OrderItem | null>(null);
  const [sendingEmailInput, setSendingEmailInput] = useState('');
  const [sendingEmailLoading, setSendingEmailLoading] = useState(false);
  const [sendingEmailError, setSendingEmailError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const isValidPaymentRef = (val: string | undefined): boolean => {
    if (!val) return false;
    const norm = val.toUpperCase().replace(/[\s-]/g, '');
    return /^[A-Z0-9]{6,64}$/.test(norm);
  };

  const handleApprove = async (order: OrderItem, forceDuplicate = false) => {
    const refVal = (paymentRefInputs[order.orderId] ?? (order.paymentRefNo || '')).trim();
    if (!isValidPaymentRef(refVal)) {
      alert('Please enter a valid payment reference number (at least 6 alphanumeric characters).');
      return;
    }

    if (!forceDuplicate && !confirm(`Are you sure you want to APPROVE order ${order.orderId} (RM${(order.amount / 100).toFixed(2)})?\n\nPayment Ref: ${refVal}\n\nPlease confirm you have checked your banking/TnG app and the money has really arrived.`)) {
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
          paymentRefNo: refVal,
          forceDuplicate,
        }),
      });

      const data = await res.json();
      if (res.status === 409) {
        setDuplicateErrors((prev) => ({
          ...prev,
          [order.orderId]: {
            duplicateOrderId: data.duplicateOrderId || '',
            message: data.error || 'This reference number was already used for another order.',
          },
        }));
        return;
      }

      if (!res.ok) {
        alert(data.error || 'Approval failed');
        return;
      }

      setDuplicateErrors((prev) => ({ ...prev, [order.orderId]: null }));
      setPaymentRefInputs((prev) => {
        const next = { ...prev };
        delete next[order.orderId];
        return next;
      });

      fetchOrders(tab, search);
    } catch (err) {
      console.error('[Approve error]', err);
      alert('Approval request failed.');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleSavePaymentRef = async (orderId: string, forceDuplicate = false) => {
    const refVal = editingRefValue.trim();
    if (!isValidPaymentRef(refVal)) {
      alert('Please enter a valid payment reference number (at least 6 alphanumeric characters).');
      return;
    }

    setSavingRefEdit(true);
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          action: 'update_payment_ref',
          paymentRefNo: refVal,
          forceDuplicate,
        }),
      });

      const data = await res.json();
      if (res.status === 409) {
        setEditDuplicateError({
          duplicateOrderId: data.duplicateOrderId || '',
          message: data.error || 'This reference number was already used for another order.',
        });
        return;
      }

      if (!res.ok) {
        alert(data.error || 'Failed to update payment reference number');
        return;
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId
            ? {
                ...o,
                paymentRefNo: data.paymentRefNo,
                paymentRefNormalized: data.paymentRefNormalized,
                paymentRefEditedAt: data.paymentRefEditedAt,
              }
            : o
        )
      );

      setEditingOrderRefId(null);
      setEditDuplicateError(null);
    } catch (err) {
      console.error('[Update ref error]', err);
      alert('Failed to update payment reference number');
    } finally {
      setSavingRefEdit(false);
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('No orders to export.');
      return;
    }

    const headers = [
      'Order ID',
      'Date',
      'Method',
      'Pack',
      'Amount (RM)',
      'Status',
      'Customer Name',
      'Email',
      'Phone',
      'Customer Reference',
      'Payment Ref No.',
      'Paid/Approved Date',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = orders.map((o) => {
      const refNo = o.method === 'stripe'
        ? (o.stripePaymentIntentId || '')
        : (o.paymentRefNo || '');
      const paidDate = o.paidAt || o.approvedAt || '';

      return [
        escapeCsv(o.orderId),
        escapeCsv(new Date(o.createdAt).toLocaleString('en-MY')),
        escapeCsv(o.method || 'fpx'),
        escapeCsv(`${o.pack} sheets`),
        escapeCsv((o.amount / 100).toFixed(2)),
        escapeCsv(o.status),
        escapeCsv(o.name),
        escapeCsv(o.email),
        escapeCsv(o.phone),
        escapeCsv(o.customerReference || ''),
        escapeCsv(refNo),
        escapeCsv(paidDate ? new Date(paidDate).toLocaleString('en-MY') : ''),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `orders_${tab}_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenSendEmailModal = (order: OrderItem) => {
    setSendingEmailOrder(order);
    setSendingEmailInput(order.email);
    setSendingEmailError(null);
  };

  const handleConfirmSendEmail = async () => {
    if (!sendingEmailOrder) return;
    const trimmed = sendingEmailInput.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setSendingEmailError('Please enter a valid email address.');
      return;
    }

    setSendingEmailLoading(true);
    setSendingEmailError(null);

    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: sendingEmailOrder.orderId,
          email: trimmed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSendingEmailError(data.error || 'Failed to send email');
        return;
      }

      // Update in-place in local orders array
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === sendingEmailOrder.orderId
            ? {
                ...o,
                email: data.email || trimmed,
                emailSentAt: data.emailSentAt,
                emailSentCount: data.emailSentCount,
                emailLastSentTo: data.emailLastSentTo,
              }
            : o
        )
      );

      // Close modal
      setSendingEmailOrder(null);

      // Show green toast
      setToastMessage(`✅ Download email sent to ${trimmed}`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('[Send email error]', err);
      setSendingEmailError(err.message || 'Request failed. Please check network connection.');
    } finally {
      setSendingEmailLoading(false);
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

  const handleResendEmail = async (order: OrderItem) => {
    if (!confirm(`Resend the latest notification email to ${order.email} for order ${order.orderId}?`)) {
      return;
    }

    setProcessingAction(order.orderId);
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.orderId,
          action: 'resend_email',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to resend email');
        return;
      }

      alert(data.message || 'Email resent successfully!');
      fetchOrders(tab, search);
    } catch (err) {
      console.error('[Resend email error]', err);
      alert('Failed to resend email.');
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

          {/* Search box & CSV Export */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search order #, ref no., name, email…"
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
            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: 'var(--navy)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
              title="Export current orders to CSV"
            >
              📥 Export CSV
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
        ) : tab === 'all' ? (
          <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(16, 29, 61, 0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Order #</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Date</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Customer</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Method / Pack</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Amount</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Payment ref no.</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const amountStr = `RM${(o.amount / 100).toFixed(2)}`;
                  const orderPageUrl = `${window.location.origin}/order/${o.orderId}?t=${o.accessToken || ''}`;
                  const cleanPhone = formatCleanPhone(o.phone);
                  const isStripe = o.method === 'stripe';
                  const isManual = o.method === 'manual';
                  const isEditingRef = editingOrderRefId === o.orderId;
                  const waTextApproved = encodeURIComponent(
                    `Hi ${o.name}, your payment for order ${o.orderId} is confirmed! Download your science sheets here: ${orderPageUrl}. Thank you!`
                  );

                  return (
                    <tr key={o.orderId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--navy)' }}>
                          {o.orderId}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {new Date(o.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <div style={{ fontSize: '11px' }}>{new Date(o.createdAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{o.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          <a href={`mailto:${o.email}`} style={{ color: '#64748b', textDecoration: 'none' }}>
                            {o.email}
                          </a>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{o.phone}</div>
                        {o.customerReference && (
                          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                            Cust ref: <span style={{ fontFamily: 'monospace', fontWeight: 700, background: '#f1f5f9', padding: '1px 4px', borderRadius: '4px' }}>{o.customerReference}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                          {isManual ? '📱 QR Manual' : isStripe ? '💳 Stripe' : 'toyyibPay'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{o.pack} sheets</div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', fontWeight: 800, color: 'var(--navy)' }}>
                        {amountStr}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            display: 'inline-block',
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
                        {o.status === 'paid' && o.hideFromSocialProof && (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ fontSize: '10px', background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Hidden popup
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        {isEditingRef ? (
                          <div style={{ minWidth: '220px' }}>
                            <input
                              type="text"
                              value={editingRefValue}
                              onChange={(e) => {
                                setEditingRefValue(e.target.value);
                                if (editDuplicateError) setEditDuplicateError(null);
                              }}
                              placeholder="e.g. 20261025MBBE..."
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: editDuplicateError ? '2px solid #ef4444' : '1px solid #cbd5e1',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                marginBottom: '6px',
                                boxSizing: 'border-box',
                              }}
                            />
                            {editDuplicateError && (
                              <div style={{ fontSize: '11px', color: '#991b1b', background: '#fee2e2', padding: '6px 8px', borderRadius: '4px', marginBottom: '6px' }}>
                                ⚠ Already used for order <strong>#{editDuplicateError.duplicateOrderId}</strong>.
                                <button
                                  type="button"
                                  onClick={() => handleSavePaymentRef(o.orderId, true)}
                                  style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', marginLeft: '4px' }}
                                >
                                  Save anyway
                                </button>
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                disabled={savingRefEdit || !isValidPaymentRef(editingRefValue.trim())}
                                onClick={() => handleSavePaymentRef(o.orderId, false)}
                                style={{
                                  padding: '4px 10px',
                                  background: '#22c55e',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  cursor: savingRefEdit || !isValidPaymentRef(editingRefValue.trim()) ? 'not-allowed' : 'pointer',
                                  opacity: savingRefEdit || !isValidPaymentRef(editingRefValue.trim()) ? 0.5 : 1,
                                }}
                              >
                                {savingRefEdit ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingOrderRefId(null);
                                  setEditDuplicateError(null);
                                }}
                                style={{
                                  padding: '4px 8px',
                                  background: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {isStripe ? (
                              o.stripePaymentIntentId ? (
                                <span
                                  style={{ fontFamily: 'monospace', fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#334155' }}
                                  title={o.stripePaymentIntentId}
                                >
                                  {o.stripePaymentIntentId.length > 14
                                    ? `${o.stripePaymentIntentId.slice(0, 5)}…${o.stripePaymentIntentId.slice(-4)}`
                                    : o.stripePaymentIntentId}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>—</span>
                              )
                            ) : isManual ? (
                              <>
                                {o.paymentRefNo ? (
                                  <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--navy)', background: '#e0e7ff', padding: '2px 6px', borderRadius: '4px' }}>
                                    {o.paymentRefNo}
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8' }}>—</span>
                                )}
                                {o.status === 'paid' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingOrderRefId(o.orderId);
                                      setEditingRefValue(o.paymentRefNo || '');
                                      setEditDuplicateError(null);
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '2px 4px',
                                      fontSize: '12px',
                                      borderRadius: '4px',
                                    }}
                                    title="Edit payment reference number"
                                  >
                                    ✏️
                                  </button>
                                )}
                              </>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {o.receiptKey && (
                            <button
                              type="button"
                              onClick={() => setViewingReceiptOrder(o)}
                              style={{ padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: 'var(--navy)' }}
                              title="View Receipt"
                            >
                              👁 Receipt
                            </button>
                          )}
                          {o.accessToken && (
                            <a
                              href={orderPageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ padding: '4px 8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--purple)', textDecoration: 'none' }}
                              title="Customer Order Page"
                            >
                              Page ↗
                            </a>
                          )}
                          {o.status === 'paid' && (
                            <button
                              type="button"
                              disabled={processingAction === o.orderId}
                              onClick={() => handleToggleHideSocialProof(o)}
                              style={{ padding: '4px 8px', background: o.hideFromSocialProof ? '#fff1f2' : '#f8fafc', border: o.hideFromSocialProof ? '1px solid #fecdd3' : '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: o.hideFromSocialProof ? '#e11d48' : '#475569', cursor: 'pointer' }}
                              title="Toggle hide from recent purchases popup"
                            >
                              {o.hideFromSocialProof ? '🙈 Hidden' : '👁 Shown'}
                            </button>
                          )}
                          {o.status === 'paid' && (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${waTextApproved}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ padding: '4px 8px', background: '#25d366', color: '#ffffff', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}
                            >
                              💬 WhatsApp
                            </a>
                          )}
                          {o.status === 'paid' && (
                            <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #e2e8f0', width: '100%' }}>
                              {!o.emailSentAt ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                  <span style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecdd3', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                                    Email not sent yet
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSendEmailModal(o)}
                                    style={{
                                      padding: '4px 10px',
                                      background: 'var(--purple)',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    📧 Send download email
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSendEmailModal(o)}
                                    style={{
                                      padding: '3px 8px',
                                      background: '#ffffff',
                                      border: '1px solid #7855f5',
                                      color: '#7855f5',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Resend download email
                                  </button>
                                  <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.25 }}>
                                    Last sent: {new Date(o.emailSentAt).toLocaleString('en-MY')} to {o.emailLastSentTo || o.email}
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                                    Sent {o.emailSentCount || 1} time(s)
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                    {o.paymentRefNo && (
                      <div>
                        <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>PAYMENT REF NO.</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy)' }}>{o.paymentRefNo}</span>
                          {o.method === 'manual' && o.status === 'paid' && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOrderRefId(o.orderId);
                                setEditingRefValue(o.paymentRefNo || '');
                                setEditDuplicateError(null);
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: '12px' }}
                              title="Edit payment reference number"
                            >
                              ✏️
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {o.method === 'stripe' && o.stripePaymentIntentId && (
                      <div>
                        <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>STRIPE INTENT</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#475569', fontSize: '12px' }}>
                          {o.stripePaymentIntentId}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rejection reason if rejected */}
                  {o.status === 'rejected' && o.rejectReason && (
                    <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', color: '#991b1b', fontSize: '12px', marginBottom: '14px' }}>
                      <strong>Rejection reason:</strong> {o.rejectReason}
                    </div>
                  )}

                  {/* Email delivery status */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '14px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', color: '#475569' }}>
                      <span style={{ fontWeight: 800, color: 'var(--navy)' }}>✉️ Notification Emails:</span>
                      {o.pendingEmailSentAt && (
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px' }}>
                          ⏳ Pending: {new Date(o.pendingEmailSentAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {o.emailSentAt && (
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px' }}>
                          ✓ Approved: {new Date(o.emailSentAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {o.rejectionEmailSentAt && (
                        <span style={{ background: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px' }}>
                          ✕ Rejected: {new Date(o.rejectionEmailSentAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {!o.pendingEmailSentAt && !o.emailSentAt && !o.rejectionEmailSentAt && (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>None sent yet</span>
                      )}
                    </div>

                    {(o.status === 'paid' || o.status === 'rejected' || o.status === 'under_review' || o.receiptKey) && (
                      <button
                        type="button"
                        disabled={processingAction === o.orderId}
                        onClick={() => handleResendEmail(o)}
                        style={{
                          padding: '5px 12px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--purple)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="Resend the latest notification email to customer"
                      >
                        {processingAction === o.orderId ? 'Sending…' : '🔄 Resend email'}
                      </button>
                    )}
                  </div>

                  {/* Payment reference input for manual review */}
                  {o.method === 'manual' && o.status !== 'paid' && (
                    <div
                      style={{
                        background: '#f8fafc',
                        border: duplicateErrors[o.orderId] ? '2px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--navy)' }}>
                          Payment reference no. <span style={{ fontWeight: 400, color: '#64748b' }}>(from your DuitNow / TnG app)</span>
                        </label>
                        {o.customerReference && (
                          <div style={{ fontSize: '12px', color: '#475569' }}>
                            <span style={{ color: '#64748b' }}>Customer entered: </span>
                            <strong style={{ fontFamily: 'monospace', color: 'var(--navy)', background: '#e2e8f0', padding: '1px 6px', borderRadius: '4px' }}>
                              {o.customerReference}
                            </strong>
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 20261025MBBEMYKL040OQR12345678"
                        value={paymentRefInputs[o.orderId] ?? (o.paymentRefNo || '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPaymentRefInputs((prev) => ({ ...prev, [o.orderId]: val }));
                          if (duplicateErrors[o.orderId]) {
                            setDuplicateErrors((prev) => ({ ...prev, [o.orderId]: null }));
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: duplicateErrors[o.orderId] ? '1px solid #ef4444' : '1px solid #cbd5e1',
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          background: '#ffffff',
                          color: 'var(--navy)',
                          boxSizing: 'border-box',
                        }}
                      />
                      {duplicateErrors[o.orderId] && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '8px 12px',
                            background: '#fee2e2',
                            border: '1px solid #fca5a5',
                            borderRadius: '6px',
                            color: '#991b1b',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <span>
                            ⚠ This reference number was already used for order <strong>{duplicateErrors[o.orderId]!.duplicateOrderId}</strong>. The same payment can't be used twice.
                          </span>
                          <button
                            type="button"
                            onClick={() => handleApprove(o, true)}
                            disabled={processingAction === o.orderId}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#b91c1c',
                              textDecoration: 'underline',
                              fontWeight: 800,
                              fontSize: '12px',
                              cursor: 'pointer',
                              padding: '2px 4px',
                            }}
                          >
                            Approve anyway
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline edit paymentRefNo for paid manual orders */}
                  {editingOrderRefId === o.orderId && (
                    <div style={{ background: '#f8fafc', border: editDuplicateError ? '2px solid #ef4444' : '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}>
                        ✏️ Edit payment reference no. (from DuitNow / TnG app):
                      </div>
                      <input
                        type="text"
                        value={editingRefValue}
                        onChange={(e) => {
                          setEditingRefValue(e.target.value);
                          if (editDuplicateError) setEditDuplicateError(null);
                        }}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, marginBottom: '8px', boxSizing: 'border-box' }}
                      />
                      {editDuplicateError && (
                        <div style={{ fontSize: '12px', color: '#991b1b', background: '#fee2e2', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px' }}>
                          ⚠ This reference number was already used for order <strong>#{editDuplicateError.duplicateOrderId}</strong>. The same payment can't be used twice.
                          <button
                            type="button"
                            onClick={() => handleSavePaymentRef(o.orderId, true)}
                            style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', marginLeft: '6px' }}
                          >
                            Save anyway
                          </button>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          disabled={savingRefEdit || !isValidPaymentRef(editingRefValue.trim())}
                          onClick={() => handleSavePaymentRef(o.orderId, false)}
                          style={{ padding: '6px 14px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: savingRefEdit || !isValidPaymentRef(editingRefValue.trim()) ? 'not-allowed' : 'pointer', opacity: savingRefEdit || !isValidPaymentRef(editingRefValue.trim()) ? 0.5 : 1 }}
                        >
                          {savingRefEdit ? 'Saving…' : 'Save Reference'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOrderRefId(null);
                            setEditDuplicateError(null);
                          }}
                          style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
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
                            disabled={
                              processingAction === o.orderId ||
                              !isValidPaymentRef((paymentRefInputs[o.orderId] ?? (o.paymentRefNo || '')).trim())
                            }
                            style={{
                              padding: '8px 18px',
                              background: '#22c55e',
                              border: 'none',
                              color: '#ffffff',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor:
                                processingAction === o.orderId ||
                                !isValidPaymentRef((paymentRefInputs[o.orderId] ?? (o.paymentRefNo || '')).trim())
                                  ? 'not-allowed'
                                  : 'pointer',
                              opacity: isValidPaymentRef((paymentRefInputs[o.orderId] ?? (o.paymentRefNo || '')).trim()) ? 1 : 0.5,
                            }}
                            title={
                              !isValidPaymentRef((paymentRefInputs[o.orderId] ?? (o.paymentRefNo || '')).trim())
                                ? 'Enter a valid payment reference number (at least 6 letters/numbers) to approve'
                                : 'Approve order'
                            }
                          >
                            {processingAction === o.orderId ? 'Approving…' : '✓ Approve & Unlock'}
                          </button>
                        </>
                      )}

                      {/* Send / Resend download email button for paid orders */}
                      {o.status === 'paid' && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {!o.emailSentAt ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecdd3', fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px' }}>
                                Email not sent yet
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenSendEmailModal(o)}
                                style={{
                                  padding: '8px 16px',
                                  background: 'var(--purple)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                              >
                                📧 Send download email
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenSendEmailModal(o)}
                                style={{
                                  padding: '7px 14px',
                                  background: '#ffffff',
                                  border: '1px solid #7855f5',
                                  color: '#7855f5',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                Resend download email
                              </button>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>
                                Last sent: {new Date(o.emailSentAt).toLocaleString('en-MY')} to {o.emailLastSentTo || o.email}
                              </div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>
                                Sent {o.emailSentCount || 1} time(s)
                              </div>
                            </div>
                          )}
                        </div>
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

      {/* Send Download Email Modal */}
      {sendingEmailOrder && (
        <div
          className="modal open"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (!sendingEmailLoading) setSendingEmailOrder(null);
          }}
        >
          <div
            className="modal-card"
            style={{ maxWidth: '440px', padding: '24px', background: '#ffffff', borderRadius: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--navy)', margin: '0 0 10px' }}>
              📧 Send Download Email
            </h3>
            <p style={{ color: '#475569', fontSize: '13px', margin: '0 0 16px', lineHeight: 1.5 }}>
              Send the download email for order <strong>#{sendingEmailOrder.orderId}</strong> to:
            </p>

            <div style={{ marginBottom: '16px' }}>
              <input
                type="email"
                value={sendingEmailInput}
                onChange={(e) => {
                  setSendingEmailInput(e.target.value);
                  if (sendingEmailError) setSendingEmailError(null);
                }}
                disabled={sendingEmailLoading}
                placeholder="customer@example.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: sendingEmailError ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {sendingEmailError && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '13px',
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {sendingEmailError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                disabled={sendingEmailLoading}
                onClick={() => setSendingEmailOrder(null)}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: sendingEmailLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sendingEmailLoading || !sendingEmailInput.trim()}
                onClick={handleConfirmSendEmail}
                style={{
                  padding: '8px 20px',
                  background: 'var(--purple)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: sendingEmailLoading || !sendingEmailInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: sendingEmailLoading || !sendingEmailInput.trim() ? 0.6 : 1,
                }}
              >
                {sendingEmailLoading ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Green Feedback Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#15803d',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            fontSize: '14px',
            fontWeight: 800,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
