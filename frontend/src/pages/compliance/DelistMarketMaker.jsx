import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { nowStamp, pushLedger, loadJSON, saveJSON } from '../../utils/auditLedger.js';
import '../compliance/CustodianShared.css';
import './DelistMarketMaker.css';

const MMS = [
  { id: 'mm1', name: 'Northline Salvage Co.', mobile: '91xxxxxx02', tsx: 'Ironclad Metals TSX', rating: '3.8', activeLots: 6, openDisputes: 1 },
  { id: 'mm2', name: 'Ravindra Auto Traders', mobile: '98xxxxxx31', tsx: 'AutoYard TSX', rating: '4.6', activeLots: 12, openDisputes: 0 },
  { id: 'mm3', name: 'Coastal Scrap Metals', mobile: '97xxxxxx55', tsx: 'Ironclad Metals TSX', rating: '2.1', activeLots: 3, openDisputes: 3 },
];

export default function DelistMarketMaker() {
  const [showInfo, setShowInfo] = useState(false);
  const [query, setQuery] = useState('');
  const [reasons, setReasons] = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const [decisions, setDecisions] = useState(loadJSON('adwitix_delisted_mms', {}));

  const q = query.trim().toLowerCase();
  let all = MMS.filter((m) => !decisions[m.id]);
  if (q) all = all.filter((m) => [m.name, m.mobile, m.tsx].join(' ').toLowerCase().includes(q));
  const delisted = Object.entries(decisions).map(([id, d]) => ({ id, ...d }));

  const confirmDelist = (m) => {
    const reason = (reasons[m.id] || '').trim();
    if (!reason) return;
    const next = { ...decisions, [m.id]: { name: m.name, reason, at: nowStamp() } };
    saveJSON('adwitix_delisted_mms', next);
    pushLedger('Delisted Market Maker', m.name, reason);
    setDecisions(next);
    setConfirmId(null);
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
          <input placeholder="Search — name, mobile, TradeSphereX…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <span className="custodian-search__icon">⌕</span>
        </div>

        <div className="dmm-list">
          {all.map((m) => {
            const confirming = confirmId === m.id;
            const reason = reasons[m.id] || '';
            return (
              <div key={m.id} className="dmm-row">
                <div className="dmm-row__head">
                  <div>
                    <div className="dmm-name">{m.name}</div>
                    <div className="dmm-meta">{m.mobile} · {m.tsx}</div>
                  </div>
                  <div className="dmm-stats">
                    <span>MM★ {m.rating}</span>
                    <span>{m.activeLots} active Lots</span>
                    <span style={{ color: m.openDisputes > 0 ? 'var(--color-danger)' : 'var(--color-text-faint)' }}>{m.openDisputes} open disputes</span>
                  </div>
                </div>
                {confirming ? (
                  <div className="dmm-confirm">
                    <textarea placeholder="Reason for delisting (required, recorded to Audit Ledger)…" value={reason} onChange={(e) => setReasons({ ...reasons, [m.id]: e.target.value })} rows={2} className="custodian-textarea" />
                    <div className="custodian-btn-row">
                      <button onClick={() => confirmDelist(m)} disabled={!reason.trim()} className="custodian-btn-danger" style={{ opacity: reason.trim() ? 1 : 0.5 }}>Confirm Delist</button>
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

        {delisted.length > 0 && (
          <>
            <h2 className="custodian-decided-title">Delisted</h2>
            <div className="custodian-decided-list">
              {delisted.map((d) => (
                <div key={d.id} className="dmm-delisted-row">
                  <div className="dmm-delisted-name">{d.name} — DELISTED</div>
                  <div className="dmm-delisted-meta">{d.at} by Custodian · {d.reason}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
