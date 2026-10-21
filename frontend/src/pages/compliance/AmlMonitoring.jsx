import { useState } from 'react';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { pushLedger } from '../../utils/auditLedger.js';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import '../compliance/CustodianShared.css';

const SEV_META = {
  Critical: { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', stripe: 'var(--color-danger)' },
  Warning: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', stripe: 'var(--color-accent)' },
};
const FLAG_TYPES = {
  deposit_refund_cycle: { label: 'Deposit–Refund Cycling', severity: 'Warning' },
  kyc_inconsistent_deposit: { label: 'Deposit Inconsistent with KYC Profile', severity: 'Critical' },
  shared_funding_source: { label: 'Shared Funding Source', severity: 'Critical' },
};
const STATUS_LABEL = { open: 'Open', reviewed_str_filed: 'Escalated', reviewed_no_action: 'Cleared' };
const STATUSES = ['all', 'Open', 'Escalated', 'Cleared'];
const stamp = (v) => (v || '').slice(0, 16).replace('T', ' ');
// aml_flag.detail is a JSON-encoded object (AmlFlagModel::createFlag);
// render it as "key: value" pairs rather than raw JSON.
const formatDetail = (v) => {
  if (!v) return '';
  try {
    const obj = typeof v === 'string' ? JSON.parse(v) : v;
    if (obj && typeof obj === 'object') {
      return Object.entries(obj)
        .map(([k, val]) => `${k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase()}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
        .join(' · ');
    }
  } catch (e) { /* not JSON — show as-is */ }
  return String(v);
};

export default function AmlMonitoring() {
  const [showInfo, setShowInfo] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [escalateId, setEscalateId] = useState(null);
  const [escalateReasons, setEscalateReasons] = useState({});
  const [strRefs, setStrRefs] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  // GET /admin/aml → { open: [...], reviewed: [...] }
  const { data, loading, error, reload } = useApiQuery(() => admin.aml(), []);
  const rows = [...((data && data.open) || []), ...((data && data.reviewed) || [])];
  let all = rows.map((f) => {
    const type = FLAG_TYPES[f.flag_type] || { label: f.flag_type, severity: 'Warning' };
    const status = STATUS_LABEL[f.status] || 'Open';
    return {
      id: f.id,
      severity: type.severity,
      flagType: type.label,
      who: f.mobile_number || f.party_id,
      at: stamp(f.created_at),
      detail: formatDetail(f.detail),
      status,
      decision: status === 'Open' ? null : { at: stamp(f.reviewed_at), by: f.reviewer_mobile, reason: f.str_reference ? `STR ${f.str_reference}${f.review_notes ? ` · ${f.review_notes}` : ''}` : f.review_notes },
    };
  });
  if (statusFilter !== 'all') all = all.filter((f) => f.status === statusFilter);

  const review = async (f, payload, ledgerAction, ledgerDetail) => {
    setBusyId(f.id);
    setActionError('');
    try {
      await admin.amlReview(f.id, payload);
      pushLedger(ledgerAction, f.flagType, ledgerDetail);
      setEscalateId(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not record the review.');
    } finally {
      setBusyId(null);
    }
  };
  const clear = (f) => review(f, { decision: 'no_action', notes: 'Reviewed — no action required.' }, 'Cleared AML Flag', f.who);
  const confirmEscalate = (f) => {
    const reason = (escalateReasons[f.id] || '').trim();
    const strRef = (strRefs[f.id] || '').trim();
    if (!reason || !strRef) return;
    review(f, { decision: 'str_filed', str_reference: strRef, notes: reason }, 'Escalated AML Flag', reason);
  };

  return (
    <ConsoleFrame header={<DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'AML Monitoring', to: '/aml-monitoring', active: true }]} />}>
    <div className="custodian-page">
      <main className="custodian-main custodian-main--wide">
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">AML Monitoring</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="custodian-info-btn">i</button>
        </div>
        <p className="custodian-sub">Automated anti-money-laundering flags across bidding and settlement activity. Clear a flag once reviewed, or escalate it for deeper investigation with a stated reason.</p>
        {showInfo && (
          <div className="custodian-info-box">
            <strong>Why this screen exists:</strong> Flags are raised automatically by bidding-pattern and settlement-pattern rules — high velocity, structuring, and rapid resale. A Custodian clears or escalates each flag; escalation files a Suspicious Transaction Report and requires its reference and a stated reason.
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
            const status = f.status;
            const resolved = status !== 'Open';
            const escalating = escalateId === f.id;
            const reason = escalateReasons[f.id] || '';
            const strRef = strRefs[f.id] || '';
            const canEscalate = reason.trim() && strRef.trim() && busyId !== f.id;
            return (
              <div key={f.id} className="aml-flag" style={{ borderLeftColor: meta.stripe }}>
                <div className="aml-flag__head">
                  <span className="aml-sev" style={{ color: meta.color, background: meta.bg }}>{f.severity}</span>
                  <span className="aml-status" style={{ color: status === 'Cleared' ? 'var(--color-success)' : status === 'Escalated' ? 'var(--color-danger)' : 'var(--color-text-faint)' }}>{status}</span>
                </div>
                <div className="aml-flag__title">{f.flagType}</div>
                <div className="aml-flag__meta">{f.who} · {f.at}</div>
                <div className="aml-flag__detail">{f.detail}</div>
                {!resolved && (
                  escalating ? (
                    <>
                      <input placeholder="STR reference number (required)" value={strRef} onChange={(e) => setStrRefs({ ...strRefs, [f.id]: e.target.value })} className="custodian-textarea" style={{ marginBottom: 8 }} />
                      <textarea placeholder="Reason for escalation (required)…" value={reason} onChange={(e) => setEscalateReasons({ ...escalateReasons, [f.id]: e.target.value })} rows={2} className="custodian-textarea" />
                      <div className="custodian-btn-row">
                        <button onClick={() => confirmEscalate(f)} disabled={!canEscalate} className="custodian-btn-danger" style={{ opacity: canEscalate ? 1 : 0.5 }}>Confirm Escalate</button>
                        <button onClick={() => setEscalateId(null)} className="custodian-btn-outline">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <div className="custodian-btn-row">
                      <button onClick={() => clear(f)} disabled={busyId === f.id} className="custodian-btn-success">{busyId === f.id ? 'Saving…' : 'Clear Flag'}</button>
                      <button onClick={() => setEscalateId(f.id)} className="custodian-btn-danger-outline">Escalate…</button>
                    </div>
                  )
                )}
                {resolved && <div className="aml-resolution">{status.toUpperCase()} — DECIDED {f.decision.at} BY {f.decision.by || 'Custodian'}{f.decision.reason ? ` · ${f.decision.reason}` : ''}</div>}
              </div>
            );
          })}
        </div>
        {actionError && <div className="custodian-empty" style={{ color: 'var(--color-danger)' }}>{actionError}</div>}
        {loading && <div className="custodian-empty">Loading flags…</div>}
        {!loading && error && <div className="custodian-empty" style={{ color: 'var(--color-danger)' }}>Could not load AML flags: {error.message || 'request failed'}.</div>}
        {!loading && !error && all.length === 0 && <div className="custodian-empty">No flags match this filter.</div>}
      </main>
    </div>
    </ConsoleFrame>
  );
}
