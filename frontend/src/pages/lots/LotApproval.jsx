import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { auth as authApi, tenants as tenantsApi, listings as listingsApi, saleEvents as saleEventsApi } from '../../api/endpoints.js';
import { unwrap, mediaUrl } from '../../api/client.js';
import { readAuth } from '../../utils/auth.js';
import { formatCurrency } from '../../utils/format.js';
import './LotApproval.css';

// Data: the tenant comes from the login response / GET /auth/me
// (party.admin_tenants), then GET /tenants/:id/verification
// (TenantAdminController::verification) → { tenant, pending, pendingSaleEvents }.
// Decisions: POST /listings/:id/approve, /listings/:id/reject
// ({ reason_key, detail }) and /sale-events/:id/approve.
const FORMAT_LABELS = { easy: 'EASY', express: 'EXPRESS', buy_now: 'BUY-NOW', tender: 'TENDER' };
// Mirrors ListingLifecycleService::REJECTION_REASONS (closed list).
const REJECTION_REASONS = {
  insufficient_photos: 'Insufficient photos',
  suspected_fraudulent_images: 'Suspected fraudulent images',
  mismatched_description: 'Mismatched description',
  incomplete_metadata: 'Incomplete metadata',
};

const humanize = (v) => (v ? String(v).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '');
const shortDateTime = (d) => (d ? String(d).slice(0, 16) : '');
const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

export default function LotApproval() {
  const [tenantChoices, setTenantChoices] = useState([]);
  const [tenantId, setTenantId] = useState('');
  const [tenant, setTenant] = useState(null);
  const [lots, setLots] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tab, setTab] = useState('lots');
  const [view, setView] = useState('queue');
  const [selectedId, setSelectedId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDetail, setRejectDetail] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const me = readAuth() || {};
  const reviewer = [me.name, me.mobile].filter(Boolean).join(' · ');

  // Which tenant(s) does this user administer? Same lookup as the
  // Tenant Admin dashboard: saved login response first, then /auth/me.
  useEffect(() => {
    const saved = me.adminTenants || [];
    if (saved.length) { setTenantChoices(saved); setTenantId(saved[0].id); }
    authApi.me()
      .then((res) => {
        const party = unwrap(res).party || {};
        const list = party.admin_tenants || [];
        if (list.length) { setTenantChoices(list); setTenantId((cur) => (list.some((t) => t.id === cur) ? cur : list[0].id)); }
        else if (!saved.length) { setLoading(false); setError('Lot Approval is for Tenant Admins (TSX Masters). Your account is not a Tenant Admin for any tenant.'); }
      })
      .catch((err) => {
        if (!saved.length || err.status === 401) {
          setLoading(false);
          setError(err.status === 401 ? 'Please log in to review lots.' : (err.message || 'Could not load your account.'));
        }
      });
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    tenantsApi.verification(tenantId)
      .then((res) => {
        if (cancelled) return;
        const data = unwrap(res);
        setTenant(data.tenant || null);
        setLots((data.pending || []).map((l) => ({ ...l, decided: false, decision: null })));
        setSessions((data.pendingSaleEvents || []).map((se) => ({ ...se, decided: false, decision: null })));
      })
      .catch((err) => { if (!cancelled) setError(err.status === 403 ? 'You are not the Tenant Admin for this tenant.' : (err.message || 'Could not load the approval queue.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tenantId]);

  const selectedLot = lots.find((l) => l.id === selectedId);
  const selectedSession = sessions.find((se) => se.id === selectedId);
  const pendingLots = lots.filter((l) => !l.decided);
  const pendingSessions = sessions.filter((se) => !se.decided);

  const openLot = (id) => { setSelectedId(id); setRejectReason(''); setRejectDetail(''); setActionError(''); setView('lotDetail'); };
  const openSession = (id) => { setSelectedId(id); setActionError(''); setView('sessionDetail'); };

  const run = async (call, onDone) => {
    setBusy(true);
    setActionError('');
    try {
      await call();
      onDone();
    } catch (err) {
      setActionError(err.description || err.message || 'Request failed.');
    } finally {
      setBusy(false);
    }
  };

  const approveLot = () => run(
    () => listingsApi.approve(selectedId),
    () => setLots(lots.map((l) => (l.id === selectedId ? { ...l, decided: true, decision: { label: 'Approved — Live on TradeSphereX', at: now() } } : l))),
  );
  const rejectLot = () => {
    if (!rejectReason) { setActionError('Select a reason for rejection.'); return; }
    run(
      () => listingsApi.reject(selectedId, { reason_key: rejectReason, detail: rejectDetail.trim() || undefined }),
      () => setLots(lots.map((l) => (l.id === selectedId ? { ...l, decided: true, decision: { label: 'Rejected — Returned to Market Maker inventory', reason: [REJECTION_REASONS[rejectReason], rejectDetail.trim()].filter(Boolean).join(': '), at: now() } } : l))),
    );
  };
  const approveSession = () => run(
    () => saleEventsApi.approve(selectedId),
    () => setSessions(sessions.map((se) => (se.id === selectedId ? { ...se, decided: true, decision: { label: 'Approved — Trading Session Starting', at: now() } } : se))),
  );

  return (
    <div className="la-page">
      <DashboardHeader consoleLabel="TSX Master" navItems={[{ label: 'Dashboard', to: '/tenant-admin/dashboard' }, { label: 'Lot Approval', to: '/lot-approval', active: true }]} />
      <main className="la-main">
        <div className="legal-eyebrow">TSX Master{tenant?.name ? ` · ${tenant.name}` : ''}</div>
        <h1 className="la-title">Lot &amp; Trading Session Approval</h1>
        <p className="la-sub">Review submitted Lots and requested Trading Sessions before they go live on this TradeSphereX.</p>
        {reviewer && <p className="la-reviewer">Reviewing as: {reviewer}</p>}
        {tenantChoices.length > 1 && (
          <select className="la-input" style={{ maxWidth: 320 }} value={tenantId} onChange={(e) => { setTenantId(e.target.value); setView('queue'); }}>
            {tenantChoices.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}

        {error && <div className="la-empty">{error}</div>}
        {!error && loading && <div className="la-empty">Loading approval queue…</div>}

        {!error && !loading && (
          <>
            <div className="la-tabs">
              <button onClick={() => { setTab('lots'); setView('queue'); }} className={`la-tab${tab === 'lots' ? ' la-tab--active' : ''}`}>Lots ({pendingLots.length})</button>
              <button onClick={() => { setTab('sessions'); setView('queue'); }} className={`la-tab${tab === 'sessions' ? ' la-tab--active' : ''}`}>Trading Sessions ({pendingSessions.length})</button>
            </div>

            {view === 'queue' && tab === 'lots' && (
              <div className="la-list">
                {pendingLots.map((l) => (
                  <button key={l.id} onClick={() => openLot(l.id)} className="la-row">
                    {l.primaryPhotoPath
                      ? <img className="la-thumb" src={mediaUrl(l.primaryPhotoPath)} alt="" style={{ objectFit: 'cover' }} />
                      : <div className="la-thumb" />}
                    <div className="la-row__body">
                      <p className="la-row__meta">SUBMITTED {shortDateTime(l.updated_at || l.created_at)}{l.city ? ` · ${l.city}` : ''}</p>
                      <p className="la-row__title">{l.title || humanize(l.category)}</p>
                      <p className="la-row__sub">{[humanize(l.category), humanize(l.physical_condition), `${l.photoCount || 0} photos`].filter(Boolean).join(' · ')}</p>
                    </div>
                    <span className="la-pending">Pending</span>
                  </button>
                ))}
                {pendingLots.length === 0 && <div className="la-empty">No Lots awaiting approval.</div>}
              </div>
            )}
            {view === 'queue' && tab === 'sessions' && (
              <div className="la-list">
                {pendingSessions.map((se) => (
                  <button key={se.id} onClick={() => openSession(se.id)} className="la-row la-row--between">
                    <div>
                      <p className="la-row__meta">{se.ern}</p>
                      <p className="la-row__title">{humanize(se.category)}{se.subcategory ? ` — ${humanize(se.subcategory)}` : ''}</p>
                      <p className="la-row__sub">{FORMAT_LABELS[se.sale_format] || se.sale_format} · RV {formatCurrency(se.reserve_value)}</p>
                    </div>
                    <span className="la-pending">Pending</span>
                  </button>
                ))}
                {pendingSessions.length === 0 && <div className="la-empty">No Trading Sessions awaiting approval.</div>}
              </div>
            )}

            {view === 'lotDetail' && selectedLot && (
              <>
                <button className="la-back" onClick={() => setView('queue')}>← Back to Queue</button>
                <div className="la-detail-card">
                  <p className="la-row__meta">SUBMITTED {shortDateTime(selectedLot.updated_at || selectedLot.created_at)}</p>
                  <h2 className="la-h2">{selectedLot.title || humanize(selectedLot.category)}</h2>
                  {selectedLot.primaryPhotoPath && (
                    <img src={mediaUrl(selectedLot.primaryPhotoPath)} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 10, marginBottom: 14 }} />
                  )}
                  {selectedLot.description && <p className="la-desc">{selectedLot.description}</p>}
                  <div className="la-facts">
                    <span><strong>Category:</strong> {humanize(selectedLot.category)}{selectedLot.subcategory ? ` / ${humanize(selectedLot.subcategory)}` : ''}</span>
                    <span><strong>Condition:</strong> {humanize(selectedLot.physical_condition) || '—'}</span>
                    {selectedLot.quantity && <span><strong>Quantity:</strong> {selectedLot.quantity}</span>}
                    {(selectedLot.city || selectedLot.state) && <span><strong>Location:</strong> {[selectedLot.city, selectedLot.state].filter(Boolean).join(', ')}</span>}
                    <span><strong>Media:</strong> {selectedLot.photoCount || 0} photos · {selectedLot.videoCount || 0} videos · {selectedLot.documentCount || 0} documents</span>
                  </div>
                  {selectedLot.queuedJobCount > 0 && <p className="la-error">{selectedLot.queuedJobCount} media upload(s) still processing.</p>}
                  <Link to={`/lot-detail?id=${selectedLot.id}`} className="la-edit-btn">View full Lot →</Link>
                </div>

                {selectedLot.decided ? (
                  <div className="la-decided">
                    <p className="la-decided__meta">DECIDED {selectedLot.decision.at}</p>
                    <p className="la-decided__label">{selectedLot.decision.label}</p>
                    {selectedLot.decision.reason && <p className="la-decided__reason">{selectedLot.decision.reason}</p>}
                  </div>
                ) : (
                  <>
                    <label className="la-label">Rejection reason (required to reject)</label>
                    <select className="la-input" value={rejectReason} onChange={(e) => { setRejectReason(e.target.value); setActionError(''); }}>
                      <option value="">Select a reason…</option>
                      {Object.entries(REJECTION_REASONS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                    </select>
                    <textarea className="la-textarea" placeholder="Additional detail for the Market Maker (optional)" rows={3} value={rejectDetail} onChange={(e) => setRejectDetail(e.target.value)} />
                    {actionError && <p className="la-error">{actionError}</p>}
                    <div className="la-btn-row la-btn-row--wrap">
                      <button className="la-btn-dark" disabled={busy} onClick={approveLot}>Approve — Go Live</button>
                      <button className="la-btn-danger" disabled={busy} onClick={rejectLot}>Reject</button>
                    </div>
                  </>
                )}
              </>
            )}

            {view === 'sessionDetail' && selectedSession && (
              <>
                <button className="la-back" onClick={() => setView('queue')}>← Back to Queue</button>
                <div className="la-detail-card">
                  <p className="la-row__meta">{selectedSession.ern}</p>
                  <h2 className="la-h2">{humanize(selectedSession.category)}{selectedSession.subcategory ? ` — ${humanize(selectedSession.subcategory)}` : ''}</h2>
                  <div className="la-facts">
                    <span><strong>Format:</strong> {FORMAT_LABELS[selectedSession.sale_format] || selectedSession.sale_format}</span>
                    <span><strong>Reserve Value:</strong> {formatCurrency(selectedSession.reserve_value)}</span>
                    {selectedSession.expected_value && <span><strong>Expected Value:</strong> {formatCurrency(selectedSession.expected_value)}</span>}
                  </div>
                  <Link to={`/lot-detail?id=${selectedSession.listing_id}`} className="la-edit-btn">View Lot →</Link>
                </div>
                {selectedSession.decided ? (
                  <div className="la-decided">
                    <p className="la-decided__meta">DECIDED {selectedSession.decision.at}</p>
                    <p className="la-decided__label">{selectedSession.decision.label}</p>
                  </div>
                ) : (
                  <>
                    {actionError && <p className="la-error">{actionError}</p>}
                    <div className="la-btn-row">
                      <button className="la-btn-dark" disabled={busy} onClick={approveSession}>Approve — Start Session</button>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
      <footer className="la-footer"><p>Approved Lots and Trading Sessions go live immediately on this TradeSphereX. Every approval and rejection here is recorded in the <Link to="/audit-ledger">Audit Ledger</Link>.</p></footer>
    </div>
  );
}
