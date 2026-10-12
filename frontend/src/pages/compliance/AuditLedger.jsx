import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import '../compliance/CustodianShared.css';
import './AuditLedger.css';

const ROLE_META = {
  Trader: { color: '#1E2761', bg: '#E7E9F2' },
  'Market Maker': { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  'TSX Master': { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  Custodian: { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
};
const ROLES = ['all', 'Trader', 'Market Maker', 'TSX Master', 'Custodian'];

export default function AuditLedger() {
  const [roleFilter, setRoleFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [pageSize, setPageSize] = useState(40);

  const { data: apiData, loading: apiLoading, error: apiError } = useApiQuery(() => admin.auditLog({ perPage: 200 }), []);
  const apiEntries = (apiData && (apiData.entries || apiData.logs || apiData.rows)) || [];
  const all = apiEntries.map((e) => ({
    at: (e.created_at || e.at || '').slice(0, 16).replace('T', ' '),
    actorRole: e.actor_role || e.actorRole || 'Trader',
    actorName: e.actor_name || e.actorName || e.actor_party_id || '—',
    actorMobile: e.actor_mobile || e.actorMobile || '—',
    action: e.event_type || e.action || '—',
    target: e.target || e.subject_id || '—',
    detail: typeof e.metadata === 'string' ? e.metadata : e.detail || (e.metadata ? JSON.stringify(e.metadata) : ''),
  })).sort((a, b) => (a.at < b.at ? 1 : -1));
  let filtered = roleFilter === 'all' ? all : all.filter((e) => e.actorRole === roleFilter);
  if (dateFrom) filtered = filtered.filter((e) => e.at.slice(0, 10) >= dateFrom);
  if (dateTo) filtered = filtered.filter((e) => e.at.slice(0, 10) <= dateTo);
  const q = query.trim().toLowerCase();
  if (q) filtered = filtered.filter((e) => [e.action, e.target, e.detail, e.actorName, e.actorMobile, e.actorRole].join(' ').toLowerCase().includes(q));
  const total = filtered.length;
  const page = filtered.slice(0, pageSize);

  return (
    <div className="custodian-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Audit Ledger', to: '/audit-ledger', active: true }, { label: 'Integrity Check', to: '/audit-chain-verify' }]} />
      <main className="custodian-main custodian-main--wide" style={{ maxWidth: 1200 }}>
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">Audit Ledger</h1>
        </div>
        {apiError && <p className="custodian-sub" style={{ color: 'var(--color-danger)' }}>Could not load the audit log — {apiError.message || 'the service is not reachable'}.</p>}
        <p className="custodian-sub" style={{ maxWidth: 660 }}>Every consequential action across the platform — by Trader, Market Maker, TSX Master, or Custodian — is recorded here for your review and the audit team's records. Nothing is excluded.</p>

        <div className="custodian-search">
          <input placeholder="Search — actor, mobile, action, target, reason, entry ID…" value={query} onChange={(e) => { setQuery(e.target.value); setPageSize(40); }} />
          <span className="custodian-search__icon">⌕</span>
        </div>

        <div className="custodian-filters">
          {ROLES.map((r) => (
            <button key={r} onClick={() => { setRoleFilter(r); setPageSize(40); }} className={`custodian-filter-pill${roleFilter === r ? ' custodian-filter-pill--active' : ''}`}>{r === 'all' ? 'All Roles' : r}</button>
          ))}
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPageSize(40); }} className="al-date" />
          <span className="al-to">to</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPageSize(40); }} className="al-date" />
          <button onClick={() => { setQuery(''); setDateFrom(''); setDateTo(''); setRoleFilter('all'); setPageSize(40); }} className="al-clear">Clear</button>
          <button onClick={() => setPageSize(pageSize)} className="al-refresh">↻ Refresh</button>
        </div>

        <div className="al-count">{total}{total === 1 ? ' matching entry' : ' matching entries'}{total > page.length ? ` · showing ${page.length}` : ''}</div>

        <div className="al-table">
          <div className="al-row al-row--head">
            <span>Timestamp</span><span>Role</span><span>Action / Target</span><span>Reason</span><span style={{ textAlign: 'right' }}>Actor</span>
          </div>
          {page.map((e, i) => {
            const expanded = expandedIdx === i;
            const roleMeta = ROLE_META[e.actorRole] || { color: 'var(--color-text-muted)', bg: '#EEF0F4' };
            return (
              <button key={i} onClick={() => setExpandedIdx(expanded ? null : i)} className="al-row al-row--data" style={{ background: expanded ? '#FAFAF8' : i % 2 === 1 ? '#FCFCFB' : '#fff', whiteSpace: expanded ? 'normal' : 'nowrap' }}>
                <span className="al-cell-time">{e.at}</span>
                <span className="al-role-badge" style={{ color: roleMeta.color, background: roleMeta.bg }}>{e.actorRole}</span>
                <span className="al-cell-action" style={{ whiteSpace: expanded ? 'normal' : 'nowrap' }}><strong>{e.action}</strong> — {e.target}</span>
                <span className="al-cell-detail" style={{ whiteSpace: expanded ? 'normal' : 'nowrap' }}>{e.detail}</span>
                <span className="al-cell-actor">{e.actorName}<br /><span className="al-cell-actor-mobile">{e.actorMobile}</span></span>
              </button>
            );
          })}
        </div>
        {!apiLoading && total === 0 && <div className="custodian-empty">{apiEntries.length === 0 ? 'No audit entries yet.' : 'No entries match your search/filters.'}</div>}
        {total > page.length && <button onClick={() => setPageSize(pageSize + 40)} className="al-load-more">Load {Math.min(40, total - page.length)} more</button>}
      </main>
      <footer className="al-footer"><p>This ledger is append-only and cannot be edited or deleted by any role, including the Custodian.</p></footer>
    </div>
  );
}
