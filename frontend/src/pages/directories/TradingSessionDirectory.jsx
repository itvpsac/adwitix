import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import './TradingSessionDirectory.css';

const FORMAT_LABELS = { easy: 'Easy', express: 'Express', buy_now: 'Buy Now', tender: 'Tender' };
const STATUS_DEFS = {
  pending_approval: { label: 'Pending Approval', color: '#9C5B1F', bg: '#F8F1E7' },
  grace_period: { label: 'Grace Period', color: '#9C6B1F', bg: '#FBF0DD' },
  active: { label: 'Active', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  closed_sold: { label: 'Closed Sold', color: '#1E2761', bg: '#E7E9F2' },
  cancelled: { label: 'Cancelled', color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
  cycle_ended_unsold: { label: 'Ended Unsold', color: 'var(--color-text-muted)', bg: '#EEF0F4' },
};
const STATUSES = ['', 'pending_approval', 'grace_period', 'active', 'closed_sold', 'cancelled', 'cycle_ended_unsold'];
const PER_PAGE = 40;
const money = (v) => (v == null ? '—' : `₹${Number(v).toLocaleString('en-IN')}`);

export default function TradingSessionDirectory() {
  const [tenantFilter, setTenantFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // GET /admin/trading-sessions — filtered and paginated server side.
  const { data, loading } = useApiQuery(
    () => admin.tradingSessions({ tenant_id: tenantFilter, format: formatFilter, status: statusFilter, page, per_page: PER_PAGE }),
    [tenantFilter, formatFilter, statusFilter, page],
  );
  const tenants = (data && data.tenants) || [];
  const total = (data && data.total) || 0;
  const totalPages = (data && data.totalPages) || 1;
  const rows = ((data && data.saleEvents) || []).map((se) => ({
    id: se.id,
    ern: se.ern,
    tenantName: se.tenant_name,
    category: se.category,
    format: se.sale_format,
    status: se.status,
    value: money(se.current_price ?? se.expected_value ?? se.reserve_value),
  }));
  const setFilter = (fn) => (v) => { fn(v); setPage(1); };

  return (
    <div className="sd-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Users', to: '/user-directory' }, { label: 'Lots', to: '/lot-directory' }, { label: 'Sessions', to: '/trading-session-directory', active: true }]} />
      <main className="sd-main">
        <div className="legal-eyebrow">Custodian</div>
        <h1 className="sd-title">Trading Session Directory</h1>
        <p className="sd-sub">Every Trading Session (sale event) across every Tenant — {total} total.</p>

        <div className="sd-filters">
          <select value={tenantFilter} onChange={(e) => setFilter(setTenantFilter)(e.target.value)} className="sd-select">
            <option value="">All Tenants</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={formatFilter} onChange={(e) => setFilter(setFormatFilter)(e.target.value)} className="sd-select">
            <option value="">All Formats</option>
            <option value="easy">Easy</option><option value="express">Express</option><option value="buy_now">Buy Now</option><option value="tender">Tender</option>
          </select>
          {STATUSES.map((st) => (
            <button key={st} onClick={() => setFilter(setStatusFilter)(st)} className={`sd-pill${statusFilter === st ? ' sd-pill--active' : ''}`}>{st === '' ? 'All Statuses' : STATUS_DEFS[st].label}</button>
          ))}
          <button onClick={() => { setTenantFilter(''); setFormatFilter(''); setStatusFilter(''); setPage(1); }} className="sd-clear">Clear</button>
        </div>

        <div className="sd-count">{total}{total === 1 ? ' matching session' : ' matching sessions'}{totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}</div>

        <div className="sd-table">
          <div className="sd-row sd-row--head"><span>ERN</span><span>Tenant</span><span>Category</span><span>Format</span><span>Status</span><span>Value</span></div>
          {rows.map((se, i) => {
            const meta = STATUS_DEFS[se.status] || { label: se.status, color: 'var(--color-text-muted)', bg: '#EEF0F4' };
            return (
              <div key={se.id} className="sd-row" style={{ background: i % 2 === 1 ? '#FCFCFB' : '#fff' }}>
                <span className="sd-cell-ern">{se.ern}</span>
                <span className="sd-cell-name">{se.tenantName}</span>
                <span className="sd-cell-muted">{se.category}</span>
                <span className="sd-cell-faint">{FORMAT_LABELS[se.format] || se.format}</span>
                <span><span className="sd-status" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span></span>
                <span className="sd-cell-value">{se.value}</span>
              </div>
            );
          })}
        </div>
        {loading && <div className="sd-empty">Loading…</div>}
        {!loading && total === 0 && <div className="sd-empty">No matching Trading Sessions.</div>}
        {totalPages > 1 && (
          <div className="sd-filters" style={{ justifyContent: 'center' }}>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="sd-pill">← Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="sd-pill">Next →</button>
          </div>
        )}
      </main>
      <footer className="sd-footer"><p>Session approvals are recorded in the <a href="/audit-ledger">Audit Ledger</a>.</p></footer>
    </div>
  );
}
