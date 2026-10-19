import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import '../compliance/CustodianShared.css';
import './Invoices.css';

const STATUS_META = {
  Paid: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  Pending: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
};
const STATUSES = ['all', 'Paid', 'Pending'];

export default function Invoices() {
  const [showInfo, setShowInfo] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  // GET /admin/tenant-invoices → { pending: [tenant_monthly_invoice] }
  const { data: apiData, loading: apiLoading, reload } = useApiQuery(() => admin.tenantInvoices(), []);
  const apiRows = (apiData && apiData.pending) || [];
  let all = apiRows.map((i) => ({
    id: i.id,
    tsx: i.tenant_name || i.tenant_id || '—',
    invoiceId: i.invoice_number || i.id,
    period: `${(i.period_start || '').slice(0, 10)} → ${(i.period_end || '').slice(0, 10)}`,
    amount: i.total_amount != null ? `₹${Number(i.total_amount).toLocaleString('en-IN')}` : '—',
    due: (i.generated_at || '').slice(0, 10),
    status: i.status === 'paid' ? 'Paid' : 'Pending',
  }));

  const markPaid = async (inv) => {
    setBusyId(inv.id);
    setActionError('');
    try {
      await admin.markInvoicePaid(inv.id, {});
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not mark the invoice paid.');
    } finally {
      setBusyId(null);
    }
  };
  if (status !== 'all') all = all.filter((i) => i.status === status);
  const q = query.trim().toLowerCase();
  if (q) all = all.filter((i) => `${i.tsx} ${i.invoiceId}`.toLowerCase().includes(q));

  return (
    <div className="custodian-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Invoices', to: '/invoices', active: true }]} />
      <main className="custodian-main custodian-main--wide">
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">TradeSphereX Invoices</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="custodian-info-btn">i</button>
        </div>
        <p className="custodian-sub">Platform billing across all TradeSphereX tenants — subscription and usage-based invoices, in one place.</p>
        {showInfo && (
          <div className="custodian-info-box">
            <strong>Why this screen exists:</strong> Subscription and usage-based billing across every TradeSphereX tenant is consolidated here for Custodian oversight of platform revenue and dues.
            <button onClick={() => setShowInfo(false)} className="custodian-info-close">Close</button>
          </div>
        )}

        <div className="custodian-search">
          <input placeholder="Search — TradeSphereX name, invoice ID…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <span className="custodian-search__icon">⌕</span>
        </div>
        <div className="custodian-filters">
          {STATUSES.map((v) => (
            <button key={v} onClick={() => setStatus(v)} className={`custodian-filter-pill${status === v ? ' custodian-filter-pill--active' : ''}`}>{v === 'all' ? 'All' : v}</button>
          ))}
        </div>

        <div className="iv-table">
          <div className="iv-row iv-row--head"><span>TradeSphereX</span><span>Invoice</span><span>Period</span><span style={{ textAlign: 'right' }}>Amount</span><span>Generated</span><span>Status</span></div>
          {all.map((i) => {
            const meta = STATUS_META[i.status];
            return (
              <div key={i.invoiceId} className="iv-row">
                <span className="iv-cell-tsx">{i.tsx}</span>
                <span className="iv-cell-mono">{i.invoiceId}</span>
                <span className="iv-cell-muted">{i.period}</span>
                <span className="iv-cell-amount">{i.amount}</span>
                <span className="iv-cell-muted">{i.due}</span>
                <span>
                  <span className="iv-status" style={{ color: meta.color, background: meta.bg }}>{i.status}</span>
                  {i.status === 'Pending' && (
                    <button className="custodian-filter-pill" style={{ marginLeft: 8 }} disabled={busyId === i.id} onClick={() => markPaid(i)}>
                      {busyId === i.id ? 'Saving…' : 'Mark paid'}
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        {actionError && <div className="custodian-empty" style={{ color: 'var(--color-danger)' }}>{actionError}</div>}
        {!apiLoading && all.length === 0 && <div className="custodian-empty">No invoices yet.</div>}
      </main>
    </div>
  );
}
