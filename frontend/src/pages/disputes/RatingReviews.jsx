import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import './RatingReviews.css';

function nowStamp() { return new Date().toISOString().slice(0, 16).replace('T', ' '); }
function loadDecisions() { try { return JSON.parse(localStorage.getItem('adwitix_rating_decisions') || '{}'); } catch (e) { return {}; } }
function saveDecisions(d) { localStorage.setItem('adwitix_rating_decisions', JSON.stringify(d)); }
function pushLedger(action, target, detail) {
  try {
    const key = 'adwitix_audit_ledger';
    const cur = JSON.parse(localStorage.getItem(key) || '[]');
    cur.push({ at: nowStamp(), actorRole: 'Custodian', actorName: 'Custodian', actorMobile: '—', action, target, detail });
    localStorage.setItem(key, JSON.stringify(cur));
  } catch (e) { /* noop */ }
}
const QUEUE = [
  { id: 'rt1', rater: 'Priya Rao (Trader)', ratee: 'Northline Salvage Co.', eventType: 'EXPRESS Trading Session', stars: 1, at: '2026-07-30 16:15', comment: 'Item did not match listing description at all.', disputeReason: 'This is retaliatory — the Trader submitted a lowball offer we rejected two days prior.' },
  { id: 'rt2', rater: 'Northline Salvage Co. (Market Maker)', ratee: 'Arjun Verma', eventType: 'Buy-Now', stars: 1, at: '2026-08-01 09:00', comment: 'Buyer failed to collect within window, cited no reason.', disputeReason: "I collected within the window — Market Maker's yard was closed on the scheduled day." },
];

export default function RatingReviews() {
  const [showInfo, setShowInfo] = useState(false);
  const [decidingId, setDecidingId] = useState(null);
  const [decidingType, setDecidingType] = useState(null);
  const [decisionReasons, setDecisionReasons] = useState({});
  const [decisions, setDecisions] = useState(loadDecisions());

  const pending = QUEUE.filter((r) => !decisions[r.id]);
  const decided = Object.entries(decisions).map(([id, d]) => ({ id, ...d }));

  const confirm = (r, isRemove) => {
    const reason = (decisionReasons[r.id] || '').trim();
    if (!reason) return;
    const status = isRemove ? 'REMOVED' : 'UPHELD';
    const next = { ...decisions, [r.id]: { status, rater: r.rater, ratee: r.ratee, at: nowStamp(), reason } };
    saveDecisions(next);
    pushLedger(isRemove ? 'Removed Rating' : 'Upheld Rating', `${r.rater} → ${r.ratee}`, reason);
    setDecisions(next);
    setDecidingId(null);
    setDecidingType(null);
  };

  return (
    <div className="rr-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Rating Reviews', to: '/rating-reviews', active: true }]} />
      <main className="rr-main">
        <div className="legal-eyebrow">Custodian</div>
        <div className="rr-title-row">
          <h1 className="rr-title">Rating Reviews</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="rr-info-btn">i</button>
        </div>
        <p className="rr-sub">Star ratings flagged as disputed by the party being rated. Uphold keeps the rating; Remove strikes it from the ledger. Either decision requires a stated reason.</p>
        {showInfo && (
          <div className="rr-info-box">
            <strong>Why this screen exists:</strong> A party may dispute a star rating they believe is inaccurate or retaliatory. The Custodian's decision to uphold or remove is final and requires a stated reason either way.
            <button onClick={() => setShowInfo(false)} className="rr-info-close">Close</button>
          </div>
        )}

        <div className="rr-list">
          {pending.map((r) => {
            const deciding = decidingId === r.id ? decidingType : null;
            const reason = decisionReasons[r.id] || '';
            const isRemove = deciding === 'remove';
            return (
              <div key={r.id} className="rr-row">
                <div className="rr-row__head">
                  <div>
                    <div className="rr-row__title">{r.rater} rated {r.ratee}</div>
                    <div className="rr-row__meta">{r.eventType} · {r.at}</div>
                  </div>
                  <span className="rr-stars">{r.stars}★</span>
                </div>
                <div className="rr-line"><strong>Rating comment:</strong> "{r.comment}"</div>
                <div className="rr-line rr-line--last"><strong>Dispute grounds ({r.ratee}):</strong> "{r.disputeReason}"</div>
                {deciding ? (
                  <>
                    <textarea placeholder="Reason for decision (required)…" value={reason} onChange={(e) => setDecisionReasons({ ...decisionReasons, [r.id]: e.target.value })} rows={2} className="rr-textarea" />
                    <div className="rr-btn-row">
                      <button onClick={() => confirm(r, isRemove)} disabled={!reason.trim()} className={isRemove ? 'rr-btn-danger' : 'rr-btn-success'} style={{ opacity: reason.trim() ? 1 : 0.5 }}>{isRemove ? 'Confirm Remove' : 'Confirm Uphold'}</button>
                      <button onClick={() => { setDecidingId(null); setDecidingType(null); }} className="rr-btn-outline">Cancel</button>
                    </div>
                  </>
                ) : (
                  <div className="rr-btn-row">
                    <button onClick={() => { setDecidingId(r.id); setDecidingType('uphold'); }} className="rr-btn-success-outline">Uphold Rating…</button>
                    <button onClick={() => { setDecidingId(r.id); setDecidingType('remove'); }} className="rr-btn-danger-outline">Remove Rating…</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {pending.length === 0 && <div className="rr-empty">No rating disputes pending review.</div>}

        {decided.length > 0 && (
          <>
            <h2 className="rr-decided-title">Decided</h2>
            <div className="rr-decided-list">
              {decided.map((d) => (
                <div key={d.id} className="rr-decided-row">
                  <span className="rr-decided-status" style={{ color: d.status === 'UPHELD' ? 'var(--color-success)' : 'var(--color-danger)' }}>{d.status}</span>
                  <span className="rr-decided-body"> — {d.rater}→{d.ratee} · DECIDED {d.at} BY Custodian</span>
                  <div className="rr-decided-reason">{d.reason}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
