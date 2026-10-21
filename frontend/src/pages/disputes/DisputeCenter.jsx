import { useEffect, useState } from 'react';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import { Link, useSearchParams } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import { disputes as disputesApi, saleEvents } from '../../api/endpoints.js';
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
function catLabel(id) { return (CATEGORIES.find((c) => c.id === id) || {}).label || id; }
const stamp = (v) => (v || '').slice(0, 16).replace('T', ' ');

// Maps GET /disputes/:id → { dispute, evidence } (or a bare row from
// GET /disputes, evidence not yet loaded) into the shape this screen renders.
function toLocal({ dispute: d, evidence }) {
  return {
    id: d.id, live: true,
    saleEventRef: d.ern ? `ERN ${d.ern}` : `Sale event ${d.sale_event_id}`,
    listingTitle: d.listing_title || '', tenantName: d.tenant_name || '',
    // List rows don't carry ruling_authority_type; it follows from the category.
    category: d.category, rulingAuthorityType: d.ruling_authority_type || (CATEGORIES.find((c) => c.id === d.category) || {}).authority || 'tenant_admin',
    description: d.description, status: d.status,
    filedBy: d.filed_by_party_id, respondent: d.respondent_party_id,
    createdAt: stamp(d.created_at), evidenceDeadlineAt: stamp(d.evidence_deadline_at), ruledAt: stamp(d.ruled_at),
    evidence: (evidence || []).map((e) => ({ content: e.content, createdAt: stamp(e.created_at) })),
    rulingOutcome: d.ruling_outcome, rulingRationale: d.ruling_rationale || '',
    appealed: !!d.appealed_at, appealRationale: d.appeal_rationale || '',
  };
}

export default function DisputeCenter() {
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [params, setParams] = useSearchParams();
  const liveId = params.get('id');
  // ?saleEvent=<id> files against that sale event; disputes can only be filed
  // against a real transaction (linked from its Settlement page).
  const liveSaleEventId = params.get('saleEvent');
  const { user } = useAuth();
  const custodian = isCustodian(user);
  // What this account can do here: Super Admin rules appeals (and
  // super-admin-category disputes), a Tenant Admin rules their tenant's
  // disputes, everyone else is a filer or respondent. The backend enforces
  // the same authority on every action.
  const isTenantAdmin = !!user && (user.roles?.includes('tenant_admin') || user.matrixRole === 'tsx_master' || (user.adminTenants || []).length > 0);
  const role = custodian ? 'super_admin' : isTenantAdmin ? 'tenant_admin' : 'party';
  // GET /disputes lists the caller's disputes (all of them for a Super Admin);
  // the selected dispute is loaded in full (with evidence) from GET /disputes/:id.
  const [disputes, setDisputes] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
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

  const loadList = async () => {
    setListLoading(true);
    try {
      const rows = (unwrap(await disputesApi.mine()).disputes || []).map((d) => toLocal({ dispute: d, evidence: [] }));
      rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setDisputes(rows);
    } catch (err) {
      setApiError(err.message || 'Could not load your disputes.');
    } finally {
      setListLoading(false);
    }
  };
  const loadLive = async (id) => {
    setDetailLoading(true);
    try {
      const local = toLocal(unwrap(await disputesApi.show(id)));
      setDetail(local);
      return local;
    } finally {
      setDetailLoading(false);
    }
  };
  const detailError = (err) => setApiError(err && err.status === 404
    ? 'Dispute not found — it may not exist, or you may not have access to it.'
    : (err.message || 'Could not load the dispute.'));
  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!liveId) return;
    setApiError(''); setSelectedId(liveId); setView('detail');
    loadLive(liveId).catch(detailError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveId]);

  // POST, then reload the dispute from the backend.
  const liveAction = async (call) => {
    setBusy(true);
    setApiError('');
    try {
      await call();
      await Promise.all([loadLive(selectedId), loadList()]);
      return true;
    } catch (err) {
      setApiError(err.message || 'Action failed.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  // The backend already returns exactly the disputes this account may see.
  const relevant = disputes;
  const selected = (detail && detail.id === selectedId) ? detail : disputes.find((d) => d.id === selectedId);
  const meta = selected ? STATUS_META[selected.status] || STATUS_META.filed : null;
  // Filer/respondent actions follow the account's part in this dispute,
  // so a Tenant Admin who is also a buyer or seller keeps them.
  const isParty = !!selected && !!user && [selected.filedBy, selected.respondent].includes(user.id);
  const canSubmitEvidence = selected && isParty && (selected.status === 'filed' || selected.status === 'evidence_window');
  const canRule = selected && (selected.status === 'filed' || selected.status === 'evidence_window') &&
    ((role === 'tenant_admin' && selected.rulingAuthorityType === 'tenant_admin') || (role === 'super_admin' && selected.rulingAuthorityType === 'super_admin'));
  const canAppeal = selected && selected.status === 'ruled' && selected.rulingAuthorityType === 'tenant_admin' && isParty;
  const canRuleAppeal = selected && selected.status === 'appealed' && role === 'super_admin';
  const rulingNeedsParty = rulingOutcome === 'order_forfeiture' || rulingOutcome === 'rating_consequence';

  const openDispute = (id) => {
    setApiError(''); setSelectedId(id); setView('detail'); setEvidenceDraft(''); setRulingOutcome(''); setRulingAtFaultParty(''); setRulingRationale(''); setRulingError(''); setAppealRationale('');
    // Refresh from GET /disputes/:id so the evidence trail is current.
    loadLive(id).catch(detailError);
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
      loadList();
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
        <p className="dc-sub">{custodian ? 'Every dispute on the platform. Appeals and Super Admin disputes are ruled here.'
          : role === 'tenant_admin' ? 'Disputes on your TradeSphereX and the ones you are part of. Rule on your tenant\'s disputes here.'
            : 'Disputes you have filed or that were filed against you — submit evidence, follow the ruling, and appeal if needed.'}</p>

        {apiError && <p className="dc-error">{apiError}</p>}

        {view === 'list' && (
          <>
            {!custodian && <button onClick={() => { setView('file'); setFileCategory('payment'); setFileDescription(''); }} className="dc-file-btn">+ File a Dispute</button>}
            <div className="dc-list">
              {relevant.map((d) => {
                const m = STATUS_META[d.status] || STATUS_META.filed;
                return (
                  <button key={d.id} onClick={() => openDispute(d.id)} className="dc-row">
                    <div>
                      <p className="dc-row__meta">{[d.saleEventRef, d.tenantName, d.createdAt].filter(Boolean).join(' · ')}</p>
                      <p className="dc-row__title">{catLabel(d.category)}</p>
                      {d.listingTitle && <p className="dc-row__meta">{d.listingTitle}</p>}
                    </div>
                    <span className="dc-status" style={{ color: m.color, background: m.bg }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
            {listLoading && relevant.length === 0 && <div className="dc-empty">Loading disputes…</div>}
            {!listLoading && relevant.length === 0 && (
              <div className="dc-empty">{disputes.length > 0 ? 'Nothing here right now.' : custodian ? 'No disputes on record.' : 'You have no disputes yet.'}</div>
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

        {view === 'detail' && !selected && (
          <>
            <button onClick={() => setView('list')} className="dc-back">← Back to Disputes</button>
            {detailLoading && <div className="dc-empty">Loading dispute…</div>}
          </>
        )}

        {view === 'detail' && selected && (
          <>
            <button onClick={() => setView('list')} className="dc-back">← Back to Disputes</button>
            <span className="dc-status dc-status--block" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
            <h2 className="dc-detail-title">{catLabel(selected.category)}</h2>
            <p className="dc-detail-desc">{selected.description}</p>
            <p className="dc-detail-authority">Ruling authority: {selected.rulingAuthorityType === 'tenant_admin' ? 'Tenant Admin' : 'Super Admin'} · {[selected.saleEventRef, selected.listingTitle, selected.tenantName].filter(Boolean).join(' · ')}{selected.createdAt ? ` · Filed ${selected.createdAt}` : ''}</p>

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
