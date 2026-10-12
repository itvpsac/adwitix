import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import './ChargebackHandling.css';

function nowStamp() { return new Date().toISOString().slice(0, 16).replace('T', ' '); }
function logAudit(entry) {
  try {
    const key = 'adwitix_audit_ledger';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({ at: nowStamp(), ...entry });
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (e) { /* noop */ }
}
const CASES = [
  { id: 'cb1', caseId: 'CB-2201', lotTitle: 'Industrial Compressor Unit', buyer: '98xxxxxx21', amount: '₹4,52,000', filedAt: '2026-08-04', linkedForfeiture: false, status: 'represented' },
  { id: 'cb2', caseId: 'CB-2214', lotTitle: 'Scrap Copper Coil — 12MT', buyer: '97xxxxxx08', amount: '₹1,86,500', filedAt: '2026-08-06', linkedForfeiture: true, status: 'represented' },
  { id: 'cb3', caseId: 'CB-2190', lotTitle: 'Diesel Genset 125kVA', buyer: '99xxxxxx44', amount: '₹3,20,000', filedAt: '2026-07-29', linkedForfeiture: false, status: 'won' },
];
const STATUS_META = {
  represented: { label: 'Represented', bg: '#E9EEFB', color: '#33518F' },
  won: { label: 'Representment Won', bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  lost: { label: 'Representment Lost', bg: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
};

export default function ChargebackHandling() {
  const [role, setRole] = useState('admin');
  const [integrityDecisions, setIntegrityDecisions] = useState({});

  const decide = (id, decision, caseId) => {
    setIntegrityDecisions({ ...integrityDecisions, [id]: decision });
    logAudit({ actor: 'SaaS Admin', action: `Logged Account-Integrity Event (penalty ${decision})`, target: caseId, reason: 'Chargeback filed against approved forfeiture' });
  };

  const traderCase = CASES[1];
  const traderMeta = STATUS_META[traderCase.status];

  return (
    <div className="cb-page">
      <DashboardHeader consoleLabel="PR-30" navItems={[{ label: 'SaaS Admin', to: '#', active: role === 'admin' }, { label: 'Buyer / Seller', to: '#', active: role === 'trader' }]} />
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
                const meta = STATUS_META[c.status];
                const decision = integrityDecisions[c.id];
                return (
                  <div key={c.id} className="cb-case" style={{ borderColor: c.linkedForfeiture ? '#F2CFC6' : 'var(--color-border)' }}>
                    <div className="cb-case__head">
                      <div>
                        <div className="cb-case__title">{c.lotTitle} <span className="cb-case__id">· {c.caseId}</span></div>
                        <div className="cb-case__meta">{c.buyer} · filed {c.filedAt} · {c.amount}</div>
                      </div>
                      <span className="cb-status" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                    </div>
                    <div className="cb-evidence">Evidence package: consent record (BR-51) · bid/transaction history · forfeiture approval chain{c.linkedForfeiture ? ' · linked to an approved forfeiture' : ''}</div>
                    {c.linkedForfeiture && (
                      <div className="cb-flag">
                        <strong>Filed against an already-approved forfeiture.</strong> Does not extinguish the buyer's underlying obligation (BR-52) — flagged as a distinct account-integrity event, independent of the representment outcome.
                        {!decision && (
                          <div className="cb-flag-actions">
                            <button onClick={() => decide(c.id, 'applied', c.caseId)} className="cb-btn-danger">Apply Penalty &amp; Log</button>
                            <button onClick={() => decide(c.id, 'declined', c.caseId)} className="cb-btn-outline">Decline Penalty (log only)</button>
                          </div>
                        )}
                        {decision && <div className="cb-flag-logged">✓ {decision === 'applied' ? "Penalty applied, logged on buyer's record" : 'Logged, no penalty applied'} — {nowStamp()}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {role === 'trader' && (
          <>
            <div className="legal-eyebrow">{traderCase.id.toUpperCase()}</div>
            <h1 className="cb-title cb-title--sm">{traderCase.lotTitle}</h1>
            <p className="cb-sub">{traderCase.amount} · card-funded EMD</p>
            <div className="cb-trader-card">
              <div className="cb-trader-head">
                <div className="cb-trader-title">Chargeback Filed</div>
                <span className="cb-status" style={{ background: traderMeta.bg, color: traderMeta.color }}>{traderMeta.label}</span>
              </div>
              <p className="cb-trader-body">A chargeback was filed against this transaction with the cardholder's issuing bank on {traderCase.filedAt}. AdwitiX has automatically assembled the evidence package — your per-pledge consent record, bid/transaction history, and the forfeiture approval chain — and reached representment.</p>
              {traderCase.linkedForfeiture && (
                <div className="cb-flag cb-flag--nested">This chargeback was filed against an already-approved forfeiture. Filing it does not extinguish your underlying payment obligation — AdwitiX retains the right to pursue recovery, and this has been logged as an account-integrity event on your record.</div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
