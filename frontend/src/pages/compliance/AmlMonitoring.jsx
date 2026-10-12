import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { nowStamp, pushLedger, loadJSON, saveJSON } from '../../utils/auditLedger.js';
import '../compliance/CustodianShared.css';

const SEV_META = {
  Critical: { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', stripe: 'var(--color-danger)' },
  Warning: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', stripe: 'var(--color-accent)' },
};
const FLAGS = [
  { id: 'aml1', severity: 'Critical', flagType: 'High-Velocity Bidding', who: 'Trader — 99xxxxxx44', tsx: 'Ironclad Metals TSX', at: '2026-08-02 09:10', detail: 'Bids placed across 6 unrelated Lots within 90 seconds, all withdrawn before close.' },
  { id: 'aml2', severity: 'Warning', flagType: 'Rapid Buy-and-Resettle', who: 'Trader — 90xxxxxx17', tsx: 'AutoYard TSX', at: '2026-07-30 14:05', detail: 'Same Lot won and immediately relisted by a linked account at markup.' },
  { id: 'aml3', severity: 'Warning', flagType: 'Structuring Pattern', who: 'Market Maker — Coastal Scrap Metals', tsx: 'Ironclad Metals TSX', at: '2026-07-28 11:40', detail: 'Multiple Lots priced just under the ₹10L high-value disposal threshold.' },
];
const STATUSES = ['all', 'Open', 'Escalated', 'Cleared'];

export default function AmlMonitoring() {
  const [showInfo, setShowInfo] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [escalateId, setEscalateId] = useState(null);
  const [escalateReasons, setEscalateReasons] = useState({});
  const [resolutions, setResolutions] = useState(loadJSON('adwitix_aml_resolutions', {}));

  let all = FLAGS.map((f) => ({ ...f, decision: resolutions[f.id] }));
  if (statusFilter !== 'all') all = all.filter((f) => (f.decision ? f.decision.status : 'Open') === statusFilter);

  const clear = (f) => {
    const next = { ...resolutions, [f.id]: { status: 'Cleared', at: nowStamp() } };
    saveJSON('adwitix_aml_resolutions', next);
    pushLedger('Cleared AML Flag', f.flagType, f.who);
    setResolutions(next);
  };
  const confirmEscalate = (f) => {
    const reason = (escalateReasons[f.id] || '').trim();
    if (!reason) return;
    const next = { ...resolutions, [f.id]: { status: 'Escalated', at: nowStamp(), reason } };
    saveJSON('adwitix_aml_resolutions', next);
    pushLedger('Escalated AML Flag', f.flagType, reason);
    setResolutions(next);
    setEscalateId(null);
  };

  return (
    <div className="custodian-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'AML Monitoring', to: '/aml-monitoring', active: true }]} />
      <main className="custodian-main custodian-main--wide">
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">AML Monitoring</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="custodian-info-btn">i</button>
        </div>
        <p className="custodian-sub">Automated anti-money-laundering flags across bidding and settlement activity. Clear a flag once reviewed, or escalate it for deeper investigation with a stated reason.</p>
        {showInfo && (
          <div className="custodian-info-box">
            <strong>Why this screen exists:</strong> Flags are raised automatically by bidding-pattern and settlement-pattern rules — high velocity, structuring, and rapid resale. A Custodian clears or escalates each flag; escalation requires a stated reason.
            <button onClick={() => setShowInfo(false)} className="custodian-info-close">Close</button>
          </div>
        )}

        <div className="custodian-filters">
          {STATUSES.map((v) => (
            <button key={v} onClick={() => setStatusFilter(v)} className={`custodian-filter-pill${statusFilter === v ? ' custodian-filter-pill--active' : ''}`}>{v === 'all' ? 'All' : v}</button>
          ))}
        </div>

        <div className="aml-list">
          {all.map((f) => {
            const meta = SEV_META[f.severity];
            const status = f.decision ? f.decision.status : 'Open';
            const resolved = status !== 'Open';
            const escalating = escalateId === f.id;
            const reason = escalateReasons[f.id] || '';
            return (
              <div key={f.id} className="aml-flag" style={{ borderLeftColor: meta.stripe }}>
                <div className="aml-flag__head">
                  <span className="aml-sev" style={{ color: meta.color, background: meta.bg }}>{f.severity}</span>
                  <span className="aml-status" style={{ color: status === 'Cleared' ? 'var(--color-success)' : status === 'Escalated' ? 'var(--color-danger)' : 'var(--color-text-faint)' }}>{status}</span>
                </div>
                <div className="aml-flag__title">{f.flagType}</div>
                <div className="aml-flag__meta">{f.who} · {f.tsx} · {f.at}</div>
                <div className="aml-flag__detail">{f.detail}</div>
                {!resolved && (
                  escalating ? (
                    <>
                      <textarea placeholder="Reason for escalation (required)…" value={reason} onChange={(e) => setEscalateReasons({ ...escalateReasons, [f.id]: e.target.value })} rows={2} className="custodian-textarea" />
                      <div className="custodian-btn-row">
                        <button onClick={() => confirmEscalate(f)} disabled={!reason.trim()} className="custodian-btn-danger" style={{ opacity: reason.trim() ? 1 : 0.5 }}>Confirm Escalate</button>
                        <button onClick={() => setEscalateId(null)} className="custodian-btn-outline">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <div className="custodian-btn-row">
                      <button onClick={() => clear(f)} className="custodian-btn-success">Clear Flag</button>
                      <button onClick={() => setEscalateId(f.id)} className="custodian-btn-danger-outline">Escalate…</button>
                    </div>
                  )
                )}
                {resolved && <div className="aml-resolution">{status.toUpperCase()} — DECIDED {f.decision.at} BY Custodian{f.decision.reason ? ` · ${f.decision.reason}` : ''}</div>}
              </div>
            );
          })}
        </div>
        {all.length === 0 && <div className="custodian-empty">No flags match this filter.</div>}
      </main>
    </div>
  );
}
