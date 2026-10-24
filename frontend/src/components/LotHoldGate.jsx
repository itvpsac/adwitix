import { useState } from 'react';
import './LotHoldGate.css';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, isCustodian, patchStoredUser } from '../utils/auth.js';
import { objections } from '../api/endpoints.js';
import { unwrap } from '../api/client.js';

// D-140: when the Custodian puts one of a seller's Lots on hold, the seller
// must read what that means and say they understand — shown over every
// page after sign-in until they do. There is no deadline: the Lot stays on
// hold until it is corrected, and this notice says so plainly.
export default function LotHoldGate() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const unread = ((user && !isCustodian(user) && user.lotsOnHold) || []).filter((o) => !o.acknowledged_at);
  // The AcceptanceGate (Terms) comes first; the fix page itself stays usable.
  if (!unread.length || (user.pendingAcceptances || []).length || pathname === '/fix-lot') return null;
  const o = unread[0];

  const acknowledge = async () => {
    setBusy(true); setError('');
    try {
      const res = unwrap(await objections.acknowledge(o.id)) || {};
      const ack = res.objection?.acknowledged_at || new Date().toISOString();
      patchStoredUser({ lotsOnHold: user.lotsOnHold.map((x) => (x.id === o.id ? { ...x, acknowledged_at: ack } : x)) });
      setUnderstood(false);
    } catch (e) {
      setError(e.description || e.message || 'Could not record that. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lhg-back">
      <div role="dialog" aria-modal="true" aria-labelledby="lhg-title" className="lhg">
        <span className="lhg__tag">Lot on hold{unread.length > 1 ? ` · 1 of ${unread.length}` : ''}</span>
        <h2 id="lhg-title">Your Lot &ldquo;{o.lot_title}&rdquo; has been put on hold</h2>
        <div className="lhg__why">
          <b>{o.reason_label}</b>
          <p>{o.note}</p>
        </div>
        <ul className="lhg__list">
          <li><b>It can&apos;t be sold while it is on hold.</b> It can&apos;t be approved, scheduled or bid on{Number(o.sessions_stopped) ? `, and its live Trading Session${Number(o.sessions_stopped) > 1 ? 's were' : ' was'} stopped — bids withdrawn and deposits returned` : ''}.</li>
          <li><b>There is no deadline.</b> The Lot simply stays on hold until it is corrected — nothing happens to it automatically, but it will not sell until you fix it.</li>
          <li><b>What to do:</b> {o.what_to_fix}</li>
          <li>When you have fixed it, submit the fix. The Custodian checks it and lifts the hold, then your TSX Master approves the Lot again before it can be sold.</li>
          {o.cbs_offense_number ? <li><b>This has been recorded as a Certified-by-Seller photo violation</b> (offence #{o.cbs_offense_number}) on your seller record (BR-59/BR-61). Repeated violations lead to a Standing Review.</li> : null}
        </ul>
        <label className="lhg__check">
          <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
          I understand my Lot stays on hold, and cannot be sold, until I correct it.
        </label>
        {error && <p role="alert" className="lhg__err">{error}</p>}
        <div className="lhg__acts">
          <button type="button" className="lhg__btn" disabled={!understood || busy} onClick={acknowledge}>{busy ? 'Saving…' : 'I understand'}</button>
          {understood && <Link to={`/fix-lot?id=${o.listing_id}`} className="lhg__link" onClick={acknowledge}>I understand — fix it now →</Link>}
        </div>
      </div>
    </div>
  );
}
