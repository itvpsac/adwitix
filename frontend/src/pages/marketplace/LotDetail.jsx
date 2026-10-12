import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './LotDetail.css';
import AppHeader from '../../components/AppHeader.jsx';
import { listings } from '../../api/endpoints.js';

const FORMAT_META = {
  EASY: { ctaLabel: 'Place Bid', isEasy: true },
  EXPRESS: { ctaLabel: 'Submit Sealed Bid', isExpress: true },
  TENDER: { ctaLabel: 'Submit Tender Offer', isTender: true },
  'BUY-NOW': { ctaLabel: 'Buy Now', isBuyNow: true },
};
const matchColor = (v) => (v === 'Yes' ? 'var(--color-success)' : 'var(--color-text-faint)');

export default function LotDetail() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const [lot, setLot] = useState(null);

  useEffect(() => {
    if (id) {
      listings.show(id).then(setLot).catch(console.error);
    }
  }, [id]);

  if (!lot) return <div>Loading...</div>;

  const meta = FORMAT_META[lot.format] || FORMAT_META.EASY;

  return (
    <div className="ldp-page">
      <AppHeader variant="light" contextNav={[{ label: "Marketplace", to: "/marketplace" }, { label: "Lot Detail", to: `/lot-detail?id=${id}`, active: true }]} />

      <main className="ldp-main">
        <div className="ldp-crumb">{lot.category} · {lot.tsx} · <span className="ldp-mono">{lot.id}</span></div>

        <div className="ldp-layout">
          <div>
            <div className="ldp-hero-photo" />
            <div className="ldp-thumbs">{[1,2,3,4,5].map((t) => <div key={t} className="ldp-thumb" />)}</div>

            <h1 className="ldp-title">{lot.title}</h1>
            <div className="ldp-tags">
              <span className="ldp-tag">{lot.condition}</span>
              {lot.matches && <span className="ldp-tag ldp-tag--match">✓ Matches your preferences</span>}
            </div>

            <h2 className="ldp-h2">Description</h2>
            <p className="ldp-desc">{lot.description}</p>

            <h2 className="ldp-h2">Market Maker</h2>
            <div className="ldp-mm">
              <div className="ldp-mm__avatar">{lot.mmInitials || '?'}</div>
              <div><div className="ldp-mm__name">{lot.mmName}</div><div className="ldp-mm__meta">MM★ {lot.mmRating} · Selling on {lot.tsx}</div></div>
            </div>
          </div>

          <div className="ldp-bid-box">
            <span className="ldp-format-badge">{lot.format}</span>
            <div className="ldp-price-label">{lot.priceLabel}</div>
            <div className="ldp-price-value">{lot.priceValue}</div>
            <div className="ldp-timeleft">{lot.timeLeft}</div>

            {meta.isEasy && (<><input className="ldp-bid-input" placeholder="Enter your bid (₹)" /><p className="ldp-bid-note">Open ascending bid — no reserve. Highest bid wins at close.</p></>)}
            {meta.isExpress && (<><input className="ldp-bid-input" placeholder="Enter your sealed bid (₹)" /><p className="ldp-bid-note">Sealed-bid, single round. Bids are hidden until the 24-hour window closes.</p></>)}
            {meta.isTender && (<><input className="ldp-bid-input" placeholder="Enter your tender offer (₹)" /><p className="ldp-bid-note">Multi-round sealed bid. Reserve and Expected Value disclosed after close.</p></>)}
            {meta.isBuyNow && <p className="ldp-bid-note">Fixed price — pay now to settle instantly, no bidding.</p>}

            {meta.isBuyNow ? (
              <button className="ldp-cta">{meta.ctaLabel}</button>
            ) : (
              <>
                <p className="ldp-emd-note">Bidding requires <Link to="/emd-consent">EMD consent</Link></p>
                <Link to={`/bidding-room?id=${lot.id}&format=${lot.format}`} className="ldp-cta">{meta.ctaLabel}</Link>
              </>
            )}
            <button className="ldp-watchlist">☆ Add to Watchlist</button>

            <div className="ldp-matches">
              <div><span>Category Match</span><span style={{ color: matchColor(lot.catMatch) }}>{lot.catMatch}</span></div>
              <div><span>Location Match</span><span style={{ color: matchColor(lot.locMatch) }}>{lot.locMatch}</span></div>
              <div><span>Value Match</span><span style={{ color: matchColor(lot.valMatch) }}>{lot.valMatch}</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
