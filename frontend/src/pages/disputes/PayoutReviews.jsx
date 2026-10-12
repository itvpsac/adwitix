import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import './PayoutReviews.css';

function nowStamp() { return new Date().toISOString().slice(0, 16).replace('T', ' '); }
function loadDecisions() { try { return JSON.parse(localStorage.getItem('adwitix_payout_decisions') || '{}'); } catch (e) { return {}; } }
function saveDecisions(d) { localStorage.setItem('adwitix_payout_decisions', JSON.stringify(d)); }
function pushLedger(action, target, detail) {
  try {
    const key = 'adwitix_audit_ledger';
    const cur = JSON.parse(localStorage.getItem(key) || '[]');
    cur.push({ at: nowStamp(), actorRole: 'Custodian', actorName: 'Custodian', actorMobile: '—', action, target, detail });
    localStorage.setItem(key, JSON.stringify(cur));
  } catch (e) { /* noop */ }
}
const QUEUE = [
  { id: 'py1', name: 'Northline Salvage Co.', role: 'Market Maker', mobile: '91xxxxxx02', at: '2026-08-01 14:22', coolEnds: '2026-08-02 14:22', oldAcct: 'HDFC ••4821', newAcct: 'ICICI ••7710' },
  { id: 'py2', name: 'Priya Rao', role: 'Trader', mobile: '99xxxxxx88', at: '2026-08-02 08:00', coolEnds: '2026-08-03 08:00', oldAcct: 'SBI ••1190', newAcct: 'Axis ••3345' },
];

export default function PayoutReviews() {
  const [showInfo, setShowInfo] = useState(false);
  const [blockId, setBlockId] = useState(null);
  const [blockReasons, setBlockReasons] = useState({});
  const [decisions, setDecisions] = useState(loadDecisions());

  const pending = QUEUE.filter((p) => !decisions[p.id]);
  const decided = Object.entries(decisions).map(([id, d]) => ({ id, ...d }));

  const approveEarly = (p) => {
    const next = { ...decisions, [p.id]: { status: 'APPROVED EARLY', name: p.name, at: nowStamp() } };
    saveDecisions(next);
    pushLedger('Approved Payout Change Early', p.name, `${p.oldAcct} → ${p.newAcct}`);
    setDecisions(next);
  };
  const confirmBlock = (p) => {
    const reason = (blockReasons[p.id] || '').trim();
    if (!reason) return;
    const next = { ...decisions, [p.id]: { status: 'BLOCKED', name: p.name, at: nowStamp(), reason } };
    saveDecisions(next);
    pushLedger('Blocked Payout Change', p.name, reason);
    setDecisions(next);
    setBlockId(null);
  };

  return (
    <div className="py-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Payout Reviews', to: '/payout-reviews', active: true }]} />
      <main className="py-main">
        <div className="legal-eyebrow">Custodian</div>
        <div className="py-title-row">
          <h1 className="py-title">Payout Reviews</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="py-info-btn">i</button>
        </div>
        <p className="py-sub">Bank account changes are held for a 24-hour cooling-off period before taking effect. Approve early to release funds sooner, or block a change that looks suspicious — blocking requires a reason.</p>
        {showInfo && (
          <div className="py-info-box">
            <strong>Why this screen exists:</strong> Bank account changes are held for a 24-hour cooling-off period before taking effect, to prevent same-day account takeover. A Custodian may approve early or block the change; blocking requires a stated reason.
            <button onClick={() => setShowInfo(false)} className="py-info-close">Close</button>
          </div>
        )}

        <div className="py-list">
          {pending.map((p) => {
            const blocking = blockId === p.id;
            const reason = blockReasons[p.id] || '';
            return (
              <div key={p.id} className="py-row">
                <div className="py-row__head">
                  <div>
                    <div className="py-row__name">{p.name} <span className="py-row__role">({p.role})</span></div>
                    <div className="py-row__meta">{p.mobile} · requested {p.at}</div>
                  </div>
                  <span className="py-cool">Cooling-off ends {p.coolEnds}</span>
                </div>
                <div className="py-accts">
                  <span>Old: {p.oldAcct}</span><span>→</span><span className="py-accts__new">New: {p.newAcct}</span>
                </div>
                {blocking ? (
                  <>
                    <textarea placeholder="Reason for blocking (required)…" value={reason} onChange={(e) => setBlockReasons({ ...blockReasons, [p.id]: e.target.value })} rows={2} className="py-textarea" />
                    <div className="py-btn-row">
                      <button onClick={() => confirmBlock(p)} disabled={!reason.trim()} className="py-btn-danger" style={{ opacity: reason.trim() ? 1 : 0.5 }}>Confirm Block</button>
                      <button onClick={() => setBlockId(null)} className="py-btn-outline">Cancel</button>
                    </div>
                  </>
                ) : (
                  <div className="py-btn-row">
                    <button onClick={() => approveEarly(p)} className="py-btn-success">Approve Early</button>
                    <button onClick={() => setBlockId(p.id)} className="py-btn-danger-outline">Block…</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {pending.length === 0 && <div className="py-empty">No payout changes pending review.</div>}

        {decided.length > 0 && (
          <>
            <h2 className="py-decided-title">Decided</h2>
            <div className="py-decided-list">
              {decided.map((d) => (
                <div key={d.id} className="py-decided-row">
                  <span className="py-decided-status" style={{ color: d.status === 'APPROVED EARLY' ? 'var(--color-success)' : 'var(--color-danger)' }}>{d.status}</span>
                  <span className="py-decided-body"> — {d.name} · DECIDED {d.at} BY Custodian</span>
                  {d.reason && <div className="py-decided-reason">{d.reason}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
