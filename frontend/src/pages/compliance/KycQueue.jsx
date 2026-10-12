import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { nowStamp, pushLedger, loadJSON, saveJSON } from '../../utils/auditLedger.js';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import '../compliance/CustodianShared.css';
import './KycQueue.css';


export default function KycQueue() {
  const [showInfo, setShowInfo] = useState(false);
  const [suspendId, setSuspendId] = useState(null);
  const [suspendReasons, setSuspendReasons] = useState({});
  const [decisions, setDecisions] = useState(loadJSON('adwitix_kyc_decisions', {}));

  const { data: apiData, loading: apiLoading, reload } = useApiQuery(() => admin.kycQueue(), []);
  const apiRows = (apiData && (apiData.dossiers || apiData.parties || apiData.rows)) || [];
  const source = apiRows.map((k) => ({
    id: k.id || k.party_id,
    name: k.full_name || k.name || k.mobile_number || '—',
    entityType: (k.entity_type || 'individual').toLowerCase() === 'organization' ? 'Organization' : 'Individual',
    role: k.role || 'Trader',
    mobile: k.mobile_number || '—',
    at: (k.submitted_at || k.created_at || '').slice(0, 16).replace('T', ' '),
    docCount: k.document_count ?? k.docCount ?? 0,
    addressCount: k.address_count ?? k.addressCount ?? 0,
  }));
  const pending = source.filter((k) => !decisions[k.id]);
  const decided = Object.entries(decisions).map(([id, d]) => ({ id, ...d }));

  const verify = (k) => {
    admin.kycDecide(k.id, { decision: 'verified' }).then(reload).catch(() => {});
    const next = { ...decisions, [k.id]: { status: 'VERIFIED', name: k.name, at: nowStamp() } };
    saveJSON('adwitix_kyc_decisions', next);
    pushLedger('Verified KYC Dossier', k.name, `${k.entityType} · ${k.docCount} documents`);
    setDecisions(next);
  };
  const confirmSuspend = (k) => {
    const reason = (suspendReasons[k.id] || '').trim();
    if (!reason) return;
    admin.kycDecide(k.id, { decision: 'suspended', reason }).then(reload).catch(() => {});
    const next = { ...decisions, [k.id]: { status: 'SUSPENDED', name: k.name, at: nowStamp(), reason } };
    saveJSON('adwitix_kyc_decisions', next);
    pushLedger('Suspended KYC Dossier', k.name, reason);
    setDecisions(next);
    setSuspendId(null);
  };

  return (
    <div className="custodian-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'KYC Queue', to: '/kyc-queue', active: true }]} />
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
            return (
              <div key={k.id} className="kq-row">
                <div className="kq-row__head">
                  <div className="kq-name">{k.name} <span className="kq-name__meta">({k.entityType} · {k.role})</span></div>
                  <div className="kq-mobile">{k.mobile} · submitted {k.at}</div>
                </div>
                <div className="kq-stats"><span>{k.docCount} documents</span><span>{k.addressCount} addresses on file</span></div>
                {suspending ? (
                  <>
                    <textarea placeholder="Reason for suspension (required)…" value={reason} onChange={(e) => setSuspendReasons({ ...suspendReasons, [k.id]: e.target.value })} rows={2} className="custodian-textarea" />
                    <div className="custodian-btn-row">
                      <button onClick={() => confirmSuspend(k)} disabled={!reason.trim()} className="custodian-btn-danger" style={{ opacity: reason.trim() ? 1 : 0.5 }}>Confirm Suspend</button>
                      <button onClick={() => setSuspendId(null)} className="custodian-btn-outline">Cancel</button>
                    </div>
                  </>
                ) : (
                  <div className="custodian-btn-row">
                    <button onClick={() => verify(k)} className="custodian-btn-success">Verify</button>
                    <button onClick={() => setSuspendId(k.id)} className="custodian-btn-danger-outline">Suspend…</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {!apiLoading && pending.length === 0 && <div className="custodian-empty">No KYC dossiers pending review.</div>}

        {decided.length > 0 && (
          <>
            <h2 className="custodian-decided-title">Decided</h2>
            <div className="custodian-decided-list">
              {decided.map((d) => (
                <div key={d.id} className="custodian-decided-row">
                  <span className="custodian-decided-status" style={{ color: d.status === 'VERIFIED' ? 'var(--color-success)' : 'var(--color-danger)' }}>{d.status}</span>
                  <span className="custodian-decided-body"> — {d.name} · DECIDED {d.at} BY Custodian</span>
                  {d.reason && <div className="custodian-decided-reason">{d.reason}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
