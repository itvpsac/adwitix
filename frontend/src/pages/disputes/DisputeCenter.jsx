import { useEffect, useState } from 'react';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import { Link, useSearchParams } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import { disputes as disputesApi, saleEvents, admin } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { useAuth, isCustodian } from '../../utils/auth.js';
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
const ROLE_TABS = [
  { id: 'party', label: 'Filer / Respondent' },
  { id: 'tenant_admin', label: 'Tenant Admin (Ruling)' },
  { id: 'super_admin', label: 'Super Admin (Appeal)' },
];

function catLabel(id) { return (CATEGORIES.find((c) => c.id === id) || {}).label || id; }
const stamp = (v) => (v || '').slice(0, 16).replace('T', ' ');

// Maps GET /disputes/:id → { dispute, evidence } (or a bare dispute row from
// GET /admin/alerts, evidence not yet loaded) into the shape this screen renders.
function toLocal({ dispute: d, evidence }) {
  return {
    id: d.id, live: true,
    saleEventRef: `Sale event ${d.sale_event_id}`,
    category: d.category, rulingAuthorityType: d.ruling_authority_type || 'tenant_admin',
    description: d.description, status: d.status,
    evidence: (evidence || []).map((e) => ({ content: e.content, createdAt: stamp(e.created_at) })),
    rulingOutcome: d.ruling_outcome, rulingRationale: d.ruling_rationale || '',
    appealed: !!d.appealed_at, appealRationale: d.appeal_rationale || '',
  };
}

export default function DisputeCenter() {
  const [role, setRole] = useState('party');
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [params, setParams] = useSearchParams();
  const liveId = params.get('id');
  // ?saleEvent=<id> files against that sale event; disputes can only be filed
  // against a real transaction (linked from its Settlement page).
  const liveSaleEventId = params.get('saleEvent');
  const { user } = useAuth();
  const custodian = isCustodian(user);
  // There is no "list my disputes" endpoint: parties see the dispute they
  // opened via ?id=; Super Admins get the open queue from GET /admin/alerts.
  const [disputes, setDisputes] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);
  const [evidenceDraft, setEvidenceDraft] = useState('');
  const [rulingOutcome, setRulingOutcome] = useState('');
  const [rulingAtFaultParty, setRulingAtFaultParty] = useState('');
  const [rulingRationale, setRulingRationale] = useState('');
  const [rulingError, setRulingError] = useState('');
  const [appealRationale, setAppealRationale] = useState('');
  const [fileCategory, setFileCategory] = useState('payment');
  const [fileDescription, setFileDescription] = useState('');
  const fileSaleEventId = liveSaleEventId;

  const loadLive = async (id) => {
    const local = toLocal(unwrap(await disputesApi.show(id)));
    setDisputes((cur) => (cur.some((d) => d.id === id) ? cur.map((d) => (d.id === id ? local : d)) : [local, ...cur]));
    return local;
  };
  useEffect(() => {
    if (!custodian) return;
    setListLoading(true);
    admin.alerts()
      .then((res) => {
        const rows = (unwrap(res).openDisputes || []).map((d) => toLocal({ dispute: d, evidence: [] }));
        setDisputes((cur) => [...cur, ...rows.filter((r) => !cur.some((d) => d.id === r.id))]);
      })
      .catch((err) => setApiError(err.message || 'Could not load open disputes.'))
      .finally(() => setListLoading(false));
  }, [custodian]);
  useEffect(() => {
    if (!liveId) return;
    loadLive(liveId)
      .then(() => { setSelectedId(liveId); setView('detail'); })
      .catch((err) => setApiError(err.message || 'Could not load the dispute.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveId]);

  // POST, then reload the dispute from the backend.
  const liveAction = async (call) => {
    setBusy(true);
    setApiError('');
    try {
      await call();
      await loadLive(selectedId);
      return true;
    } catch (err) {
      setApiError(err.message || 'Action failed.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const relevant = disputes.filter((d) => {
    if (role === 'party') return true;
    if (role === 'tenant_admin') return d.rulingAuthorityType === 'tenant_admin';
    if (role === 'super_admin') return d.rulingAuthorityType === 'super_admin' || d.status === 'appealed' || d.status === 'closed';
    return true;
  });
  const selected = disputes.find((d) => d.id === selectedId);
  const meta = selected ? STATUS_META[selected.status] || STATUS_META.filed : null;
  const canSubmitEvidence = selected && role === 'party' && (selected.status === 'filed' || selected.status === 'evidence_window');
  const canRule = selected && (selected.status === 'filed' || selected.status === 'evidence_window') &&
    ((role === 'tenant_admin' && selected.rulingAuthorityType === 'tenant_admin') || (role === 'super_admin' && selected.rulingAuthorityType === 'super_admin'));
  const canAppeal = selected && selected.status === 'ruled' && selected.rulingAuthorityType === 'tenant_admin' && role === 'party';
  const canRuleAppeal = selected && selected.status === 'appealed' && role === 'super_admin';
  const rulingNeedsParty = rulingOutcome === 'order_forfeiture' || rulingOutcome === 'rating_consequence';

  const openDispute = (id) => {
    setApiError(''); setSelectedId(id); setView('detail'); setEvidenceDraft(''); setRulingOutcome(''); setRulingAtFaultParty(''); setRulingRationale(''); setRulingError(''); setAppealRationale('');
    // Refresh from GET /disputes/:id so the evidence trail is current.
    loadLive(id).catch((err) => setApiError(err.message || 'Could not load the dispute.'));
  };

  const submitEvidence = async () => {
    if (!evidenceDraft.trim()) return;
    if (await liveAction(() => disputesApi.submitEvidence(selectedId, { content: evidenceDraft }))) setEvidenceDraft('');
  };
  const issueRuling = () => {
    if (!rulingOutcome) { setRulingError('Select an outcome before submitting.'); return; }
    if (!rulingRationale.trim()) { setRulingError('Rationale is required — identifies the evidence relied upon.'); return; }
    liveAction(() => disputesApi.rule(selectedId, { outcome: rulingOutcome, rationale: rulingRationale, at_fault_party_id: rulingAtFaultParty || undefined }));
  };
  const appeal = () => liveAction(() => disputesApi.appeal(selectedId, {}));
  const ruleOnAppeal = () => {
    if (!appealRationale.trim()) return;
    liveAction(() => disputesApi.ruleOnAppeal(selectedId, { rationale: appealRationale }));
  };
  const fileSubmit = async () => {
    if (!liveSaleEventId) { setApiError('Open this form from the transaction\'s Settlement page to file a dispute against it.'); return; }
    if (!fileDescription.trim()) { setApiError('Describe what went wrong before filing.'); return; }
    setBusy(true);
    setApiError('');
    try {
      const res = unwrap(await saleEvents.fileDispute(liveSaleEventId, { category: fileCategory, description: fileDescription }));
      setParams({ id: res.dispute.id });
    } catch (err) {
      setApiError(err.message || 'Could not file the dispute.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConsoleFrame header={<LightDashboardHeader ctas={[{ label: '← Trust & Support', to: '/trust-and-support' }]} />}>
    <div className="dc-page">
      <main className="dc-main">
        <div className="legal-eyebrow">Trust &amp; Support</div>
        <h1 className="dc-title">Dispute Center</h1>
        <p className="dc-sub">One screen, role-conditional — the live app serves this route identically for the filer, respondent, Tenant Admin, and Super Admin; only what renders below changes.</p>

        <div className="dc-tabs">
          {ROLE_TABS.map((rt) => (
            <button key={rt.id} onClick={() => { setRole(rt.id); setView('list'); }} className={`dc-tab${role === rt.id ? ' dc-tab--active' : ''}`}>{rt.label}</button>
          ))}
        </div>

        {apiError && <p className="dc-error">{apiError}</p>}

        {view === 'list' && (
          <>
            {role === 'party' && <button onClick={() => { setView('file'); setFileCategory('payment'); setFileDescription(''); }} className="dc-file-btn">+ File a Dispute</button>}
            <div className="dc-list">
              {relevant.map((d) => {
                const m = STATUS_META[d.status] || STATUS_META.filed;
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
            {listLoading && <div className="dc-empty">Loading disputes…</div>}
            {!listLoading && relevant.length === 0 && (
              <div className="dc-empty">{custodian ? 'Nothing here for this role right now.' : 'No dispute open on this screen. Open a dispute from its link on your dashboard or Settlement page.'}</div>
            )}
          </>
        )}

        {view === 'file' && (
          <>
            <button onClick={() => setView('list')} className="dc-back">← Back</button>
            <div className="dc-card">
              <h2 className="dc-h2">File a Dispute</h2>
              <p className="dc-card-sub">{fileSaleEventId ? `Against sale event ${fileSaleEventId}.` : 'Disputes are filed against a specific transaction — open this form from that transaction\'s Settlement page ("File a Dispute →").'} Choose the category that best matches your situation. Tender Auctions are excluded from this process entirely.</p>
              <label className="dc-label">Category</label>
              <select value={fileCategory} onChange={(e) => setFileCategory(e.target.value)} className="dc-select">
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <label className="dc-label">Description</label>
              <textarea value={fileDescription} onChange={(e) => setFileDescription(e.target.value)} rows={5} className="dc-textarea" />
              <button onClick={fileSubmit} disabled={busy || !fileSaleEventId} className="dc-submit">{busy ? 'Filing…' : 'File Dispute'}</button>
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
                <button onClick={submitEvidence} disabled={busy} className="dc-outline-btn">Submit Evidence</button>
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
                <button onClick={issueRuling} disabled={busy} className="dc-dark-btn">Issue Ruling</button>
              </div>
            )}

            {(selected.status === 'ruled' || selected.status === 'appealed') && (
              <div className="dc-ruled-box">
                <p><strong>Ruling:</strong> {OUTCOME_LABELS[selected.rulingOutcome] || selected.rulingOutcome}</p>
                <p><strong>Rationale:</strong> {selected.rulingRationale}</p>
                {canAppeal && <button onClick={appeal} disabled={busy} className="dc-appeal-btn">Appeal to Super Admin</button>}
              </div>
            )}

            {canRuleAppeal && (
              <div className="dc-ruling-box">
                <p className="dc-ruling-hint">Super Admin appeal ruling</p>
                <textarea placeholder="Appeal rationale" value={appealRationale} onChange={(e) => setAppealRationale(e.target.value)} rows={2} className="dc-textarea dc-textarea--sm" />
                <button onClick={ruleOnAppeal} disabled={busy} className="dc-dark-btn">Rule on Appeal</button>
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
    </ConsoleFrame>
  );
}
