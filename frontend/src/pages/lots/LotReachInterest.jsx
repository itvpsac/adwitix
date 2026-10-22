import { useState } from 'react';
import { Link } from 'react-router-dom';
import './LotReachInterest.css';
import AppHeader from '../../components/AppHeader.jsx';
import { lotReach } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';

const mark = (b) => (b ? '✓' : '—');

export default function LotReachInterest() {
  const [composerId, setComposerId] = useState(null);
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  // GET /my-listings/reach → { totals, listings: [{ listing, matchedBuyers, fullMatchCount }] }
  const { data, loading, error } = useApiQuery(() => lotReach.index(), []);
  const LISTINGS = ((data && data.listings) || []).map((r) => ({
    id: r.listing.id,
    title: r.listing.title || r.listing.category,
    viewCount: Number(r.listing.view_count || 0),
    fullMatches: r.fullMatchCount,
    matchedBuyers: r.matchedBuyers || [],
  }));
  const totals = (data && data.totals) || { lots: 0, matched: 0, viewed: 0 };
  const composerListing = LISTINGS.find((l) => l.id === composerId);

  const send = async () => {
    if (!message.trim()) return;
    setSending(true); setSendError('');
    try {
      await lotReach.sendMessage(composerId, { message_body: message });
      setFlash('Message sent.');
      setComposerId(null);
    } catch (err) {
      setSendError(err.description || err.message || 'Could not send the message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="lri-page">
      <AppHeader variant="light" contextNav={[{ label: "Seller Dashboard", to: "/seller/dashboard" }, { label: "Reach & Interest", to: "/lot-reach-and-interest", active: true }]} />
      <main className="lri-main">
        <h1 className="lri-title">Lot Reach &amp; Interest</h1>
        <p className="lri-sub">For each live Listing, see which Buyers match on category, location and value preferences — plus who's actually viewed or favorited it — so you know who to reach out to.</p>
        {flash && <p className="lri-flash">{flash}</p>}

        <div className="lri-stats">
          <div className="lri-stat"><b>{loading || error ? '—' : totals.lots}</b><span>Live Listings</span></div>
          <div className="lri-stat"><b style={{ color: 'var(--color-accent)' }}>{loading || error ? '—' : totals.matched}</b><span>Full Matches (Category + Location + Value)</span></div>
          <div className="lri-stat"><b>{loading || error ? '—' : totals.viewed}</b><span>Total Views</span></div>
        </div>

        {loading && <p className="lri-no-match">Loading…</p>}
        {error && <p className="lri-no-match" style={{ color: 'var(--color-danger)' }}>{error.description || error.message || 'Could not load reach data.'}</p>}
        {!loading && !error && LISTINGS.length === 0 && <p className="lri-no-match">No live Listings yet.</p>}
        {LISTINGS.map((l) => (
          <div key={l.id} className="lri-card">
            <div className="lri-card__head">
              <div>
                <p className="lri-card__title"><Link to={`/lot-detail?id=${l.id}`}>{l.title}</Link></p>
                <p className="lri-card__meta">{l.viewCount} views · {l.fullMatches} full match{l.fullMatches === 1 ? '' : 'es'}</p>
              </div>
              {l.matchedBuyers.length > 0 && <button className="lri-msg-btn" onClick={() => { setComposerId(l.id); setMessage(''); setSendError(''); setFlash(''); }}>Message matched buyers</button>}
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
            {sendError && <p className="lri-modal__sub" style={{ color: 'var(--color-danger)' }}>{sendError}</p>}
            <div className="lri-modal__actions">
              <button className="lri-modal__cancel" onClick={() => setComposerId(null)}>Cancel</button>
              <button className="lri-modal__send" onClick={send} disabled={sending || !message.trim()}>{sending ? 'Sending…' : 'Send'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
