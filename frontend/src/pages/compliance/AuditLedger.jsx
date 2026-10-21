import { useState } from 'react';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import '../compliance/CustodianShared.css';
import './AuditLedger.css';

export default function AuditLedger() {
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [page, setPage] = useState(1);

  // GET /admin/audit-log?from&to&page&per_page → { entries: [{ id,
  // occurred_at, event_type, actor_party_id, ip_address, payload,
  // record_hash, sequence_number, mobile_number }], total, page, perPage,
  // totalPages } — newest first; the date range is applied server-side.
  // The backend records no actor role or name.
  const { data: apiData, loading: apiLoading, error: apiError, reload } = useApiQuery(
    () => admin.auditLog({ from: dateFrom || undefined, to: dateTo || undefined, page, per_page: 100 }),
    [dateFrom, dateTo, page],
  );
  const apiEntries = (apiData && apiData.entries) || [];
  const all = apiEntries.map((e) => ({
    id: e.id,
    seq: e.sequence_number,
    at: (e.occurred_at || '').slice(0, 16).replace('T', ' '),
    actorMobile: e.mobile_number || (e.actor_party_id ? '—' : '(system)'),
    actorId: e.actor_party_id || '',
    action: e.event_type || '—',
    detail: typeof e.payload === 'string' ? e.payload : (e.payload ? JSON.stringify(e.payload) : ''),
  }));
  const serverTotal = (apiData && apiData.total) || 0;
  const totalPages = Math.max(1, (apiData && apiData.totalPages) || 1);
  const q = query.trim().toLowerCase();
  const rows = q ? all.filter((e) => [e.action, e.detail, e.actorMobile, e.actorId, e.id, e.seq].join(' ').toLowerCase().includes(q)) : all;
  const changeFilter = (fn) => (e) => { fn(e.target.value); setPage(1); setExpandedIdx(null); };
  const goTo = (p) => { setPage(p); setExpandedIdx(null); };

  return (
    <ConsoleFrame header={<DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Audit Ledger', to: '/audit-ledger', active: true }, { label: 'Integrity Check', to: '/audit-chain-verify' }]} />}>
    <div className="custodian-page">
      <main className="custodian-main custodian-main--wide" style={{ maxWidth: 1200 }}>
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">Audit Ledger</h1>
        </div>
        {apiError && <p className="custodian-sub" style={{ color: 'var(--color-danger)' }}>Could not load the audit log — {apiError.message || 'the service is not reachable'}.</p>}
        <p className="custodian-sub" style={{ maxWidth: 660 }}>Every consequential action across the platform — by Trader, Market Maker, TSX Master, or Custodian — is recorded here for your review and the audit team's records. Nothing is excluded.</p>

        <div className="custodian-search">
          <input placeholder="Search this page — mobile, action, payload, entry ID…" value={query} onChange={(e) => { setQuery(e.target.value); setExpandedIdx(null); }} />
          <span className="custodian-search__icon">⌕</span>
        </div>

        <div className="custodian-filters">
          <input type="date" value={dateFrom} onChange={changeFilter(setDateFrom)} className="al-date" />
          <span className="al-to">to</span>
          <input type="date" value={dateTo} onChange={changeFilter(setDateTo)} className="al-date" />
          <button onClick={() => { setQuery(''); setDateFrom(''); setDateTo(''); setPage(1); setExpandedIdx(null); }} className="al-clear">Clear</button>
          <button onClick={reload} disabled={apiLoading} className="al-refresh">↻ Refresh</button>
        </div>

        <div className="al-count">Page {apiData && apiData.page ? apiData.page : page} of {totalPages} · {serverTotal}{serverTotal === 1 ? ' entry' : ' entries'}{q ? ` · ${rows.length} matching search on this page` : ''}</div>

        <div className="al-table">
          <div className="al-row al-row--head">
            <span>Timestamp</span><span>Seq #</span><span>Action</span><span>Payload</span><span style={{ textAlign: 'right' }}>Actor</span>
          </div>
          {rows.map((e, i) => {
            const expanded = expandedIdx === i;
            return (
              <button key={e.id || i} onClick={() => setExpandedIdx(expanded ? null : i)} className="al-row al-row--data" style={{ background: expanded ? '#FAFAF8' : i % 2 === 1 ? '#FCFCFB' : '#fff', whiteSpace: expanded ? 'normal' : 'nowrap' }}>
                <span className="al-cell-time">{e.at}</span>
                <span className="al-role-badge" style={{ color: 'var(--color-text-muted)', background: '#EEF0F4' }}>{e.seq ?? '—'}</span>
                <span className="al-cell-action" style={{ whiteSpace: expanded ? 'normal' : 'nowrap' }}><strong>{e.action}</strong></span>
                <span className="al-cell-detail" style={{ whiteSpace: expanded ? 'normal' : 'nowrap' }}>{e.detail}</span>
                <span className="al-cell-actor">{e.actorMobile}{e.actorId && <><br /><span className="al-cell-actor-mobile">{e.actorId.slice(0, 8)}</span></>}</span>
              </button>
            );
          })}
        </div>
        {apiLoading && <div className="custodian-empty">Loading audit entries…</div>}
        {!apiLoading && !apiError && rows.length === 0 && <div className="custodian-empty">{apiEntries.length === 0 ? (dateFrom || dateTo ? 'No entries in this date range.' : 'No audit entries yet.') : 'No entries on this page match your search.'}</div>}
        {totalPages > 1 && (
          <div className="al-pager">
            <button onClick={() => goTo(page - 1)} disabled={apiLoading || page <= 1} className="al-load-more">← Previous</button>
            <span className="al-count">Page {page} of {totalPages}</span>
            <button onClick={() => goTo(page + 1)} disabled={apiLoading || page >= totalPages} className="al-load-more">Next →</button>
          </div>
        )}
      </main>
      <footer className="al-footer"><p>This ledger is append-only and cannot be edited or deleted by any role, including the Custodian.</p></footer>
    </div>
    </ConsoleFrame>
  );
}
