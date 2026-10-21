import { useState } from 'react';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { pushLedger } from '../../utils/auditLedger.js';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import '../compliance/CustodianShared.css';
import './MediaWaivers.css';

const stamp = (v) => (v || '').slice(0, 16).replace('T', ' ');

export default function MediaWaivers() {
  const [showInfo, setShowInfo] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [rejectReasons, setRejectReasons] = useState({});
  const [revokeId, setRevokeId] = useState(null);
  const [revokeReasons, setRevokeReasons] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  // GET /admin/media-waivers → { pending: [...], active: [...] }, both
  // tenant_media_waiver rows joined with tenant_name.
  const { data, loading, error, reload } = useApiQuery(() => admin.mediaWaivers(), []);
  const toRow = (w) => ({
    id: w.id,
    category: w.category,
    tenant: w.tenant_name,
    at: stamp(w.created_at),
    reason: w.business_justification,
    grantedAt: stamp(w.granted_at),
    expiresAt: stamp(w.expires_at),
    rationale: w.decision_rationale,
  });
  const pending = ((data && data.pending) || []).map(toRow);
  const active = ((data && data.active) || []).map(toRow);

  const act = async (w, call, ledgerAction, detail) => {
    setBusyId(w.id);
    setActionError('');
    try {
      await call();
      pushLedger(ledgerAction, `${w.tenant} — ${w.category}`, detail);
      setConfirmId(null);
      setRevokeId(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };
  const approve = (w) => act(w, () => admin.decideMediaWaiver(w.id, { decision: 'approve', rationale: 'Approved by Custodian.' }), 'Approved Media Waiver', w.reason);
  const confirmReject = (w) => {
    const reason = (rejectReasons[w.id] || '').trim();
    if (!reason) return;
    act(w, () => admin.decideMediaWaiver(w.id, { decision: 'reject', rationale: reason }), 'Rejected Media Waiver', reason);
  };
  const confirmRevoke = (w) => {
    const reason = (revokeReasons[w.id] || '').trim();
    if (!reason) return;
    act(w, () => admin.revokeMediaWaiver(w.id, { reason }), 'Revoked Media Waiver', reason);
  };

  return (
    <ConsoleFrame header={<DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Media Waivers', to: '/media-waivers', active: true }]} />}>
    <div className="custodian-page">
      <main className="custodian-main">
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">Media Waivers</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="custodian-info-btn">i</button>
        </div>
        <p className="custodian-sub">Requests from TradeSphereX tenants to list a category below the standard media requirement. Reject and revoke require a stated reason; approve does not.</p>
        {showInfo && (
          <div className="custodian-info-box">
            <strong>Why this screen exists:</strong> Listings normally require 5 photos minimum. A Market Maker may request a waiver citing site-access or timing constraints; Custodian approval logs the waiver, rejection requires a stated reason.
            <button onClick={() => setShowInfo(false)} className="custodian-info-close">Close</button>
          </div>
        )}

        <div className="mw-list">
          {pending.map((w) => {
            const confirming = confirmId === w.id;
            const reason = rejectReasons[w.id] || '';
            return (
              <div key={w.id} className="mw-row">
                <div className="mw-row__head">
                  <div>
                    <div className="mw-title">{w.category}</div>
                    <div className="mw-meta">{w.tenant} · requested {w.at}</div>
                  </div>
                </div>
                <div className="mw-reason">"{w.reason}"</div>
                {confirming ? (
                  <>
                    <textarea placeholder="Reason for rejection (required)…" value={reason} onChange={(e) => setRejectReasons({ ...rejectReasons, [w.id]: e.target.value })} rows={2} className="custodian-textarea" />
                    <div className="custodian-btn-row">
                      <button onClick={() => confirmReject(w)} disabled={!reason.trim() || busyId === w.id} className="custodian-btn-danger" style={{ opacity: reason.trim() ? 1 : 0.5 }}>Confirm Reject</button>
                      <button onClick={() => setConfirmId(null)} className="custodian-btn-outline">Cancel</button>
                    </div>
                  </>
                ) : (
                  <div className="custodian-btn-row">
                    <button onClick={() => approve(w)} disabled={busyId === w.id} className="custodian-btn-success">{busyId === w.id ? 'Saving…' : 'Approve Waiver'}</button>
                    <button onClick={() => setConfirmId(w.id)} className="custodian-btn-danger-outline">Reject…</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {actionError && <div className="custodian-empty" style={{ color: 'var(--color-danger)' }}>{actionError}</div>}
        {loading && <div className="custodian-empty">Loading waivers…</div>}
        {!loading && error && <div className="custodian-empty" style={{ color: 'var(--color-danger)' }}>Could not load media waivers: {error.message || 'request failed'}.</div>}
        {!loading && !error && pending.length === 0 && <div className="custodian-empty">No pending media waiver requests.</div>}

        {active.length > 0 && (
          <>
            <h2 className="custodian-decided-title">Active Waivers</h2>
            <div className="custodian-decided-list">
              {active.map((d) => {
                const reason = revokeReasons[d.id] || '';
                return (
                  <div key={d.id} className="custodian-decided-row">
                    <span className="custodian-decided-status" style={{ color: 'var(--color-success)' }}>APPROVED</span>
                    <span className="custodian-decided-body"> — {d.tenant} · {d.category} · granted {d.grantedAt}{d.expiresAt ? ` · expires ${d.expiresAt}` : ''}</span>
                    {d.rationale && <div className="custodian-decided-reason">{d.rationale}</div>}
                    {revokeId === d.id ? (
                      <>
                        <textarea placeholder="Reason for revoking (required)…" value={reason} onChange={(e) => setRevokeReasons({ ...revokeReasons, [d.id]: e.target.value })} rows={2} className="custodian-textarea" />
                        <div className="custodian-btn-row">
                          <button onClick={() => confirmRevoke(d)} disabled={!reason.trim() || busyId === d.id} className="custodian-btn-danger" style={{ opacity: reason.trim() ? 1 : 0.5 }}>Confirm Revoke</button>
                          <button onClick={() => setRevokeId(null)} className="custodian-btn-outline">Cancel</button>
                        </div>
                      </>
                    ) : (
                      <div className="custodian-btn-row"><button onClick={() => setRevokeId(d.id)} className="custodian-btn-danger-outline">Revoke…</button></div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
    </ConsoleFrame>
  );
}
