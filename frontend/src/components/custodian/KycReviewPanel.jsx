import { useCallback, useEffect, useState } from 'react';
import { admin } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';

// KYC review, inside the person's User file (D-136): there is no separate
// KYC Review screen. Status and reason, the five compliance checks (PAN,
// GSTIN, Aadhaar, bank, email — each marked verified individually), the
// uploaded documents, and Verify / Suspend with a closed-list reason
// (BR-17). Every action is logged under the Custodian's name.
const CHECKS = [['pan', 'PAN'], ['gstin', 'GSTIN'], ['aadhaar', 'Aadhaar'], ['bank', 'Bank account'], ['email', 'Email']];
const STATUS = { verified: 'ok', submitted: 'warn', suspended: 'bad' };

export default function KycReviewPanel({ partyId, onChanged }) {
  const [d, setD] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    admin.kycDetail(partyId).then((r) => setD(unwrap(r) || {})).catch((e) => setErr(e.description || e.message || 'Could not load the KYC dossier.'));
  }, [partyId]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn, done) => {
    setBusy(true); setErr(''); setMsg('');
    try {
      await fn();
      setMsg(done);
      setReason('');
      load();
      onChanged && onChanged();
    } catch (e) {
      setErr(e.description || e.message || 'That did not go through.');
    } finally {
      setBusy(false);
    }
  };

  if (!d) return err ? <p className="cc-error">{err}</p> : <p className="cc-lbl">Loading KYC…</p>;
  const p = d.party || {};
  const status = p.kyc_status || 'pending';
  const reasons = Object.entries(d.suspensionReasons || {});
  const docs = d.documents || [];
  const isOrg = p.entity_type === 'organization';
  // Verify / Suspend apply to a submitted dossier only (KycService::reviewDossier).
  const reviewable = status === 'submitted';

  return (
    <div className="kyc-panel">
      <div className="kyc-panel__head">
        <h3 className="cc-h2" style={{ fontSize: 16 }}>KYC review</h3>
        <span className={`cc-pill cc-pill--${STATUS[status] || 'muted'}`}>{status.replace(/_/g, ' ')}</span>
        {p.kyc_submitted_at && <span className="cc-lbl">submitted {p.kyc_submitted_at}</span>}
        {p.kyc_status_reason && <span className="cc-lbl">· reason: {p.kyc_status_reason}</span>}
      </div>

      <div className="kyc-checks">
        {CHECKS.filter(([k]) => k !== 'gstin' || isOrg).map(([k, l]) => {
          const at = p[`${k}_verified_at`];
          return (
            <div key={k} className="kyc-check">
              <span>{l}</span>
              {at ? <span className="cc-pill cc-pill--ok" title={at}>Verified {String(at).slice(0, 10)}</span>
                : <button type="button" className="cc-btn" disabled={busy} onClick={() => run(() => admin.kycVerifyFlag(partyId, { flag: k }), `${l} marked verified.`)}>Mark verified</button>}
            </div>
          );
        })}
      </div>

      <h4 className="cl-h4">Documents <span className="cc-lbl">{docs.length}</span></h4>
      {docs.length === 0 ? <p className="cl-empty">No documents uploaded.</p> : (
        <div className="kyc-docs">
          {docs.map((doc) => (
            <button key={doc.id} type="button" className="dq-doc" onClick={() => admin.kycDocumentDownload(doc.id)}>
              {String(doc.document_type || 'document').replace(/_/g, ' ')} — {doc.original_filename || 'file'} ↓
            </button>
          ))}
        </div>
      )}

      <div className="kyc-decide">
        <button type="button" className="cc-btn cc-btn--ok" disabled={busy || !reviewable} onClick={() => run(() => admin.kycDecide(partyId, { decision: 'verify' }), 'KYC verified.')}>Verify KYC</button>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="dq-input" style={{ maxWidth: 260 }} aria-label="Suspension reason">
          <option value="">Reason to suspend…</option>
          {reasons.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <button type="button" className="cc-btn cc-btn--bad" disabled={busy || !reason || !reviewable} onClick={() => run(() => admin.kycDecide(partyId, { decision: 'suspend', reason }), 'KYC suspended; the user sees the reason.')}>Suspend KYC</button>
      </div>
      {!reviewable && <p className="cc-lbl" style={{ margin: 0 }}>Verify and Suspend apply once the person submits their dossier — it is {status.replace(/_/g, ' ')} now. To stop someone acting meanwhile, use Freeze account.</p>}
      {msg && <p className="dq-notice" role="status" style={{ display: 'block' }}>{msg}</p>}
      {err && <p className="cc-error" role="alert">{err}</p>}
      <p className="cc-lbl" style={{ margin: 0, fontSize: 12 }}>Recorded in the audit log under your name.</p>
    </div>
  );
}
