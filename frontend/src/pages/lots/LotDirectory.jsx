import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { admin } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import './LotDirectory.css';

// Data: GET /api/v1/app/admin/lots (AdminController::lotDirectory, Super Admin only).
// Search, filters and paging run server-side; values match the DB enums
// (listing.status, sale_event.sale_format / sale_event.status).
const FORMAT_LABELS = { easy: 'Easy', express: 'Express', buy_now: 'Buy Now', tender: 'Tender' };
const STATUS_LABELS = {
  inventory: 'Inventory', pending_approval: 'Pending Approval', upcoming: 'Upcoming', active: 'Active',
  sold: 'Sold', cycle_ended_unsold: 'Ended Unsold', suspended: 'Suspended',
};
const SALE_STATUS_LABELS = {
  pending_approval: 'Pending Approval', grace_period: 'Grace Period', active: 'Active',
  closed_sold: 'Closed Sold', cancelled: 'Cancelled', cycle_ended_unsold: 'Ended Unsold',
};
const STATUS_OPTIONS = ['', ...Object.keys(STATUS_LABELS)];
const PER_PAGE = 40;

export default function LotDirectory() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [lots, setLots] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Wait for typing to pause before searching; a new search starts at page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      const q = query.trim();
      if (q !== debouncedQuery) { setDebouncedQuery(q); setPage(1); }
    }, 350);
    return () => clearTimeout(t);
  }, [query, debouncedQuery]);

  // Any filter change starts again from page 1.
  const withPageReset = (setter) => (value) => { setter(value); setPage(1); };
  const onTenant = withPageReset(setTenantFilter);
  const onFormat = withPageReset(setFormatFilter);
  const onStatus = withPageReset(setStatusFilter);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    admin.lots({ q: debouncedQuery, tenant_id: tenantFilter, format: formatFilter, status: statusFilter, page, per_page: PER_PAGE })
      .then((res) => {
        if (cancelled) return;
        const data = unwrap(res);
        const rows = data.listings || [];
        setLots((prev) => (page === 1 ? rows : [...prev, ...rows]));
        setTenants(data.tenants || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.status === 401 || err.status === 403
          ? 'You need to be signed in as Custodian (Super Admin) to view the Lot Directory.'
          : (err.message || 'Could not load lots. Please try again.'));
        if (page === 1) setLots([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery, tenantFilter, formatFilter, statusFilter, page]);

  const clearAll = () => { setQuery(''); setDebouncedQuery(''); setTenantFilter(''); setStatusFilter(''); setFormatFilter(''); setPage(1); };
  const remaining = total - lots.length;

  return (
    <div className="ld-page">
      <DashboardHeader homeTo="/" navItems={[
        { label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Users', to: '/user-directory' },
        { label: 'Lots', to: '/lot-directory', active: true }, { label: 'Sessions', to: '/trading-session-directory' },
      ]} />
      <main className="ld-main">
        <div className="legal-eyebrow">Custodian</div>
        <h1 className="ld-title">Lot Directory</h1>
        <p className="ld-sub">Every Listing submitted platform-wide, across every Tenant.</p>

        <input className="ld-search" placeholder="Search category or tenant" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="ld-filters">
          <select className="ld-select" value={tenantFilter} onChange={(e) => onTenant(e.target.value)}>
            <option value="">All Tenants</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="ld-select" value={formatFilter} onChange={(e) => onFormat(e.target.value)}>
            <option value="">All Formats</option>
            {Object.entries(FORMAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {STATUS_OPTIONS.map((st) => (
            <button key={st} onClick={() => onStatus(st)} className={`ld-status-btn${statusFilter === st ? ' ld-status-btn--active' : ''}`}>{st === '' ? 'All Statuses' : STATUS_LABELS[st]}</button>
          ))}
          <button className="ld-clear" onClick={clearAll}>Clear</button>
        </div>

        {!error && (
          <div className="ld-count">
            {loading && page === 1 ? 'Loading…' : `${total} matching Listing${total === 1 ? '' : 's'}${remaining > 0 ? ` · showing ${lots.length}` : ''}`}
          </div>
        )}

        {lots.length > 0 && (
          <div className="ld-table">
            <div className="ld-row ld-row--head">
              <span>Tenant</span><span>Category</span><span>Status</span><span>Format</span><span>Sale Status</span><span>Views</span>
            </div>
            {lots.map((l, i) => (
              <div key={`${l.id}-${l.sale_event_id || i}`} className="ld-row" style={{ background: i % 2 === 1 ? '#FCFCFB' : '#fff' }}>
                <span>{l.tenant_name}</span>
                <span className="ld-muted"><Link to={`/lot-detail?id=${l.id}`}>{l.category}{l.subcategory && ` — ${l.subcategory}`}</Link></span>
                <span>{STATUS_LABELS[l.status] || l.status}</span>
                <span className="ld-faint">{FORMAT_LABELS[l.sale_format] || '—'}</span>
                <span className="ld-faint">{l.sale_status ? (SALE_STATUS_LABELS[l.sale_status] || l.sale_status) : '—'}</span>
                <span>{l.view_count ?? 0}</span>
              </div>
            ))}
          </div>
        )}
        {error && <div className="ld-empty">{error}</div>}
        {!error && !loading && lots.length === 0 && <div className="ld-empty">No matching Listings.</div>}
        {!error && page < totalPages && remaining > 0 && (
          <button className="ld-more" disabled={loading} onClick={() => setPage(page + 1)}>
            {loading ? 'Loading…' : `Load ${Math.min(PER_PAGE, remaining)} more`}
          </button>
        )}
      </main>
      <footer className="ld-footer"><p>Approvals, rejections, and edits are recorded in the <Link to="/audit-ledger">Audit Ledger</Link>.</p></footer>
    </div>
  );
}
