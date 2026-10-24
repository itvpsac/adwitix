import { Link } from 'react-router-dom';
import { useAuth } from '../utils/auth.js';

// D-140: a seller's Lots on hold after a Custodian objection, wherever the
// seller looks at their selling (dashboard, Lot page).
export default function LotsOnHoldBanner({ listingId }) {
  const { user } = useAuth();
  const held = ((user && user.lotsOnHold) || []).filter((o) => !listingId || o.listing_id === listingId);
  if (!held.length) return null;
  return (
    <div role="status" style={{ margin: '0 0 16px', padding: '14px 16px', borderRadius: 12, background: '#FFF8F5', border: '1px solid #F0C9BE', font: '500 14px/1.5 var(--font-sans)', color: 'var(--color-text)' }}>
      <b style={{ color: 'var(--color-danger)' }}>{held.length === 1 ? 'A Lot of yours is on hold' : `${held.length} of your Lots are on hold`}</b>
      {' '}— the Custodian found a problem. {held.length === 1 ? 'It' : 'They'} can&apos;t be sold until corrected; there is no deadline, {held.length === 1 ? 'it stays' : 'they stay'} on hold until fixed.
      <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
        {held.map((o) => (
          <li key={o.id}>
            <b>{o.lot_title}</b> · {o.reason_label}{o.status === 'fix_submitted' ? ' · your fix is with the Custodian' : ''}
            {' '}<Link to={`/fix-lot?id=${o.listing_id}`} style={{ fontWeight: 700 }}>{o.status === 'fix_submitted' ? 'View' : 'Fix it'} →</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
