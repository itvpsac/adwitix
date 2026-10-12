import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { nowStamp, pushLedger, loadJSON, saveJSON } from '../../utils/auditLedger.js';
import '../compliance/CustodianShared.css';
import './RulesAndSpecifications.css';

const SECTIONS = [
  { id: 'fee', title: 'Success Fee Schedule', value: 'CoCo Starter: 2.00% (min ₹500+GST)\nTSX Launch: 1.50%\nTSX Growth: 1.00%\nTSX Enterprise: 0.50% (min ₹500+GST)', changeLog: 'Last changed 2026-05-12 by Custodian' },
  { id: 'formats', title: 'Trading Session Formats', value: 'Buy-Now: fixed price, instant settlement\nEasy: open ascending bid, no reserve required\nExpress: sealed-bid, single round, 24hr window\nTender: multi-round sealed bid, RV/EV disclosed post-close', changeLog: 'Last changed 2026-03-02 by Custodian' },
  { id: 'cooloff', title: 'Cooling-Off Periods', value: 'Payout bank account change: 24 hours\nDispute appeal window: 5 days from ruling\nKYC re-verification after Suspended: 48 hours', changeLog: 'Last changed 2026-06-20 by Custodian' },
  { id: 'ratings', title: 'Star Rating Point Values', value: 'Small event (< ₹50,000): ±0.1 per rating\nMedium event (₹50,000–₹5,00,000): ±0.3 per rating\nLarge event (> ₹5,00,000): ±0.5 per rating\nRecovery: +0.05 per clean event after a drop, capped at prior high', changeLog: 'Last changed 2026-04-18 by Custodian' },
];

export default function RulesAndSpecifications() {
  const [showInfo, setShowInfo] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [overrides, setOverrides] = useState(loadJSON('adwitix_rules_overrides', {}));

  const save = (sec, draft) => {
    const next = { ...overrides, [sec.id]: { value: draft, at: nowStamp() } };
    saveJSON('adwitix_rules_overrides', next);
    pushLedger('Edited Rules & Specifications', sec.title, `Updated ${sec.title.toLowerCase()}`);
    setOverrides(next);
    setEditingId(null);
  };

  return (
    <div className="custodian-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Rules & Specifications', to: '/rules-and-specifications', active: true }]} />
      <main className="custodian-main">
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">Rules &amp; Specifications</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="custodian-info-btn">i</button>
        </div>
        <p className="custodian-sub">Platform-wide governing values — Trading Session formats, cooling-off periods, and rating point values. Changes apply platform-wide and are recorded to the Audit Ledger.</p>
        {showInfo && (
          <div className="custodian-info-box">
            <strong>Why this screen exists:</strong> These are the platform's governing values — fee schedules, Trading Session formats, cooling-off periods, and rating point values. Changes here apply platform-wide and are recorded to the Audit Ledger.
            <button onClick={() => setShowInfo(false)} className="custodian-info-close">Close</button>
          </div>
        )}

        <div className="rs-list">
          {SECTIONS.map((sec) => {
            const editing = editingId === sec.id;
            const override = overrides[sec.id];
            const value = override ? override.value : sec.value;
            const changeLog = override ? `Last changed ${override.at} by Custodian` : sec.changeLog;
            const draft = sec.id in drafts ? drafts[sec.id] : value;
            return (
              <div key={sec.id} className="rs-section">
                <div className="rs-section__head">
                  <div>
                    <div className="rs-section__title">{sec.title}</div>
                    <div className="rs-section__log">{changeLog}</div>
                  </div>
                  {!editing && <button onClick={() => { setEditingId(sec.id); setDrafts({ ...drafts, [sec.id]: value }); }} className="rs-edit-btn">Edit</button>}
                </div>
                {!editing && <div className="rs-value">{value}</div>}
                {editing && (
                  <>
                    <textarea value={draft} onChange={(e) => setDrafts({ ...drafts, [sec.id]: e.target.value })} rows={5} className="rs-textarea" />
                    <div className="custodian-btn-row">
                      <button onClick={() => save(sec, draft)} className="rs-save-btn">Save Change</button>
                      <button onClick={() => setEditingId(null)} className="custodian-btn-outline">Cancel</button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
