import { useState } from 'react';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { pushLedger } from '../../utils/auditLedger.js';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import './ChargebackHandling.css';

const day = (v) => (v || '').slice(0, 10);
const money = (v) => (v == null ? '—' : `₹${Number(v).toLocaleString('en-IN')}`);
// Buyer-side view is an explainer only: there is no buyer-facing chargeback
// endpoint, so no individual case is shown here.
const STATUS_META = {
  filed: { label: 'Filed', bg: '#EEF0F4', color: 'var(--color-text-muted)' },
  represented: { label: 'Represented', bg: '#E9EEFB', color: '#33518F' },
  resolved_won: { label: 'Representment Won', bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  resolved_lost: { label: 'Representment Lost', bg: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
};

export default function ChargebackHandling() {
  const [role, setRole] = useState('admin');
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  // GET /admin/chargebacks → { openRepresentment, pendingIntegrityReview, resolved }
  const { data, loading, error: loadError, reload } = useApiQuery(() => admin.chargebacks(), []);
  const byId = new Map();
  const pendingIntegrity = new Set(((data && data.pendingIntegrityReview) || []).map((c) => c.id));
  [...((data && data.openRepresentment) || []), ...((data && data.pendingIntegrityReview) || []), ...((data && data.resolved) || [])]
    .forEach((c) => { if (!byId.has(c.id)) byId.set(c.id, c); });
  const CASES = [...byId.values()].map((c) => ({
    id: c.id,
    caseId: `CB-${c.id.slice(0, 8).toUpperCase()}`,
    lotTitle: c.sale_format ? `${c.sale_format.replace(/_/g, ' ')} sale ${c.sale_event_id.slice(0, 8)}` : `Sale ${c.sale_event_id.slice(0, 8)}`,
    buyer: c.mobile_number,
    amount: money(c.amount),
    filedAt: day(c.filed_at),
    reason: c.filed_reason,
    linkedForfeiture: !!Number(c.against_approved_forfeiture),
    integrityPending: pendingIntegrity.has(c.id),
    integrityApplied: c.integrity_reviewed_at ? !!Number(c.integrity_rating_consequence_applied) : null,
    integrityAt: day(c.integrity_reviewed_at),
    status: c.status,
  }));

  const run = async (id, call, ledger) => {
    setBusyId(id);
    setActionError('');
    try {
      await call();
      pushLedger(...ledger);
      reload();
    } catch (err) {
      setActionError(err.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };
  const decide = (c, apply) => run(c.id,
    () => admin.reviewChargebackIntegrity(c.id, { apply_rating_consequence: apply ? '1' : '0', notes: 'Chargeback filed against approved forfeiture' }),
    [`Logged Account-Integrity Event (penalty ${apply ? 'applied' : 'declined'})`, c.caseId, 'Chargeback filed against approved forfeiture']);
  const recordOutcome = (c, outcome) => run(c.id,
    () => admin.decideChargeback(c.id, { outcome, notes: `Gateway representment ${outcome}` }),
    [`Recorded Representment ${outcome === 'won' ? 'Won' : 'Lost'}`, c.caseId, c.amount]);

  return (
    <ConsoleFrame header={<DashboardHeader consoleLabel="PR-30" />}>
    <div className="cb-page">
      <div className="cb-role-toggle">
        <button onClick={() => setRole('admin')} className={`cb-role-btn${role === 'admin' ? ' cb-role-btn--active' : ''}`}>SaaS Admin</button>
        <button onClick={() => setRole('trader')} className={`cb-role-btn${role === 'trader' ? ' cb-role-btn--active' : ''}`}>Buyer / Seller</button>
      </div>
      <main className="cb-main">
        {role === 'admin' && (
          <>
            <div className="legal-eyebrow">PR-30</div>
            <h1 className="cb-title">Chargeback Handling</h1>
            <p className="cb-intro">Card-funded EMD is held as an authorization hold and captured only at settlement or a confirmed forfeiture. When a chargeback is filed, the platform automatically assembles an evidence package — the buyer's per-pledge consent record, bid/transaction history, and the forfeiture approval chain — and reaches representment in one step. A chargeback against an already-approved forfeiture is flagged separately for a SaaS Admin to decide whether the rating penalty applies.</p>

            <div className="cb-list">
              {CASES.map((c) => {
                const meta = STATUS_META[c.status] || STATUS_META.filed;
                return (
                  <div key={c.id} className="cb-case" style={{ borderColor: c.linkedForfeiture ? '#F2CFC6' : 'var(--color-border)' }}>
                    <div className="cb-case__head">
                      <div>
                        <div className="cb-case__title">{c.lotTitle} <span className="cb-case__id">· {c.caseId}</span></div>
                        <div className="cb-case__meta">{c.buyer} · filed {c.filedAt} · {c.amount}</div>
                      </div>
                      <span className="cb-status" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                    </div>
                    {c.reason && <div className="cb-case__meta">Reason: {c.reason}</div>}
                    {c.status === 'represented' && (
                      <div className="cb-flag-actions">
                        <button onClick={() => recordOutcome(c, 'won')} disabled={busyId === c.id} className="cb-btn-outline">Representment Won</button>
                        <button onClick={() => recordOutcome(c, 'lost')} disabled={busyId === c.id} className="cb-btn-outline">Representment Lost</button>
                      </div>
                    )}
                    <div className="cb-evidence">Evidence package: consent record (BR-51) · bid/transaction history · forfeiture approval chain{c.linkedForfeiture ? ' · linked to an approved forfeiture' : ''}</div>
                    {c.linkedForfeiture && (
                      <div className="cb-flag">
                        <strong>Filed against an already-approved forfeiture.</strong> Does not extinguish the buyer's underlying obligation (BR-52) — flagged as a distinct account-integrity event, independent of the representment outcome.
                        {c.integrityPending && (
                          <div className="cb-flag-actions">
                            <button onClick={() => decide(c, true)} disabled={busyId === c.id} className="cb-btn-danger">Apply Penalty &amp; Log</button>
                            <button onClick={() => decide(c, false)} disabled={busyId === c.id} className="cb-btn-outline">Decline Penalty (log only)</button>
                          </div>
                        )}
                        {c.integrityApplied !== null && <div className="cb-flag-logged">✓ {c.integrityApplied ? "Penalty applied, logged on buyer's record" : 'Logged, no penalty applied'} — {c.integrityAt}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {actionError && <p className="cb-intro" style={{ color: 'var(--color-danger)' }}>{actionError}</p>}
            {loading && <p className="cb-intro">Loading cases…</p>}
            {!loading && loadError && <p className="cb-intro" style={{ color: 'var(--color-danger)' }}>Could not load chargeback cases: {loadError.message || 'request failed'}.</p>}
            {!loading && !loadError && CASES.length === 0 && <p className="cb-intro">No chargeback cases on record.</p>}
          </>
        )}

        {role === 'trader' && (
          <>
            <div className="legal-eyebrow">PR-30</div>
            <h1 className="cb-title cb-title--sm">What a buyer or seller sees</h1>
            <p className="cb-sub">Card-funded EMD · explainer (no individual case shown)</p>
            <div className="cb-trader-card">
              <div className="cb-trader-head">
                <div className="cb-trader-title">Chargeback Filed</div>
              </div>
              <p className="cb-trader-body">When a chargeback is filed against a transaction with the cardholder's issuing bank, AdwitiX automatically assembles the evidence package — the per-pledge consent record, bid/transaction history, and the forfeiture approval chain — and reaches representment.</p>
              <div className="cb-flag cb-flag--nested">If the chargeback was filed against an already-approved forfeiture, filing it does not extinguish the underlying payment obligation — AdwitiX retains the right to pursue recovery, and it is logged as an account-integrity event on the buyer's record.</div>
            </div>
          </>
        )}
      </main>
    </div>
    </ConsoleFrame>
  );
}
