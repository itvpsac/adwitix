import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { pushLedger } from '../../utils/auditLedger.js';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import './PayoutReviews.css';

const stamp = (v) => (v || '').slice(0, 16).replace('T', ' ');
const money = (v) => (v == null ? '—' : `₹${Number(v).toLocaleString('en-IN')}`);
const RELEASE_LABEL = { plain_release: 'EMD Release', settlement_refund: 'Settlement Refund' };

export default function PayoutReviews() {
  const [showInfo, setShowInfo] = useState(false);
  const [blockId, setBlockId] = useState(null);
  const [blockReasons, setBlockReasons] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  // GET /admin/payout-reviews → { pending, reviewed } payout_release_review rows
  const { data, loading, reload } = useApiQuery(() => admin.payoutReviews(), []);
  const pending = ((data && data.pending) || []).map((r) => ({
    id: r.id,
    name: r.mobile_number,
    role: RELEASE_LABEL[r.release_type] || r.release_type,
    at: stamp(r.created_at),
    amount: money(r.amount),
    split: [r.buyer_refund != null && `Buyer refund ${money(r.buyer_refund)}`, r.tenant_amount != null && `Tenant ${money(r.tenant_amount)}`, r.saas_amount != null && `Platform ${money(r.saas_amount)}`].filter(Boolean),
  }));
  const decided = ((data && data.reviewed) || []).map((r) => ({
    id: r.id,
    status: r.status === 'approved' ? 'APPROVED' : 'BLOCKED',
    name: `${r.mobile_number} · ${money(r.amount)}`,
    at: stamp(r.reviewed_at),
    by: r.reviewer_mobile,
    reason: r.decision_rationale,
  }));

  const decide = async (p, approve, rationale) => {
    setBusyId(p.id);
    setActionError('');
    try {
      await admin.decidePayoutReview(p.id, { decision: approve ? 'approve' : 'decline', rationale });
      pushLedger(approve ? 'Approved Payout Release' : 'Blocked Payout Release', p.name, approve ? p.amount : rationale);
      setBlockId(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not record the decision.');
    } finally {
      setBusyId(null);
    }
  };
  const approveEarly = (p) => decide(p, true, 'Approved by reviewer.');
  const confirmBlock = (p) => {
    const reason = (blockReasons[p.id] || '').trim();
    if (reason) decide(p, false, reason);
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
        <p className="py-sub">EMD releases and settlement refunds that tripped a payout control are held here until reviewed. Approve to release the funds, or block a payout that looks suspicious — blocking requires a reason.</p>
        {showInfo && (
          <div className="py-info-box">
            <strong>Why this screen exists:</strong> Payout controls hold an EMD release or settlement refund for human review when it looks anomalous. A reviewer approves the release or blocks it; blocking requires a stated reason on record.
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
                    <div className="py-row__meta">held {p.at}</div>
                  </div>
                  <span className="py-cool">{p.amount}</span>
                </div>
                {p.split.length > 0 && <div className="py-accts">{p.split.map((x) => <span key={x}>{x}</span>)}</div>}
                {blocking ? (
                  <>
                    <textarea placeholder="Reason for blocking (required)…" value={reason} onChange={(e) => setBlockReasons({ ...blockReasons, [p.id]: e.target.value })} rows={2} className="py-textarea" />
                    <div className="py-btn-row">
                      <button onClick={() => confirmBlock(p)} disabled={!reason.trim() || busyId === p.id} className="py-btn-danger" style={{ opacity: reason.trim() ? 1 : 0.5 }}>Confirm Block</button>
                      <button onClick={() => setBlockId(null)} className="py-btn-outline">Cancel</button>
                    </div>
                  </>
                ) : (
                  <div className="py-btn-row">
                    <button onClick={() => approveEarly(p)} disabled={busyId === p.id} className="py-btn-success">{busyId === p.id ? 'Saving…' : 'Approve Release'}</button>
                    <button onClick={() => setBlockId(p.id)} className="py-btn-danger-outline">Block…</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {actionError && <div className="py-empty" style={{ color: 'var(--color-danger)' }}>{actionError}</div>}
        {loading && <div className="py-empty">Loading…</div>}
        {!loading && pending.length === 0 && <div className="py-empty">No payouts pending review.</div>}

        {decided.length > 0 && (
          <>
            <h2 className="py-decided-title">Decided</h2>
            <div className="py-decided-list">
              {decided.map((d) => (
                <div key={d.id} className="py-decided-row">
                  <span className="py-decided-status" style={{ color: d.status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-danger)' }}>{d.status}</span>
                  <span className="py-decided-body"> — {d.name} · DECIDED {d.at} BY {d.by || 'Custodian'}</span>
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
