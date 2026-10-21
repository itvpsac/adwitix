import { useState } from 'react';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { pushLedger } from '../../utils/auditLedger.js';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import './RatingReviews.css';

const stamp = (v) => (v || '').slice(0, 16).replace('T', ' ');
const ROLE_LABEL = { star_rating: 'Trader rating', seller_star_rating: 'Market Maker rating' };

export default function RatingReviews() {
  const [showInfo, setShowInfo] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [decided, setDecided] = useState([]);

  // GET /admin/rating-reviews → { pending: rating_event rows awaiting approval }
  const { data, loading, error: loadError, reload } = useApiQuery(() => admin.ratingReviews(), []);
  const pending = ((data && data.pending) || []).map((r) => ({
    id: r.id,
    ratee: r.mobile_number,
    eventType: `${ROLE_LABEL[r.rating_role] || r.rating_role} · ${(r.event_type || '').replace(/_/g, ' ')}`,
    from: r.previous_value != null ? Number(r.previous_value).toFixed(1) : '—',
    to: r.new_value != null ? Number(r.new_value).toFixed(1) : '—',
    at: stamp(r.created_at),
    reason: r.reason,
  }));

  const approve = async (r) => {
    setBusyId(r.id);
    setActionError('');
    try {
      await admin.approveRatingReview(r.id, {});
      pushLedger('Approved Rating Downgrade', r.ratee, `${r.from}★ → ${r.to}★`);
      setDecided([{ id: r.id, ratee: r.ratee, change: `${r.from}★ → ${r.to}★`, at: stamp(new Date().toISOString()) }, ...decided]);
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not approve the downgrade.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ConsoleFrame header={<DashboardHeader navItems={[{ label: 'Dashboard', to: '/tenant-admin/dashboard' }, { label: 'Rating Reviews', to: '/rating-reviews', active: true }]} />}>
    <div className="rr-page">
      <main className="rr-main">
        <div className="legal-eyebrow">Custodian</div>
        <div className="rr-title-row">
          <h1 className="rr-title">Rating Reviews</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="rr-info-btn">i</button>
        </div>
        <p className="rr-sub">Rating downgrades held for approval before they apply. Approving applies the downgrade to the party's star rating; it is recorded to the Audit Ledger.</p>
        {showInfo && (
          <div className="rr-info-box">
            <strong>Why this screen exists:</strong> Under BR-36 a rating downgrade does not take effect until a Tenant Admin or the Custodian approves it, so no single rating event can silently damage a party's standing.
            <button onClick={() => setShowInfo(false)} className="rr-info-close">Close</button>
          </div>
        )}

        <div className="rr-list">
          {pending.map((r) => (
            <div key={r.id} className="rr-row">
              <div className="rr-row__head">
                <div>
                  <div className="rr-row__title">{r.ratee}</div>
                  <div className="rr-row__meta">{r.eventType} · {r.at}</div>
                </div>
                <span className="rr-stars">{r.from}★ → {r.to}★</span>
              </div>
              <div className="rr-line rr-line--last"><strong>Reason:</strong> "{r.reason}"</div>
              <div className="rr-btn-row">
                <button onClick={() => approve(r)} disabled={busyId === r.id} className="rr-btn-success">{busyId === r.id ? 'Approving…' : 'Approve Downgrade'}</button>
              </div>
            </div>
          ))}
        </div>
        {actionError && <div className="rr-empty" style={{ color: 'var(--color-danger)' }}>{actionError}</div>}
        {loading && <div className="rr-empty">Loading…</div>}
        {!loading && loadError && <div className="rr-empty" style={{ color: 'var(--color-danger)' }}>Could not load rating reviews: {loadError.message || 'request failed'}.</div>}
        {!loading && !loadError && pending.length === 0 && <div className="rr-empty">No rating changes pending review.</div>}

        {decided.length > 0 && (
          <>
            <h2 className="rr-decided-title">Approved this session</h2>
            <div className="rr-decided-list">
              {decided.map((d) => (
                <div key={d.id} className="rr-decided-row">
                  <span className="rr-decided-status" style={{ color: 'var(--color-success)' }}>APPROVED</span>
                  <span className="rr-decided-body"> — {d.ratee} · {d.change} · {d.at}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
    </ConsoleFrame>
  );
}
