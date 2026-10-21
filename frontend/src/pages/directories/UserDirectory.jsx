import { useState, useEffect } from 'react';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import './UserDirectory.css';


export default function UserDirectory() {
  // ?q= pre-fills the search (the Custodian Console's global search).
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [type, setType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [pageSize, setPageSize] = useState(40);

  // Search runs server-side (UserController::index matches mobile, name,
  // recovery email and GSTIN; returns at most 100 users). Wait for typing
  // to pause before querying.
  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);
  const { data: apiData, loading: apiLoading, error: apiError, reload } = useApiQuery(() => admin.users({ q: debouncedQuery }), [debouncedQuery]);
  const SERVER_LIMIT = 100;
  const apiRows = (!apiError && apiData && apiData.users) || [];
  const statusStyle = (st) => st === 'Delisted'
    ? { statusColor: 'var(--color-danger)', statusBg: 'var(--color-danger-bg)' }
    : st === 'Shadow-banned'
      ? { statusColor: 'var(--color-warning)', statusBg: 'var(--color-warning-bg)' }
      : { statusColor: 'var(--color-success)', statusBg: 'var(--color-success-bg)' };
  const source = apiRows.map((u) => {
    const st = u.seller_delisted_at ? 'Delisted' : (u.shadow_banned_at_buyer || u.shadow_banned_at_seller) ? 'Shadow-banned' : 'Active';
    return {
      id: u.id,
      mobile: u.mobile_number || '—',
      name: u.full_name || u.mobile_number || '—',
      type: (u.entity_type || 'individual').toLowerCase() === 'organization' ? 'Business' : 'Individual',
      kyc: u.kyc_status ? u.kyc_status.charAt(0).toUpperCase() + u.kyc_status.slice(1) : 'Pending',
      traderRating: Number(u.star_rating ?? 3).toFixed(1),
      mmRating: Number(u.seller_star_rating ?? 0).toFixed(1),
      status: st,
      ...statusStyle(st),
    };
  });
  let filtered = source;
  if (type !== 'all') filtered = filtered.filter((u) => u.type === type);
  if (statusFilter !== 'all') filtered = filtered.filter((u) => u.status === statusFilter);
  if (kycFilter !== 'all') filtered = filtered.filter((u) => u.kyc === kycFilter);
  const total = filtered.length;
  const page = filtered.slice(0, pageSize);

  return (
    <ConsoleFrame header={<DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Users', to: '/user-directory', active: true }, { label: 'Lots', to: '/lot-directory' }, { label: 'Sessions', to: '/trading-session-directory' }]} />}>
    <div className="ud-page">
      <main className="ud-main">
        <div className="legal-eyebrow">Custodian</div>
        <h1 className="ud-title">User Directory</h1>
        <p className="ud-sub">Every registered user, platform-wide, with dual Trader★/Market Maker★ ratings, KYC status, and account standing.</p>

        <div className="ud-search">
          <input placeholder="Search — mobile, name, email, GSTIN…" value={query} onChange={(e) => { setQuery(e.target.value); setPageSize(40); }} />
          <span className="ud-search__icon">⌕</span>
        </div>
        <div className="ud-filters">
          {['all', 'Individual', 'Business'].map((t) => (
            <button key={t} onClick={() => { setType(t); setPageSize(40); }} className={`ud-pill${type === t ? ' ud-pill--active' : ''}`}>{t === 'all' ? 'All Types' : t}</button>
          ))}
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPageSize(40); }} className="ud-select">
            <option value="all">All Statuses</option><option value="Active">Active</option><option value="Shadow-banned">Shadow-banned</option><option value="Delisted">Delisted</option>
          </select>
          <select value={kycFilter} onChange={(e) => { setKycFilter(e.target.value); setPageSize(40); }} className="ud-select">
            <option value="all">All KYC</option><option value="Verified">Verified</option><option value="Pending">Pending</option><option value="Submitted">Submitted</option><option value="Suspended">Suspended</option>
          </select>
          <button onClick={() => { setQuery(''); setType('all'); setStatusFilter('all'); setKycFilter('all'); setPageSize(40); }} className="ud-clear">Clear</button>
          <button onClick={reload} disabled={apiLoading} className="ud-refresh">↻ Refresh</button>
        </div>

        {!apiError && (
          <div className="ud-count">
            {apiLoading
              ? 'Loading…'
              : `${total}${total === 1 ? ' matching user' : ' matching users'}${total > page.length ? ` · showing ${page.length}` : ''}${apiRows.length >= SERVER_LIMIT ? ` · only the first ${SERVER_LIMIT} users are loaded — refine the search to find others` : ''}`}
          </div>
        )}

        <div className="ud-table">
          <div className="ud-row ud-row--head"><span>Mobile</span><span>Name</span><span>Type</span><span>KYC</span><span>Trader★</span><span>MM★</span><span>Status</span></div>
          {page.map((u, i) => (
            <Link to={`/user-detail?id=${u.id}`} key={u.id || u.mobile} className="ud-row" style={{ background: i % 2 === 1 ? '#FCFCFB' : '#fff' }}>
              <span className="ud-cell-mono">{u.mobile}</span>
              <span className="ud-cell-name">{u.name}</span>
              <span className="ud-cell-faint">{u.type}</span>
              <span className="ud-cell-faint-sm">{u.kyc}</span>
              <span>{u.traderRating}★</span>
              <span>{u.mmRating}★</span>
              <span><span className="ud-status" style={{ color: u.statusColor, background: u.statusBg }}>{u.status}</span></span>
            </Link>
          ))}
        </div>
        {apiError && (
          <div className="ud-empty">
            {apiError.status === 401 || apiError.status === 403
              ? 'You need to be signed in as Custodian (Super Admin) to view the User Directory.'
              : (apiError.message || 'Could not load users. Please try again.')}
          </div>
        )}
        {!apiLoading && !apiError && total === 0 && <div className="ud-empty">{apiRows.length === 0 ? (debouncedQuery ? 'No users match your search.' : 'No users yet.') : 'No users match your search/filters.'}</div>}
        {total > page.length && <button onClick={() => setPageSize(pageSize + 40)} className="ud-load-more">Load {Math.min(40, total - page.length)} more</button>}
      </main>
      <footer className="ud-footer"><p>Every status change here is written to the <Link to="/audit-ledger">Audit Ledger</Link>.</p></footer>
    </div>
    </ConsoleFrame>
  );
}
