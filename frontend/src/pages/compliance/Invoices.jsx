import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { invoices } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import '../compliance/CustodianShared.css';
import './Invoices.css';

const STATUS_META = {
  Paid: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  Unbilled: { color: 'var(--color-text-muted)', bg: '#EEF0F4' },
  Overdue: { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
};
const STATUSES = ['all', 'Paid', 'Unbilled', 'Overdue'];

export default function Invoices() {
  const [showInfo, setShowInfo] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const { data: apiData, loading: apiLoading } = useApiQuery(() => invoices.index(), []);
  const apiRows = (apiData && (apiData.invoices || apiData.rows)) || [];
  let all = apiRows.map((i) => ({
    tsx: i.tenant_name || i.tsx || '—',
    invoiceId: i.invoice_number || i.id,
    period: i.period || i.billing_month || '—',
    amount: i.total_amount != null ? `₹${Number(i.total_amount).toLocaleString('en-IN')}` : (i.amount || '—'),
    due: (i.due_date || '').slice(0, 10),
    status: i.status === 'paid' ? 'Paid' : i.status === 'overdue' ? 'Overdue' : 'Unbilled',
  }));
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
          <div className="iv-row iv-row--head"><span>TradeSphereX</span><span>Invoice</span><span>Period</span><span style={{ textAlign: 'right' }}>Amount</span><span>Due</span><span>Status</span></div>
          {all.map((i) => {
            const meta = STATUS_META[i.status];
            return (
              <div key={i.invoiceId} className="iv-row">
                <span className="iv-cell-tsx">{i.tsx}</span>
                <span className="iv-cell-mono">{i.invoiceId}</span>
                <span className="iv-cell-muted">{i.period}</span>
                <span className="iv-cell-amount">{i.amount}</span>
                <span className="iv-cell-muted">{i.due}</span>
                <span><span className="iv-status" style={{ color: meta.color, background: meta.bg }}>{i.status}</span></span>
              </div>
            );
          })}
        </div>
        {!apiLoading && all.length === 0 && <div className="custodian-empty">No invoices yet.</div>}
      </main>
    </div>
  );
}
