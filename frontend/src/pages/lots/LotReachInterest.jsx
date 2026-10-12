import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './LotReachInterest.css';
import AppHeader from '../../components/AppHeader.jsx';

const LISTINGS = [
  { id: 1, title: 'CNC Lathe (Surplus)', viewCount: 64, matchedBuyers: [
    { partyId: 'b19f2a7c-11', categoryMatch: true, locationMatch: true, valueMatch: true, viewed: true, favorited: true },
    { partyId: '4d0e88b3-22', categoryMatch: true, locationMatch: true, valueMatch: false, viewed: true, favorited: false },
    { partyId: 'a7c15e90-33', categoryMatch: true, locationMatch: false, valueMatch: true, viewed: false, favorited: false },
  ]},
  { id: 2, title: 'Repossessed Excavator, CAT 320D', viewCount: 22, matchedBuyers: [
    { partyId: '9b2fa011-44', categoryMatch: true, locationMatch: true, valueMatch: true, viewed: true, favorited: false },
  ]},
  { id: 3, title: 'Office IT Assets Lot', viewCount: 8, matchedBuyers: [] },
];
const mark = (b) => (b ? '✓' : '—');

export default function LotReachInterest() {
  const [composerId, setComposerId] = useState(null);
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState('');

  const fullMatchCounts = useMemo(() => LISTINGS.map((l) => l.matchedBuyers.filter((m) => m.categoryMatch && m.locationMatch && m.valueMatch).length), []);
  const totals = { lots: LISTINGS.length, matched: fullMatchCounts.reduce((a, b) => a + b, 0), viewed: LISTINGS.reduce((a, l) => a + l.viewCount, 0) };
  const composerListing = LISTINGS.find((l) => l.id === composerId);

  return (
    <div className="lri-page">
      <AppHeader variant="light" contextNav={[{ label: "Lot Directory", to: "/lot-directory" }, { label: "Reach & Interest", to: "/lot-reach-and-interest", active: true }]} />
      <main className="lri-main">
        <h1 className="lri-title">Lot Reach &amp; Interest</h1>
        <p className="lri-sub">For each live Listing, see which Buyers match on category, location and value preferences — plus who's actually viewed or favorited it — so you know who to reach out to.</p>
        {flash && <p className="lri-flash">{flash}</p>}

        <div className="lri-stats">
          <div className="lri-stat"><b>{totals.lots}</b><span>Live Listings</span></div>
          <div className="lri-stat"><b style={{ color: 'var(--color-accent)' }}>{totals.matched}</b><span>Full Matches (Category + Location + Value)</span></div>
          <div className="lri-stat"><b>{totals.viewed}</b><span>Total Views</span></div>
        </div>

        {LISTINGS.map((l, i) => (
          <div key={l.id} className="lri-card">
            <div className="lri-card__head">
              <div>
                <p className="lri-card__title"><Link to="/lot-detail">{l.title}</Link></p>
                <p className="lri-card__meta">{l.viewCount} views · {fullMatchCounts[i]} full match{fullMatchCounts[i] === 1 ? '' : 'es'}</p>
              </div>
              {l.matchedBuyers.length > 0 && <button className="lri-msg-btn" onClick={() => { setComposerId(l.id); setMessage(''); }}>Message matched buyers</button>}
            </div>
            {l.matchedBuyers.length > 0 ? (
              <table className="lri-table">
                <thead><tr><th>Buyer</th><th>Category</th><th>Location</th><th>Value</th><th>Viewed</th><th>Favorited</th></tr></thead>
                <tbody>
                  {l.matchedBuyers.map((m) => (
                    <tr key={m.partyId}>
                      <td className="lri-mono">{m.partyId.slice(0, 8)}…</td>
                      <td>{mark(m.categoryMatch)}</td><td>{mark(m.locationMatch)}</td><td>{mark(m.valueMatch)}</td>
                      <td>{mark(m.viewed)}</td><td>{mark(m.favorited)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="lri-no-match">No buyers matched on any dimension yet.</p>}
          </div>
        ))}
      </main>

      {composerListing && (
        <div className="lri-modal-overlay" onClick={() => setComposerId(null)}>
          <div className="lri-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lri-modal__eyebrow">Message Matched Buyers</div>
            <h3>{composerListing.title}</h3>
            <p className="lri-modal__sub">Sending to {composerListing.matchedBuyers.length} matched Buyers. Delivered to their Messages inbox.</p>
            <textarea className="lri-modal__textarea" placeholder="e.g. This listing matches your preferences and closes soon." value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="lri-modal__actions">
              <button className="lri-modal__cancel" onClick={() => setComposerId(null)}>Cancel</button>
              <button className="lri-modal__send" onClick={() => { setComposerId(null); setFlash('Message sent.'); }}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
