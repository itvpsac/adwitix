import { useState, useEffect } from 'react';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import UserFormModal from '../../components/custodian/UserFormModal.jsx';
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
  const [kycFilter, setKycFilter] = useState(params.get('kyc') || 'all');
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();

  // Search and paging run server-side (UserController::index matches mobile,
  // name, recovery email and GSTIN; sorted by mobile). Wait for typing to
  // pause before querying; a new search starts again at page 1.
  const PER_PAGE = 50;
  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());
  useEffect(() => {
    const t = setTimeout(() => {
      const next = query.trim();
      if (next !== debouncedQuery) { setDebouncedQuery(next); setPage(1); }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  const { data: apiData, loading: apiLoading, error: apiError, reload } = useApiQuery(() => admin.users({
    q: debouncedQuery, page, per_page: PER_PAGE,
    ...(type !== 'all' && { type: type === 'Business' ? 'organization' : 'individual' }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(kycFilter !== 'all' && { kyc: kycFilter.toLowerCase() }),
  }), [debouncedQuery, page, type, statusFilter, kycFilter]);
  const apiRows = (!apiError && apiData && apiData.users) || [];
  const serverTotal = Number((apiData && apiData.total) ?? apiRows.length);
  const totalPages = Math.max(1, Number((apiData && apiData.totalPages) || 1));
  // Standing comes from the server (PartyModel::standing), most serious first.
  const STATUS = {
    frozen: ['Frozen', 'var(--color-danger)', 'var(--color-danger-bg)'],
    delisted: ['Delisted', 'var(--color-danger)', 'var(--color-danger-bg)'],
    shadow_banned: ['Shadow-banned', 'var(--color-warning)', 'var(--color-warning-bg)'],
    active: ['Active', 'var(--color-success)', 'var(--color-success-bg)'],
  };
  const source = apiRows.map((u) => {
    const [st, statusColor, statusBg] = STATUS[u.status] || STATUS.active;
    return {
      id: u.id,
      mobile: u.mobile_number || '—',
      name: u.full_name || u.mobile_number || '—',
      type: (u.entity_type || 'individual').toLowerCase() === 'organization' ? 'Business' : 'Individual',
      kyc: u.kyc_status ? u.kyc_status.charAt(0).toUpperCase() + u.kyc_status.slice(1) : 'Pending',
      traderRating: Number(u.star_rating ?? 3).toFixed(1),
      mmRating: Number(u.seller_star_rating ?? 0).toFixed(1),
      status: st, statusColor, statusBg,
    };
  });
  const filtered = source;
  const total = filtered.length;

  return (
    <ConsoleFrame header={<DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Users', to: '/user-directory', active: true }, { label: 'Lots', to: '/lot-directory' }, { label: 'Sessions', to: '/trading-session-directory' }]} />}>
    <div className="ud-page">
      <main className="ud-main">
        <div className="legal-eyebrow">Custodian</div>
        <div className="ud-titlebar">
          <h1 className="ud-title">User Directory</h1>
          <button type="button" className="ud-add" onClick={() => setAdding(true)}>+ Add user</button>
        </div>
        {adding && <UserFormModal onSubmit={(payload) => admin.createUser(payload)} onClose={() => setAdding(false)} onDone={(res) => { setAdding(false); if (res.party) navigate(`/user-detail?id=${res.party.id}`); else reload(); }} />}
        <p className="ud-sub">Every registered user, platform-wide, with dual Trader★/Market Maker★ ratings, KYC status, and account standing.</p>

        <div className="ud-search">
          <input placeholder="Search — mobile, name, email, GSTIN…" value={query} onChange={(e) => { setQuery(e.target.value); }} />
          <span className="ud-search__icon">⌕</span>
        </div>
        <div className="ud-filters">
          {['all', 'Individual', 'Business'].map((t) => (
            <button key={t} onClick={() => { setType(t); setPage(1); }} className={`ud-pill${type === t ? ' ud-pill--active' : ''}`}>{t === 'all' ? 'All Types' : t}</button>
          ))}
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="ud-select" aria-label="Status">
            <option value="all">All Statuses</option><option value="active">Active</option><option value="frozen">Frozen</option><option value="shadow_banned">Shadow-banned</option><option value="delisted">Delisted</option>
          </select>
          <select value={kycFilter} onChange={(e) => { setKycFilter(e.target.value); setPage(1); }} className="ud-select" aria-label="KYC">
            <option value="all">All KYC</option><option value="Verified">Verified</option><option value="Pending">Pending</option><option value="Submitted">Submitted</option><option value="Suspended">Suspended</option>
          </select>
          <button onClick={() => { setQuery(''); setType('all'); setStatusFilter('all'); setKycFilter('all'); setPage(1); }} className="ud-clear">Clear</button>
          <button onClick={reload} disabled={apiLoading} className="ud-refresh">↻ Refresh</button>
        </div>

        {!apiError && (
          <div className="ud-count">
            {apiLoading
              ? 'Loading…'
              : `Page ${page} of ${totalPages} · ${serverTotal}${serverTotal === 1 ? ' user' : ' users'}`}
          </div>
        )}

        <div className="ud-table">
          <div className="ud-row ud-row--head"><span>Mobile</span><span>Name</span><span>Type</span><span>KYC</span><span>Trader★</span><span>MM★</span><span>Status</span></div>
          {filtered.map((u, i) => (
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
        {!apiLoading && !apiError && total === 0 && <div className="ud-empty">{debouncedQuery || type !== 'all' || statusFilter !== 'all' || kycFilter !== 'all' ? 'No users match.' : 'No users yet.'}</div>}
        {!apiError && totalPages > 1 && (
          <div className="ud-pager">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={apiLoading || page <= 1} className="ud-pager__btn">← Previous</button>
            <span className="ud-pager__label">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={apiLoading || page >= totalPages} className="ud-pager__btn">Next →</button>
          </div>
        )}
      </main>
      <footer className="ud-footer"><p>Every status change here is written to the <Link to="/audit-ledger">Audit Ledger</Link>.</p></footer>
    </div>
    </ConsoleFrame>
  );
}
