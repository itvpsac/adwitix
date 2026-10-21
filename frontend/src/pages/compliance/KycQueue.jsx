import { useEffect, useState } from 'react';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { nowStamp, pushLedger } from '../../utils/auditLedger.js';
import { admin } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { useApiQuery } from '../../api/hooks.js';
import '../compliance/CustodianShared.css';
import './KycQueue.css';


export default function KycQueue() {
  const [showInfo, setShowInfo] = useState(false);
  const [suspendId, setSuspendId] = useState(null);
  const [suspendReasons, setSuspendReasons] = useState({});
  // Decisions recorded from this screen during this visit (the backend
  // has no "decided dossiers" list endpoint).
  const [decided, setDecided] = useState([]);
  const [details, setDetails] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  // GET /admin/kyc → { parties: [party rows with kyc_status = 'submitted'] }
  const { data: apiData, loading: apiLoading, error: apiError, reload } = useApiQuery(() => admin.kycQueue(), []);
  const apiRows = (apiData && apiData.parties) || [];
  const pending = apiRows.map((k) => ({
    id: k.id,
    name: k.full_name || k.mobile_number || '—',
    entityType: (k.entity_type || 'individual').toLowerCase() === 'organization' ? 'Organization' : 'Individual',
    mobile: k.mobile_number || '—',
    at: (k.kyc_submitted_at || k.updated_at || '').slice(0, 16).replace('T', ' '),
  }));

  // GET /admin/kyc/:id → { party, documents, addresses, suspensionReasons }.
  // The list endpoint carries no document/address counts or the closed list
  // of suspension reasons, so pull each dossier's detail.
  const idsKey = pending.map((k) => k.id).join(',');
  useEffect(() => {
    let alive = true;
    pending.forEach((k) => {
      if (details[k.id]) return;
      admin.kycDetail(k.id)
        .then((res) => { if (alive) { const d = unwrap(res); setDetails((cur) => ({ ...cur, [k.id]: d })); } })
        .catch((err) => { if (alive) setDetails((cur) => ({ ...cur, [k.id]: { error: err.message || 'Could not load dossier detail.' } })); });
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const decide = async (k, payload, status, reasonLabel) => {
    setBusyId(k.id);
    setActionError('');
    try {
      await admin.kycDecide(k.id, payload);
      pushLedger(status === 'VERIFIED' ? 'Verified KYC Dossier' : 'Suspended KYC Dossier', k.name, reasonLabel || k.entityType);
      setDecided((cur) => [{ id: k.id, status, name: k.name, at: nowStamp(), reason: reasonLabel }, ...cur]);
      setSuspendId(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not record the KYC decision.');
    } finally {
      setBusyId(null);
    }
  };
  const verify = (k) => decide(k, { decision: 'verify' }, 'VERIFIED');
  const confirmSuspend = (k) => {
    const reason = suspendReasons[k.id] || '';
    if (!reason) return;
    const options = (details[k.id] && details[k.id].suspensionReasons) || {};
    decide(k, { decision: 'suspend', reason }, 'SUSPENDED', options[reason] || reason);
  };

  return (
    <ConsoleFrame header={<DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'KYC Queue', to: '/kyc-queue', active: true }]} />}>
    <div className="custodian-page">
      <main className="custodian-main">
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">KYC Queue</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="custodian-info-btn">i</button>
        </div>
        <p className="custodian-sub">Dossiers submitted (entity type, documents, address portfolio), awaiting a Verified or Suspended decision. Suspend requires a stated reason.</p>
        {showInfo && (
          <div className="custodian-info-box">
            <strong>Why this screen exists:</strong> Every dossier submitted — entity type, documents, address portfolio — is reviewed here before a Verified or Suspended decision is recorded. Suspension requires a stated reason.
            <button onClick={() => setShowInfo(false)} className="custodian-info-close">Close</button>
          </div>
        )}

        <div className="kq-list">
          {pending.map((k) => {
            const suspending = suspendId === k.id;
            const reason = suspendReasons[k.id] || '';
            const detail = details[k.id];
            const reasonOptions = (detail && detail.suspensionReasons) || {};
            const busy = busyId === k.id;
            return (
              <div key={k.id} className="kq-row">
                <div className="kq-row__head">
                  <div className="kq-name">{k.name} <span className="kq-name__meta">({k.entityType})</span></div>
                  <div className="kq-mobile">{k.mobile} · submitted {k.at}</div>
                </div>
                <div className="kq-stats">
                  {!detail && <span>Loading dossier…</span>}
                  {detail && detail.error && <span style={{ color: 'var(--color-danger)' }}>{detail.error}</span>}
                  {detail && !detail.error && <><span>{(detail.documents || []).length} documents</span><span>{(detail.addresses || []).length} addresses on file</span></>}
                </div>
                {suspending ? (
                  <>
                    <select value={reason} onChange={(e) => setSuspendReasons({ ...suspendReasons, [k.id]: e.target.value })} className="custodian-textarea" disabled={!detail || !!detail.error}>
                      <option value="">{detail ? 'Reason for suspension (required)…' : 'Loading reasons…'}</option>
                      {Object.entries(reasonOptions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                    <div className="custodian-btn-row">
                      <button onClick={() => confirmSuspend(k)} disabled={!reason || busy} className="custodian-btn-danger" style={{ opacity: reason && !busy ? 1 : 0.5 }}>{busy ? 'Saving…' : 'Confirm Suspend'}</button>
                      <button onClick={() => setSuspendId(null)} className="custodian-btn-outline">Cancel</button>
                    </div>
                  </>
                ) : (
                  <div className="custodian-btn-row">
                    <button onClick={() => verify(k)} disabled={busy} className="custodian-btn-success">{busy ? 'Saving…' : 'Verify'}</button>
                    <button onClick={() => setSuspendId(k.id)} className="custodian-btn-danger-outline">Suspend…</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {actionError && <div className="custodian-empty" style={{ color: 'var(--color-danger)' }}>{actionError}</div>}
        {apiLoading && <div className="custodian-empty">Loading dossiers…</div>}
        {!apiLoading && apiError && <div className="custodian-empty" style={{ color: 'var(--color-danger)' }}>Could not load the KYC queue: {apiError.message || 'request failed'}.</div>}
        {!apiLoading && !apiError && pending.length === 0 && <div className="custodian-empty">No KYC dossiers pending review.</div>}

        {decided.length > 0 && (
          <>
            <h2 className="custodian-decided-title">Decided this session</h2>
            <div className="custodian-decided-list">
              {decided.map((d) => (
                <div key={d.id} className="custodian-decided-row">
                  <span className="custodian-decided-status" style={{ color: d.status === 'VERIFIED' ? 'var(--color-success)' : 'var(--color-danger)' }}>{d.status}</span>
                  <span className="custodian-decided-body"> — {d.name} · DECIDED {d.at}</span>
                  {d.reason && <div className="custodian-decided-reason">{d.reason}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
    </ConsoleFrame>
  );
}
