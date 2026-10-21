import { useState } from 'react';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { pushLedger } from '../../utils/auditLedger.js';
import { admin } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { useApiQuery } from '../../api/hooks.js';
import '../compliance/CustodianShared.css';
import './KycQueue.css';


const TABS = [
  { key: 'submitted', label: 'Pending review' },
  { key: 'verified', label: 'Verified' },
  { key: 'suspended', label: 'Suspended' },
];

export default function KycQueue() {
  const [showInfo, setShowInfo] = useState(false);
  const [tab, setTab] = useState('submitted');
  const [openId, setOpenId] = useState(null);
  const [suspendId, setSuspendId] = useState(null);
  const [suspendReasons, setSuspendReasons] = useState({});
  const [details, setDetails] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  // GET /admin/kyc?status= → { parties: [rows incl. document_count, address_count, kyc_status_reason] }
  const { data: apiData, loading: apiLoading, error: apiError, reload } = useApiQuery(() => admin.kycQueue({ status: tab }), [tab]);
  const apiRows = (!apiError && apiData && apiData.parties) || [];
  const fmt = (ts) => (ts || '').slice(0, 16).replace('T', ' ');
  const rows = apiRows.map((k) => ({
    id: k.id,
    name: k.full_name || k.mobile_number || '—',
    entityType: (k.entity_type || 'individual').toLowerCase() === 'organization' ? 'Organization' : 'Individual',
    mobile: k.mobile_number || '—',
    at: fmt(tab === 'submitted' ? (k.kyc_submitted_at || k.updated_at) : (k.updated_at || k.kyc_submitted_at)),
    documentCount: Number(k.document_count || 0),
    addressCount: Number(k.address_count || 0),
    reason: k.kyc_status_reason || '',
  }));

  // GET /admin/kyc/:id → { party, documents, addresses, suspensionReasons }.
  // Fetched only when a dossier is opened or a suspension is started.
  const loadDetail = (id) => {
    if (details[id] && !details[id].error) return;
    setDetails((cur) => ({ ...cur, [id]: null }));
    admin.kycDetail(id)
      .then((res) => setDetails((cur) => ({ ...cur, [id]: unwrap(res) })))
      .catch((err) => setDetails((cur) => ({ ...cur, [id]: { error: err.message || 'Could not load dossier detail.' } })));
  };
  const toggleOpen = (id) => {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    loadDetail(id);
  };
  const startSuspend = (id) => { setSuspendId(id); loadDetail(id); };
  const switchTab = (key) => {
    if (key === tab) return;
    setTab(key); setOpenId(null); setSuspendId(null); setActionError('');
  };

  const decide = async (k, payload, status, reasonLabel) => {
    setBusyId(k.id);
    setActionError('');
    try {
      await admin.kycDecide(k.id, payload);
      pushLedger(status === 'VERIFIED' ? 'Verified KYC Dossier' : 'Suspended KYC Dossier', k.name, reasonLabel || k.entityType);
      setSuspendId(null);
      setOpenId(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not record the KYC decision.');
    } finally {
      setBusyId(null);
    }
  };
  const verify = (k) => decide(k, { decision: 'verify' }, 'VERIFIED');
  const confirmSuspend = (k) => {
    const reason = suspendReasons[k.id] || '';
    if (!reason) return;
    const options = (details[k.id] && details[k.id].suspensionReasons) || {};
    decide(k, { decision: 'suspend', reason }, 'SUSPENDED', options[reason] || reason);
  };
  // Show a stored reason key with its label when the closed list is loaded.
  const reasonLabel = (key) => {
    const d = Object.values(details).find((x) => x && x.suspensionReasons && x.suspensionReasons[key]);
    return d ? d.suspensionReasons[key] : key;
  };

  return (
    <ConsoleFrame header={<DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'KYC Queue', to: '/kyc-queue', active: true }]} />}>
    <div className="custodian-page">
      <main className="custodian-main">
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">KYC Queue</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="custodian-info-btn">i</button>
        </div>
        <p className="custodian-sub">Dossiers submitted (entity type, documents, address portfolio), awaiting a Verified or Suspended decision. Suspend requires a stated reason.</p>
        {showInfo && (
          <div className="custodian-info-box">
            <strong>Why this screen exists:</strong> Every dossier submitted — entity type, documents, address portfolio — is reviewed here before a Verified or Suspended decision is recorded. Suspension requires a stated reason.
            <button onClick={() => setShowInfo(false)} className="custodian-info-close">Close</button>
          </div>
        )}

        <div className="kq-tabs">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => switchTab(t.key)} className={`kq-tab${tab === t.key ? ' kq-tab--active' : ''}`}>{t.label}</button>
          ))}
        </div>

        <div className="kq-list">
          {!apiLoading && rows.map((k) => {
            const suspending = tab === 'submitted' && suspendId === k.id;
            const open = openId === k.id;
            const reason = suspendReasons[k.id] || '';
            const detail = details[k.id];
            const reasonOptions = (detail && detail.suspensionReasons) || {};
            const busy = busyId === k.id;
            return (
              <div key={k.id} className="kq-row">
                <div className="kq-row__head">
                  <div className="kq-name">{k.name} <span className="kq-name__meta">({k.entityType})</span></div>
                  <div className="kq-mobile">{k.mobile} · {tab === 'submitted' ? 'submitted' : tab} {k.at}</div>
                </div>
                <div className="kq-stats">
                  <span>{k.documentCount} {k.documentCount === 1 ? 'document' : 'documents'}</span>
                  <span>{k.addressCount} {k.addressCount === 1 ? 'address' : 'addresses'} on file</span>
                  <button onClick={() => toggleOpen(k.id)} className="kq-link">{open ? 'Hide dossier' : 'Open dossier'}</button>
                </div>
                {tab === 'suspended' && <div className="kq-reason">Reason: {k.reason ? reasonLabel(k.reason) : '—'}</div>}
                {open && (
                  <div className="kq-detail">
                    {detail === undefined || detail === null ? <span>Loading dossier…</span>
                      : detail.error ? <span style={{ color: 'var(--color-danger)' }}>{detail.error}</span>
                        : (detail.documents || []).length === 0 ? <span>No documents uploaded.</span>
                          : (
                            <ul className="kq-docs">
                              {detail.documents.map((d) => (
                                <li key={d.id}><strong>{d.document_type}</strong>{d.original_filename ? ` — ${d.original_filename}` : ''}</li>
                              ))}
                            </ul>
                          )}
                  </div>
                )}
                {tab === 'submitted' && (suspending ? (
                  <>
                    <select value={reason} onChange={(e) => setSuspendReasons({ ...suspendReasons, [k.id]: e.target.value })} className="custodian-textarea" disabled={!detail || !!detail.error}>
                      <option value="">{detail && detail.error ? 'Could not load reasons' : detail ? 'Reason for suspension (required)…' : 'Loading reasons…'}</option>
                      {Object.entries(reasonOptions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                    {detail && detail.error && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginBottom: 8 }}>{detail.error} <button onClick={() => loadDetail(k.id)} className="kq-link">Retry</button></div>}
                    <div className="custodian-btn-row">
                      <button onClick={() => confirmSuspend(k)} disabled={!reason || busy} className="custodian-btn-danger" style={{ opacity: reason && !busy ? 1 : 0.5 }}>{busy ? 'Saving…' : 'Confirm Suspend'}</button>
                      <button onClick={() => setSuspendId(null)} className="custodian-btn-outline">Cancel</button>
                    </div>
                  </>
                ) : (
                  <div className="custodian-btn-row">
                    <button onClick={() => verify(k)} disabled={busy} className="custodian-btn-success">{busy ? 'Saving…' : 'Verify'}</button>
                    <button onClick={() => startSuspend(k.id)} disabled={busy} className="custodian-btn-danger-outline">Suspend…</button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {actionError && <div className="custodian-empty" style={{ color: 'var(--color-danger)' }}>{actionError}</div>}
        {apiLoading && <div className="custodian-empty">Loading dossiers…</div>}
        {!apiLoading && apiError && <div className="custodian-empty" style={{ color: 'var(--color-danger)' }}>Could not load the KYC queue: {apiError.message || 'request failed'}. <button onClick={reload} className="kq-link">Retry</button></div>}
        {!apiLoading && !apiError && rows.length === 0 && (
          <div className="custodian-empty">
            {tab === 'submitted' ? 'No KYC dossiers pending review.' : tab === 'verified' ? 'No verified dossiers.' : 'No suspended dossiers.'}
          </div>
        )}
        {!apiLoading && !apiError && rows.length >= 200 && <div className="custodian-empty">Showing the first 200 dossiers.</div>}
      </main>
    </div>
    </ConsoleFrame>
  );
}
