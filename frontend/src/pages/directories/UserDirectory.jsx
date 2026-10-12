import { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import './UserDirectory.css';


export default function UserDirectory() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [pageSize, setPageSize] = useState(40);

  const { data: apiData, loading: apiLoading } = useApiQuery(() => admin.users({ perPage: 200 }), []);
  const apiRows = (apiData && (apiData.users || apiData.parties || apiData.rows)) || [];
  const statusStyle = (st) => st === 'Delisted'
    ? { statusColor: 'var(--color-danger)', statusBg: 'var(--color-danger-bg)' }
    : st === 'Shadow-banned'
      ? { statusColor: 'var(--color-warning)', statusBg: 'var(--color-warning-bg)' }
      : { statusColor: 'var(--color-success)', statusBg: 'var(--color-success-bg)' };
  const source = apiRows.map((u) => {
    const st = u.delisted_at ? 'Delisted' : u.shadow_banned_at ? 'Shadow-banned' : 'Active';
    return {
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
  const q = query.trim().toLowerCase();
  if (q) filtered = filtered.filter((u) => `${u.mobile} ${u.name} ${u.type}`.toLowerCase().includes(q));
  const total = filtered.length;
  const page = filtered.slice(0, pageSize);

  return (
    <div className="ud-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Users', to: '/user-directory', active: true }, { label: 'Lots', to: '/lot-directory' }, { label: 'Sessions', to: '/trading-session-directory' }]} />
      <main className="ud-main">
        <div className="legal-eyebrow">Custodian</div>
        <h1 className="ud-title">User Directory</h1>
        <p className="ud-sub">Every registered user, platform-wide, with dual Trader★/Market Maker★ ratings, KYC status, and account standing.</p>

        <div className="ud-search">
          <input placeholder="Search — mobile, name, email, GSTIN, PAN…" value={query} onChange={(e) => { setQuery(e.target.value); setPageSize(40); }} />
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
            <option value="all">All KYC</option><option value="Verified">Verified</option><option value="Pending">Pending</option><option value="Suspended">Suspended</option>
          </select>
          <button onClick={() => { setQuery(''); setType('all'); setStatusFilter('all'); setKycFilter('all'); setPageSize(40); }} className="ud-clear">Clear</button>
          <button onClick={() => setPageSize(pageSize)} className="ud-refresh">↻ Refresh</button>
        </div>

        <div className="ud-count">{total}{total === 1 ? ' matching user' : ' matching users'}{total > page.length ? ` · showing ${page.length}` : ''}</div>

        <div className="ud-table">
          <div className="ud-row ud-row--head"><span>Mobile</span><span>Name</span><span>Type</span><span>KYC</span><span>Trader★</span><span>MM★</span><span>Status</span></div>
          {page.map((u, i) => (
            <Link to="/user-detail" key={u.mobile} className="ud-row" style={{ background: i % 2 === 1 ? '#FCFCFB' : '#fff' }}>
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
        {!apiLoading && total === 0 && <div className="ud-empty">{apiRows.length === 0 ? 'No users yet.' : 'No users match your search/filters.'}</div>}
        {total > page.length && <button onClick={() => setPageSize(pageSize + 40)} className="ud-load-more">Load {Math.min(40, total - page.length)} more</button>}
      </main>
      <footer className="ud-footer"><p>Every status change here is written to the <a href="/audit-ledger">Audit Ledger</a>.</p></footer>
    </div>
  );
}
