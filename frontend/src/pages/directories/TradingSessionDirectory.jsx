import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import './TradingSessionDirectory.css';

const TENANTS = [
  { id: 't1', name: 'Northline Industrial Auctions' },
  { id: 't2', name: 'Coastal Fleet Disposals' },
  { id: 't3', name: 'Metro Surplus Exchange' },
  { id: 't4', name: 'Apex Fleet Disposals' },
];
const FORMAT_LABELS = { easy: 'Easy', express: 'Express', buy_now: 'Buy Now', tender: 'Tender' };
const STATUS_DEFS = {
  pending_approval: { label: 'Pending Approval', color: '#9C5B1F', bg: '#F8F1E7' },
  grace_period: { label: 'Grace Period', color: '#9C6B1F', bg: '#FBF0DD' },
  active: { label: 'Active', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  closed_sold: { label: 'Closed Sold', color: '#1E2761', bg: '#E7E9F2' },
  cancelled: { label: 'Cancelled', color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
};
const STATUSES = ['', 'pending_approval', 'grace_period', 'active', 'closed_sold', 'cancelled'];

function buildSessions() {
  const categories = ['Industrial Machinery', 'Fleet Vehicles', 'Warehouse Equipment', 'IT Assets', 'Scrap Metal'];
  const formats = ['easy', 'express', 'buy_now', 'tender'];
  const statuses = ['pending_approval', 'grace_period', 'active', 'closed_sold', 'cancelled'];
  const out = [];
  for (let i = 0; i < 61; i++) {
    const status = statuses[i % statuses.length];
    const tenant = TENANTS[i % TENANTS.length];
    out.push({
      ern: `ERN-202607${String(20 + (i % 10))}-${String(10 + i)}`,
      tenantId: tenant.id, tenantName: tenant.name,
      category: categories[i % categories.length],
      format: formats[i % formats.length],
      status,
      value: `₹${(i % 25) + 1},${String(10 + (i % 90))},000`,
    });
  }
  return out;
}
const ALL_SESSIONS = buildSessions();

export default function TradingSessionDirectory() {
  const [tenantFilter, setTenantFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageSize, setPageSize] = useState(40);

  let filtered = ALL_SESSIONS;
  if (tenantFilter) filtered = filtered.filter((se) => se.tenantId === tenantFilter);
  if (formatFilter) filtered = filtered.filter((se) => se.format === formatFilter);
  if (statusFilter) filtered = filtered.filter((se) => se.status === statusFilter);
  const total = filtered.length;
  const page = filtered.slice(0, pageSize);

  return (
    <div className="sd-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Users', to: '/user-directory' }, { label: 'Lots', to: '/lot-directory' }, { label: 'Sessions', to: '/trading-session-directory', active: true }]} />
      <main className="sd-main">
        <div className="legal-eyebrow">Custodian</div>
        <h1 className="sd-title">Trading Session Directory</h1>
        <p className="sd-sub">Every Trading Session (sale event) across every Tenant — {ALL_SESSIONS.length} total.</p>

        <div className="sd-filters">
          <select value={tenantFilter} onChange={(e) => { setTenantFilter(e.target.value); setPageSize(40); }} className="sd-select">
            <option value="">All Tenants</option>
            {TENANTS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={formatFilter} onChange={(e) => { setFormatFilter(e.target.value); setPageSize(40); }} className="sd-select">
            <option value="">All Formats</option>
            <option value="easy">Easy</option><option value="express">Express</option><option value="buy_now">Buy Now</option><option value="tender">Tender</option>
          </select>
          {STATUSES.map((st) => (
            <button key={st} onClick={() => { setStatusFilter(st); setPageSize(40); }} className={`sd-pill${statusFilter === st ? ' sd-pill--active' : ''}`}>{st === '' ? 'All Statuses' : STATUS_DEFS[st].label}</button>
          ))}
          <button onClick={() => { setTenantFilter(''); setFormatFilter(''); setStatusFilter(''); setPageSize(40); }} className="sd-clear">Clear</button>
        </div>

        <div className="sd-count">{total}{total === 1 ? ' matching session' : ' matching sessions'}{total > page.length ? ` · showing ${page.length}` : ''}</div>

        <div className="sd-table">
          <div className="sd-row sd-row--head"><span>ERN</span><span>Tenant</span><span>Category</span><span>Format</span><span>Status</span><span>Value</span></div>
          {page.map((se, i) => {
            const meta = STATUS_DEFS[se.status];
            return (
              <div key={se.ern} className="sd-row" style={{ background: i % 2 === 1 ? '#FCFCFB' : '#fff' }}>
                <span className="sd-cell-ern">{se.ern}</span>
                <span className="sd-cell-name">{se.tenantName}</span>
                <span className="sd-cell-muted">{se.category}</span>
                <span className="sd-cell-faint">{FORMAT_LABELS[se.format]}</span>
                <span><span className="sd-status" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span></span>
                <span className="sd-cell-value">{se.value}</span>
              </div>
            );
          })}
        </div>
        {total === 0 && <div className="sd-empty">No matching Trading Sessions.</div>}
        {total > page.length && <button onClick={() => setPageSize(pageSize + 40)} className="sd-load-more">Load {Math.min(40, total - page.length)} more</button>}
      </main>
      <footer className="sd-footer"><p>Session approvals are recorded in the <a href="/audit-ledger">Audit Ledger</a>.</p></footer>
    </div>
  );
}
