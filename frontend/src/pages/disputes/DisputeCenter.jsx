import { useState } from 'react';
import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import './DisputeCenter.css';

const CATEGORIES = [
  { id: 'payment', label: 'Payment Dispute', authority: 'tenant_admin' },
  { id: 'condition_delivery', label: 'Condition/Delivery Dispute', authority: 'tenant_admin' },
  { id: 'non_lifting_collection', label: 'Non-Lifting/Collection Dispute', authority: 'tenant_admin' },
  { id: 'auction_rejection', label: 'Auction Rejection Dispute', authority: 'tenant_admin' },
  { id: 'buyer_non_response', label: 'Trader Non-Response Dispute', authority: 'super_admin' },
];
const OUTCOME_LABELS = { dismissed: 'Dismissed the claim', force_log_noc: 'Force-logged an NOC', order_forfeiture: 'Ordered EMD forfeiture', rating_consequence: 'Applied a rating consequence' };
const STATUS_META = {
  filed: { label: 'Filed', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  evidence_window: { label: 'Evidence Window Open', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  ruled: { label: 'Ruled', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  appealed: { label: 'Appealed', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  closed: { label: 'Closed (Final)', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
};
const INITIAL_DISPUTES = [
  { id: 'DSP-10422', saleEventRef: 'EXPRESS Trading Session — ₹1,15,000', category: 'non_lifting_collection', rulingAuthorityType: 'tenant_admin',
    description: 'Market Maker is not responding to arrange collection after payment was confirmed.', status: 'evidence_window',
    evidence: [{ content: 'Payment confirmation screenshot', createdAt: '2026-07-30 09:12' }, { content: 'Chat log (3 follow-ups, no response)', createdAt: '2026-07-30 09:16' }],
    rulingOutcome: null, rulingRationale: '', appealed: false, appealRationale: '' },
  { id: 'DSP-10318', saleEventRef: 'EASY Auction — ₹3,10,000', category: 'condition_delivery', rulingAuthorityType: 'tenant_admin',
    description: 'Item had undisclosed damage not visible in listing photos.', status: 'ruled',
    evidence: [{ content: 'Delivered unit photo with visible damage', createdAt: '2026-07-12 10:02' }],
    rulingOutcome: 'rating_consequence', rulingRationale: 'Listing omitted a known defect. Market Maker rating adjusted; partial refund ordered reflecting repair cost estimate.',
    appealed: false, appealRationale: '' },
  { id: 'DSP-10275', saleEventRef: 'BUY-NOW Lot — ₹85,000', category: 'buyer_non_response', rulingAuthorityType: 'super_admin',
    description: 'Trader has not confirmed the NOC or submitted a rating despite two reminders.', status: 'evidence_window',
    evidence: [{ content: 'Reminder sent 2026-07-20', createdAt: '2026-07-20 09:00' }, { content: 'Reminder sent 2026-07-25', createdAt: '2026-07-25 09:00' }],
    rulingOutcome: null, rulingRationale: '', appealed: false, appealRationale: '' },
  { id: 'DSP-10460', saleEventRef: 'TENDER Trading Session — ₹6,20,000', category: 'auction_rejection', rulingAuthorityType: 'tenant_admin',
    description: 'My winning bid was rejected with no stated reason beyond "policy discretion."', status: 'appealed',
    evidence: [{ content: 'Rejection notice, no reason given', createdAt: '2026-07-31 12:00' }],
    rulingOutcome: 'dismissed', rulingRationale: 'Compliance concern beyond my authority — referring for Super Admin review.',
    appealed: true, appealRationale: '' },
];
const ROLE_TABS = [
  { id: 'party', label: 'Filer / Respondent' },
  { id: 'tenant_admin', label: 'Tenant Admin (Ruling)' },
  { id: 'super_admin', label: 'Super Admin (Appeal)' },
];

function catLabel(id) { return (CATEGORIES.find((c) => c.id === id) || {}).label || id; }
function nowStamp() { return new Date().toISOString().slice(0, 16).replace('T', ' '); }

export default function DisputeCenter() {
  const [role, setRole] = useState('party');
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [disputes, setDisputes] = useState(INITIAL_DISPUTES);
  const [evidenceDraft, setEvidenceDraft] = useState('');
  const [rulingOutcome, setRulingOutcome] = useState('');
  const [rulingAtFaultParty, setRulingAtFaultParty] = useState('');
  const [rulingRationale, setRulingRationale] = useState('');
  const [rulingError, setRulingError] = useState('');
  const [appealRationale, setAppealRationale] = useState('');
  const [fileCategory, setFileCategory] = useState('payment');
  const [fileDescription, setFileDescription] = useState('');
  const fileSaleEventId = 'SE-2026-0731-042';

  const relevant = disputes.filter((d) => {
    if (role === 'party') return true;
    if (role === 'tenant_admin') return d.rulingAuthorityType === 'tenant_admin';
    if (role === 'super_admin') return d.rulingAuthorityType === 'super_admin' || d.status === 'appealed' || d.status === 'closed';
    return true;
  });
  const selected = disputes.find((d) => d.id === selectedId);
  const meta = selected ? STATUS_META[selected.status] : null;
  const canSubmitEvidence = selected && role === 'party' && (selected.status === 'filed' || selected.status === 'evidence_window');
  const canRule = selected && (selected.status === 'filed' || selected.status === 'evidence_window') &&
    ((role === 'tenant_admin' && selected.rulingAuthorityType === 'tenant_admin') || (role === 'super_admin' && selected.rulingAuthorityType === 'super_admin'));
  const canAppeal = selected && selected.status === 'ruled' && selected.rulingAuthorityType === 'tenant_admin' && role === 'party';
  const canRuleAppeal = selected && selected.status === 'appealed' && role === 'super_admin';
  const rulingNeedsParty = rulingOutcome === 'order_forfeiture' || rulingOutcome === 'rating_consequence';

  const openDispute = (id) => { setSelectedId(id); setView('detail'); setEvidenceDraft(''); setRulingOutcome(''); setRulingAtFaultParty(''); setRulingRationale(''); setRulingError(''); setAppealRationale(''); };

  const submitEvidence = () => {
    if (!evidenceDraft.trim()) return;
    setDisputes(disputes.map((d) => (d.id === selectedId ? { ...d, status: 'evidence_window', evidence: [...d.evidence, { content: evidenceDraft, createdAt: nowStamp() }] } : d)));
    setEvidenceDraft('');
  };
  const issueRuling = () => {
    if (!rulingOutcome) { setRulingError('Select an outcome before submitting.'); return; }
    if (!rulingRationale.trim()) { setRulingError('Rationale is required — identifies the evidence relied upon.'); return; }
    setDisputes(disputes.map((d) => (d.id === selectedId ? { ...d, status: 'ruled', rulingOutcome, rulingRationale } : d)));
  };
  const appeal = () => setDisputes(disputes.map((d) => (d.id === selectedId ? { ...d, status: 'appealed' } : d)));
  const ruleOnAppeal = () => {
    if (!appealRationale.trim()) return;
    setDisputes(disputes.map((d) => (d.id === selectedId ? { ...d, status: 'closed', appealRationale } : d)));
  };
  const fileSubmit = () => {
    const id = 'DSP-' + Math.floor(10000 + Math.random() * 89999);
    const cat = CATEGORIES.find((c) => c.id === fileCategory);
    const newD = { id, saleEventRef: fileSaleEventId, category: fileCategory, rulingAuthorityType: cat.authority, description: fileDescription || '(no description provided)', status: 'filed', evidence: [], rulingOutcome: null, rulingRationale: '', appealed: false, appealRationale: '' };
    setDisputes([newD, ...disputes]);
    setView('list');
  };

  return (
    <div className="dc-page">
      <LightDashboardHeader ctas={[{ label: '← Trust & Support', to: '/trust-and-support' }]} />
      <main className="dc-main">
        <div className="legal-eyebrow">Trust &amp; Support</div>
        <h1 className="dc-title">Dispute Center</h1>
        <p className="dc-sub">One screen, role-conditional — the live app serves this route identically for the filer, respondent, Tenant Admin, and Super Admin; only what renders below changes.</p>

        <div className="dc-tabs">
          {ROLE_TABS.map((rt) => (
            <button key={rt.id} onClick={() => { setRole(rt.id); setView('list'); }} className={`dc-tab${role === rt.id ? ' dc-tab--active' : ''}`}>{rt.label}</button>
          ))}
        </div>

        {view === 'list' && (
          <>
            {role === 'party' && <button onClick={() => { setView('file'); setFileCategory('payment'); setFileDescription(''); }} className="dc-file-btn">+ File a Dispute</button>}
            <div className="dc-list">
              {relevant.map((d) => {
                const m = STATUS_META[d.status];
                return (
                  <button key={d.id} onClick={() => openDispute(d.id)} className="dc-row">
                    <div>
                      <p className="dc-row__meta">{d.id} · {d.saleEventRef}</p>
                      <p className="dc-row__title">{catLabel(d.category)}</p>
                    </div>
                    <span className="dc-status" style={{ color: m.color, background: m.bg }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
            {relevant.length === 0 && <div className="dc-empty">Nothing here for this role right now.</div>}
          </>
        )}

        {view === 'file' && (
          <>
            <button onClick={() => setView('list')} className="dc-back">← Back</button>
            <div className="dc-card">
              <h2 className="dc-h2">File a Dispute</h2>
              <p className="dc-card-sub">Against sale event {fileSaleEventId}. Choose the category that best matches your situation. Tender Auctions are excluded from this process entirely.</p>
              <label className="dc-label">Category</label>
              <select value={fileCategory} onChange={(e) => setFileCategory(e.target.value)} className="dc-select">
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <label className="dc-label">Description</label>
              <textarea value={fileDescription} onChange={(e) => setFileDescription(e.target.value)} rows={5} className="dc-textarea" />
              <button onClick={fileSubmit} className="dc-submit">File Dispute</button>
            </div>
          </>
        )}

        {view === 'detail' && selected && (
          <>
            <button onClick={() => setView('list')} className="dc-back">← Back to Disputes</button>
            <span className="dc-status dc-status--block" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
            <h2 className="dc-detail-title">{catLabel(selected.category)}</h2>
            <p className="dc-detail-desc">{selected.description}</p>
            <p className="dc-detail-authority">Ruling authority: {selected.rulingAuthorityType === 'tenant_admin' ? 'Tenant Admin' : 'Super Admin'} · {selected.saleEventRef}</p>

            <h3 className="dc-h3">Evidence</h3>
            <div className="dc-evidence-list">
              {selected.evidence.map((e, i) => (
                <div key={i} className="dc-evidence-item">
                  {e.content}
                  <div className="dc-evidence-time">{e.createdAt}</div>
                </div>
              ))}
            </div>

            {canSubmitEvidence && (
              <>
                <textarea placeholder="Submit your evidence/statement" value={evidenceDraft} onChange={(e) => setEvidenceDraft(e.target.value)} rows={3} className="dc-textarea" />
                <button onClick={submitEvidence} className="dc-outline-btn">Submit Evidence</button>
              </>
            )}

            {canRule && (
              <div className="dc-ruling-box">
                <p className="dc-ruling-hint">Ruling action — requires the correct authority ({selected.rulingAuthorityType === 'tenant_admin' ? 'Tenant Admin' : 'Super Admin'} for this category)</p>
                <select value={rulingOutcome} onChange={(e) => { setRulingOutcome(e.target.value); setRulingError(''); }} className="dc-select dc-select--sm">
                  <option value="">Select an outcome…</option>
                  <option value="dismissed">Dismiss the claim</option>
                  <option value="force_log_noc">Force-log an NOC</option>
                  <option value="order_forfeiture">Order EMD forfeiture</option>
                  <option value="rating_consequence">Apply a rating consequence</option>
                </select>
                {rulingNeedsParty && <input placeholder="At-fault party ID" value={rulingAtFaultParty} onChange={(e) => setRulingAtFaultParty(e.target.value)} className="dc-input" />}
                <textarea placeholder="Rationale — required, identifies the evidence relied upon" value={rulingRationale} onChange={(e) => { setRulingRationale(e.target.value); setRulingError(''); }} rows={2} className="dc-textarea dc-textarea--sm" />
                {rulingError && <p className="dc-error">{rulingError}</p>}
                <button onClick={issueRuling} className="dc-dark-btn">Issue Ruling</button>
              </div>
            )}

            {(selected.status === 'ruled' || selected.status === 'appealed') && (
              <div className="dc-ruled-box">
                <p><strong>Ruling:</strong> {OUTCOME_LABELS[selected.rulingOutcome]}</p>
                <p><strong>Rationale:</strong> {selected.rulingRationale}</p>
                {canAppeal && <button onClick={appeal} className="dc-appeal-btn">Appeal to Super Admin</button>}
              </div>
            )}

            {canRuleAppeal && (
              <div className="dc-ruling-box">
                <p className="dc-ruling-hint">Super Admin appeal ruling</p>
                <textarea placeholder="Appeal rationale" value={appealRationale} onChange={(e) => setAppealRationale(e.target.value)} rows={2} className="dc-textarea dc-textarea--sm" />
                <button onClick={ruleOnAppeal} className="dc-dark-btn">Rule on Appeal</button>
              </div>
            )}

            {selected.status === 'closed' && (
              <div className="dc-closed-box"><p><strong>Final (appeal):</strong> {selected.appealRationale}</p></div>
            )}
          </>
        )}
      </main>
      <footer className="dc-footer"><p>See our <Link to="/dispute-resolution-process">Dispute Resolution Process</Link> for the full plain-language guide.</p></footer>
    </div>
  );
}
