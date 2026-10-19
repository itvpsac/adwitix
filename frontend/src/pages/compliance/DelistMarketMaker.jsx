import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { pushLedger } from '../../utils/auditLedger.js';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import '../compliance/CustodianShared.css';
import './DelistMarketMaker.css';

const stamp = (v) => (v || '').slice(0, 16).replace('T', ' ');

export default function DelistMarketMaker() {
  const [showInfo, setShowInfo] = useState(false);
  const [query, setQuery] = useState('');
  const [reasons, setReasons] = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');

  // GET /admin/users?q= searches mobile, name, email and GSTIN server side.
  const q = query.trim();
  const { data, loading, reload } = useApiQuery(() => admin.users(q ? { q } : {}), [q]);
  const users = (data && data.users) || [];
  const toRow = (u) => ({
    id: u.id,
    name: u.full_name || u.mobile_number,
    mobile: u.mobile_number,
    entity: (u.entity_type || '').replace(/_/g, ' '),
    rating: u.seller_star_rating != null ? Number(u.seller_star_rating).toFixed(1) : '—',
    kyc: u.kyc_status,
    delistedAt: stamp(u.seller_delisted_at),
    delistReason: u.seller_delisted_reason,
  });
  const all = users.filter((u) => !u.seller_delisted_at).map(toRow);
  const delisted = users.filter((u) => u.seller_delisted_at).map(toRow);

  const confirmDelist = async (m) => {
    const reason = (reasons[m.id] || '').trim();
    if (!reason) return;
    setBusyId(m.id);
    setActionError('');
    try {
      const res = await admin.delistSeller({ mobile_number: m.mobile, confirmed_fraud_reason: reason });
      pushLedger('Delisted Market Maker', m.name, reason);
      setNotice((res && res.data && res.data.message) || `${m.name} delisted.`);
      setConfirmId(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Delisting failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="custodian-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Delist Market Maker', to: '/delist-market-maker', active: true }]} />
      <main className="custodian-main">
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">Delist Market Maker</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="custodian-info-btn">i</button>
        </div>
        <p className="custodian-sub">Removing a Market Maker's selling rights platform-wide is irreversible from here and requires a stated reason — it is recorded to the Audit Ledger and cannot be undone by any TSX Master.</p>
        {showInfo && (
          <div className="custodian-info-box">
            <strong>Why this screen exists:</strong> A Market Maker can be delisted for repeated dispute losses, standing below threshold, or compliance violations. Delisting is platform-wide, immediate, and requires a stated reason on record.
            <button onClick={() => setShowInfo(false)} className="custodian-info-close">Close</button>
          </div>
        )}

        <div className="custodian-search">
          <input placeholder="Search — name, mobile, email, GSTIN…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <span className="custodian-search__icon">⌕</span>
        </div>

        {notice && <div className="custodian-info-box">{notice}</div>}
        {actionError && <div className="custodian-empty" style={{ color: 'var(--color-danger)' }}>{actionError}</div>}
        <div className="dmm-list">
          {all.map((m) => {
            const confirming = confirmId === m.id;
            const reason = reasons[m.id] || '';
            return (
              <div key={m.id} className="dmm-row">
                <div className="dmm-row__head">
                  <div>
                    <div className="dmm-name">{m.name}</div>
                    <div className="dmm-meta">{m.mobile}{m.entity ? ` · ${m.entity}` : ''}</div>
                  </div>
                  <div className="dmm-stats">
                    <span>MM★ {m.rating}</span>
                    <span>KYC {m.kyc || '—'}</span>
                  </div>
                </div>
                {confirming ? (
                  <div className="dmm-confirm">
                    <textarea placeholder="Reason for delisting (required, recorded to Audit Ledger)…" value={reason} onChange={(e) => setReasons({ ...reasons, [m.id]: e.target.value })} rows={2} className="custodian-textarea" />
                    <div className="custodian-btn-row">
                      <button onClick={() => confirmDelist(m)} disabled={!reason.trim() || busyId === m.id} className="custodian-btn-danger" style={{ opacity: reason.trim() && busyId !== m.id ? 1 : 0.5 }}>{busyId === m.id ? 'Delisting…' : 'Confirm Delist'}</button>
                      <button onClick={() => setConfirmId(null)} className="custodian-btn-outline">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmId(m.id)} className="dmm-start-btn">Delist Market Maker…</button>
                )}
              </div>
            );
          })}
        </div>

        {loading && <div className="custodian-empty">Loading…</div>}
        {!loading && all.length === 0 && <div className="custodian-empty">No matching users.</div>}

        {delisted.length > 0 && (
          <>
            <h2 className="custodian-decided-title">Delisted</h2>
            <div className="custodian-decided-list">
              {delisted.map((d) => (
                <div key={d.id} className="dmm-delisted-row">
                  <div className="dmm-delisted-name">{d.name} — DELISTED</div>
                  <div className="dmm-delisted-meta">{d.delistedAt} by Custodian · {d.delistReason}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
