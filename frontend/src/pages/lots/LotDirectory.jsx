import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import './LotDirectory.css';

const TENANTS = [
  { id: 't1', name: 'Northline Industrial Auctions' }, { id: 't2', name: 'Coastal Fleet Disposals' },
  { id: 't3', name: 'Metro Surplus Exchange' }, { id: 't4', name: 'Apex Fleet Disposals' },
];
const FORMAT_LABELS = { easy: 'Easy', express: 'Express', buy_now: 'Buy Now', tender: 'Tender' };
const STATUS_LABELS = { inventory: 'Inventory', pending_approval: 'Pending Approval', upcoming: 'Upcoming', active: 'Active', archived: 'Archived' };
const SALE_STATUS_LABELS = { pending_approval: 'Pending Approval', grace_period: 'Grace Period', active: 'Active', closed_sold: 'Closed Sold', cancelled: 'Cancelled' };

function buildLots() {
  const categories = [['Industrial Machinery', 'CNC Lathe'], ['Fleet Vehicles', 'Delivery Van'], ['Warehouse Equipment', 'Racking'], ['IT Assets', 'Server Rack'], ['Scrap Metal', 'Copper Wire']];
  const formats = ['easy', 'express', 'buy_now', 'tender'];
  const statuses = ['inventory', 'pending_approval', 'upcoming', 'active', 'archived'];
  const saleStatuses = ['pending_approval', 'grace_period', 'active', 'closed_sold', 'cancelled'];
  const out = [];
  for (let i = 0; i < 74; i++) {
    const tenant = TENANTS[i % TENANTS.length];
    const [category, subcategory] = categories[i % categories.length];
    const status = statuses[i % statuses.length];
    const hasSale = status === 'upcoming' || status === 'active' || status === 'archived';
    out.push({ tenantId: tenant.id, tenantName: tenant.name, category, subcategory: subcategory + (i > 9 ? ' #' + i : ''), format: formats[i % formats.length], status, saleStatus: hasSale ? saleStatuses[i % saleStatuses.length] : null, viewCount: (i * 13) % 400 });
  }
  return out;
}
const ALL_LOTS = buildLots();
const STATUS_OPTIONS = ['', 'inventory', 'pending_approval', 'upcoming', 'active', 'archived'];

export default function LotDirectory() {
  const [query, setQuery] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageSize, setPageSize] = useState(40);

  const filtered = useMemo(() => {
    let f = ALL_LOTS;
    if (tenantFilter) f = f.filter((l) => l.tenantId === tenantFilter);
    if (formatFilter) f = f.filter((l) => l.format === formatFilter);
    if (statusFilter) f = f.filter((l) => l.status === statusFilter);
    const q = query.trim().toLowerCase();
    if (q) f = f.filter((l) => (l.category + ' ' + l.subcategory + ' ' + l.tenantName).toLowerCase().includes(q));
    return f;
  }, [query, tenantFilter, formatFilter, statusFilter]);

  const page = filtered.slice(0, pageSize);
  const reset = () => setPageSize(40);

  return (
    <div className="ld-page">
      <DashboardHeader homeTo="/" navItems={[
        { label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Users', to: '/user-directory' },
        { label: 'Lots', to: '/lot-directory', active: true }, { label: 'Sessions', to: '/trading-session-directory' },
      ]} />
      <main className="ld-main">
        <div className="legal-eyebrow">Custodian</div>
        <h1 className="ld-title">Lot Directory</h1>
        <p className="ld-sub">Every Listing submitted platform-wide, across every Tenant — {ALL_LOTS.length} total.</p>

        <input className="ld-search" placeholder="Search category or tenant" value={query} onChange={(e) => { setQuery(e.target.value); reset(); }} />
        <div className="ld-filters">
          <select className="ld-select" value={tenantFilter} onChange={(e) => { setTenantFilter(e.target.value); reset(); }}>
            <option value="">All Tenants</option>
            {TENANTS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="ld-select" value={formatFilter} onChange={(e) => { setFormatFilter(e.target.value); reset(); }}>
            <option value="">All Formats</option><option value="easy">Easy</option><option value="express">Express</option><option value="buy_now">Buy Now</option><option value="tender">Tender</option>
          </select>
          {STATUS_OPTIONS.map((st) => (
            <button key={st} onClick={() => { setStatusFilter(st); reset(); }} className={`ld-status-btn${statusFilter === st ? ' ld-status-btn--active' : ''}`}>{st === '' ? 'All Statuses' : STATUS_LABELS[st]}</button>
          ))}
          <button className="ld-clear" onClick={() => { setQuery(''); setTenantFilter(''); setStatusFilter(''); setFormatFilter(''); reset(); }}>Clear</button>
        </div>

        <div className="ld-count">{filtered.length} matching Listing{filtered.length === 1 ? '' : 's'}{filtered.length > page.length ? ` · showing ${page.length}` : ''}</div>

        <div className="ld-table">
          <div className="ld-row ld-row--head">
            <span>Tenant</span><span>Category</span><span>Status</span><span>Format</span><span>Sale Status</span><span>Views</span>
          </div>
          {page.map((l, i) => (
            <div key={i} className="ld-row" style={{ background: i % 2 === 1 ? '#FCFCFB' : '#fff' }}>
              <span>{l.tenantName}</span>
              <span className="ld-muted"><Link to="/lot-detail">{l.category}{l.subcategory && ` — ${l.subcategory}`}</Link></span>
              <span>{STATUS_LABELS[l.status]}</span>
              <span className="ld-faint">{FORMAT_LABELS[l.format]}</span>
              <span className="ld-faint">{l.saleStatus ? SALE_STATUS_LABELS[l.saleStatus] : '—'}</span>
              <span>{l.viewCount}</span>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <div className="ld-empty">No matching Listings.</div>}
        {filtered.length > page.length && <button className="ld-more" onClick={() => setPageSize(pageSize + 40)}>Load {Math.min(40, filtered.length - page.length)} more</button>}
      </main>
      <footer className="ld-footer"><p>Approvals, rejections, and edits are recorded in the <Link to="/audit-ledger">Audit Ledger</Link>.</p></footer>
    </div>
  );
}
