import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { nowStamp, pushLedger, loadJSON, saveJSON } from '../../utils/auditLedger.js';
import '../compliance/CustodianShared.css';
import './MediaWaivers.css';

const QUEUE = [
  { id: 'mw1', lotId: 'LOT-48210', lotTitle: 'Repossessed Excavator, CAT 320D', mmName: 'Northline Salvage Co.', photosProvided: 3, at: '2026-07-31 10:00', reason: 'Site access restricted by current occupant — only exterior angles available until repossession completes next week.' },
  { id: 'mw2', lotId: 'LOT-49012', lotTitle: 'Industrial Compressor Unit', mmName: 'Ravindra Auto Traders', photosProvided: 4, at: '2026-08-01 12:30', reason: 'Unit in transit between warehouses; fifth angle to follow once relocated.' },
];

export default function MediaWaivers() {
  const [showInfo, setShowInfo] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [rejectReasons, setRejectReasons] = useState({});
  const [decisions, setDecisions] = useState(loadJSON('adwitix_media_waivers', {}));

  const pending = QUEUE.filter((w) => !decisions[w.id]);
  const decided = Object.entries(decisions).map(([id, d]) => ({ id, ...d }));

  const approve = (w) => {
    const next = { ...decisions, [w.id]: { status: 'APPROVED', lotTitle: w.lotTitle, at: nowStamp() } };
    saveJSON('adwitix_media_waivers', next);
    pushLedger('Approved Media Waiver', w.lotTitle, `${w.photosProvided} of 5 photos`);
    setDecisions(next);
  };
  const confirmReject = (w) => {
    const reason = (rejectReasons[w.id] || '').trim();
    if (!reason) return;
    const next = { ...decisions, [w.id]: { status: 'REJECTED', lotTitle: w.lotTitle, at: nowStamp(), reason } };
    saveJSON('adwitix_media_waivers', next);
    pushLedger('Rejected Media Waiver', w.lotTitle, reason);
    setDecisions(next);
    setConfirmId(null);
  };

  return (
    <div className="custodian-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Media Waivers', to: '/media-waivers', active: true }]} />
      <main className="custodian-main">
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">Media Waivers</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="custodian-info-btn">i</button>
        </div>
        <p className="custodian-sub">Requests from Market Makers to list below the standard media requirement. Reject requires a stated reason; approve does not.</p>
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
                    <div className="mw-title">{w.lotTitle}</div>
                    <div className="mw-meta">{w.lotId} · {w.mmName} · requested {w.at}</div>
                  </div>
                  <span className="mw-photos">{w.photosProvided} of 5 photos</span>
                </div>
                <div className="mw-reason">"{w.reason}"</div>
                {confirming ? (
                  <>
                    <textarea placeholder="Reason for rejection (required)…" value={reason} onChange={(e) => setRejectReasons({ ...rejectReasons, [w.id]: e.target.value })} rows={2} className="custodian-textarea" />
                    <div className="custodian-btn-row">
                      <button onClick={() => confirmReject(w)} disabled={!reason.trim()} className="custodian-btn-danger" style={{ opacity: reason.trim() ? 1 : 0.5 }}>Confirm Reject</button>
                      <button onClick={() => setConfirmId(null)} className="custodian-btn-outline">Cancel</button>
                    </div>
                  </>
                ) : (
                  <div className="custodian-btn-row">
                    <button onClick={() => approve(w)} className="custodian-btn-success">Approve Waiver</button>
                    <button onClick={() => setConfirmId(w.id)} className="custodian-btn-danger-outline">Reject…</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {pending.length === 0 && <div className="custodian-empty">No pending media waiver requests.</div>}

        {decided.length > 0 && (
          <>
            <h2 className="custodian-decided-title">Decided</h2>
            <div className="custodian-decided-list">
              {decided.map((d) => (
                <div key={d.id} className="custodian-decided-row">
                  <span className="custodian-decided-status" style={{ color: d.status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-danger)' }}>{d.status}</span>
                  <span className="custodian-decided-body"> — {d.lotTitle} · DECIDED {d.at} BY Custodian</span>
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
