import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './BiddingRoom.css';
import AppHeader from '../../components/AppHeader.jsx';

const LOT = {
  id: 'EA-2025-07-00056', title: 'Premium SUV — BMW X5 2021', category: 'Vehicles › SUV', location: 'Mumbai, Maharashtra',
  ev: 1310000, rv: 1180000, mmName: 'AutoCorp Solutions Pvt. Ltd.', mmInitials: 'AC', mmRating: '4.6', mmReviews: 128, trustIndex: 82, inspectedOn: '03 Jul 2025',
  assetDetails: [
    { k: 'Make / Model', v: 'BMW X5 xDrive30d' }, { k: 'Year', v: '2021' }, { k: 'Registration No.', v: 'MH14 XX 0077' },
    { k: 'KM Driven', v: '45,320 km' }, { k: 'Fuel Type', v: 'Diesel' }, { k: 'Transmission', v: 'Automatic' },
  ],
};
const FORMAT_META = {
  EASY: { key: 'EASY', label: 'Easy Auction', badge: 'EASY AUCTION', isTimed: true, hasInspection: true, timeNote: 'Set by the Market Maker', hasReserve: true, hasEV: false, showH1: true, maskSeller: false, noun: 'bid', arbiter: 'Market Maker', sealedOnce: false, emdNote: '10% of Reserve Value · checked on every bid', inputLabel: 'YOUR BID', cta: 'Submit Bid', revise: 'Revise Bid', winnerNote: 'Only the highest valid bid at close (H1) is eligible to win. The Market Maker may close automatically at the top bid, or hold results for manual approval — your Star Rating plays no part in who wins. If H1 defaults, the win passes to H2, then H3.', ratingRowLabel: 'Your rating (reputation only — not a factor here)', ratingMatters: false },
  EXPRESS: { key: 'EXPRESS', label: 'Express Auction', badge: 'EXPRESS AUCTION', isTimed: true, hasInspection: false, timeNote: 'Starts once 3 Traders pledge EMD', hasReserve: true, hasEV: false, showH1: true, maskSeller: false, noun: 'bid', arbiter: 'Market Maker', sealedOnce: true, emdNote: '10% of Reserve Value · checked on every bid', noInspectionNote: 'Express sessions run without a physical inspection window so the asset can move quickly. There is zero inspection window — the most buyer risk of any format.', inputLabel: 'YOUR BID', cta: 'Submit Bid', revise: 'Revise Bid', winnerNote: 'Only the highest valid bid at close (H1) wins, under standard auction rules — no manual review, no rating weighting.', ratingRowLabel: 'Your rating (reputation only — not a factor here)', ratingMatters: false },
  BUYNOW: { key: 'BUYNOW', label: 'Buy Now', badge: 'BUY NOW', isTimed: false, isInstant: true, hasInspection: true, hasReserve: false, hasEV: true, showH1: false, maskSeller: true, noun: 'offer', arbiter: 'Market Maker', sealedOnce: false, emdNote: '10% of Expected Value · checked on every offer', inputLabel: 'YOUR OFFER', cta: 'Submit Offer', revise: 'Revise Offer', winnerNote: 'The Market Maker personally reviews every offer against the stated Expected Value and chooses who to sell to — weighing both price and your Star Rating. The highest offer is not guaranteed to win.', ratingRowLabel: 'Your rating (factored into award)', ratingMatters: true },
  TENDER: { key: 'TENDER', label: 'Tender Auction', badge: 'TENDER · BY INVITATION', isTimed: true, hasInspection: true, timeNote: 'Window set by the Concierge', hasReserve: true, hasEV: false, showH1: true, maskSeller: false, noun: 'offer', arbiter: 'Concierge', sealedOnce: false, emdNote: 'Per the terms of your invitation', inputLabel: 'YOUR TENDER OFFER', cta: 'Submit Offer', revise: 'Revise Offer', winnerNote: 'This is a private, invitation-only tender run by the Company Shop. Offers are sealed — you see only your own. The Concierge evaluates offers against the curated terms of the tender and awards the Lot.', ratingRowLabel: 'Your rating (reputation only)', ratingMatters: false },
};
const fmtMoney = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

function strengthFor(bid, ev, rv, fmt, placed) {
  const t = fmt.key === 'TENDER';
  const noun = fmt.noun;
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
  const privacy = t ? 'Your offer is sealed — no other invited trader can see it.' : `Your ${noun} is confidential — no other trader can see it.`;
  const award = t ? 'The Concierge evaluates every offer against the curated terms of this tender and awards the Lot.' : (fmt.key === 'EXPRESS' ? 'Only the highest valid bid at close (H1) wins.' : 'Only the highest valid bid at close (H1) is eligible for award.');

  if (placed) {
    if (fmt.key === 'BUYNOW') return { icon: '🔒', title: 'Offer submitted', note: 'Your offer sits with the Market Maker, who reviews it against the Expected Value alongside your Star Rating. You may revise it until the Lot is sold.', bg: '#E7F0E9', border: '#CBE0D1', color: '#38724A' };
    if (placed < rv) return { icon: '⚠️', title: Noun + ' registered — below the Reserve Value', note: 'Your ' + noun + ' is logged but sits under the reserve. It cannot be awarded unless you raise it above the reserve before close.', bg: '#FBE9E5', border: '#F2CFC6', color: '#A93F2A' };
    return { icon: '🔒', title: Noun + ' registered — reserve met', note: privacy + ' ' + award, bg: '#E7F0E9', border: '#CBE0D1', color: '#38724A' };
  }
  if (fmt.key === 'BUYNOW') {
    if (!bid) return { icon: '🎯', title: 'Bid your best — weigh it against the expected value', note: 'Other offers are never shown. The Market Maker weighs your offer against the expected value and your Star Rating — the highest offer is not guaranteed to win.', bg: '#F7F8FB', border: '#E1E4ED', color: '#5B6178' };
    const r = bid / ev;
    if (r < 0.9) return { icon: '⚠️', title: 'Well below expected value', note: 'Offers this far below the expected value are rarely accepted. Consider raising it before you submit.', bg: '#FBE9E5', border: '#F2CFC6', color: '#A93F2A' };
    if (r < 0.98) return { icon: '📉', title: 'Slightly below expected value', note: 'You are in range but not leading it. A stronger figure meaningfully improves your chances.', bg: '#FBF6EC', border: '#EEE2CB', color: '#9C7430' };
    if (r < 1.05) return { icon: '✅', title: 'In line with expected value', note: 'A competitive position — the Market Maker weighs this offer alongside your Star Rating.', bg: '#E7F0E9', border: '#CBE0D1', color: '#38724A' };
    return { icon: '🔥', title: 'Above expected value', note: 'A strong position. The Market Maker still weighs your rating alongside the figure when deciding.', bg: '#E7F0E9', border: '#CBE0D1', color: '#38724A' };
  }
  if (!bid) return { icon: '🎯', title: t ? 'Offer above the Reserve Value — all offers stay sealed' : 'Bid above the Reserve Value — other bids stay hidden', note: t ? 'Offers are sealed — you see only your own. ' + award : 'Bids are confidential' + (fmt.sealedOnce ? ' and fixed once placed. ' : ' — revisable until close. ') + award, bg: '#F7F8FB', border: '#E1E4ED', color: '#5B6178' };
  if (bid < rv) return { icon: '⚠️', title: 'Below the Reserve Value — not yet submitted', note: 'This amount sits under the reserve. Raise it above the reserve before you submit your ' + noun + ', or it cannot be awarded.', bg: '#FBE9E5', border: '#F2CFC6', color: '#A93F2A' };
  return { icon: '✅', title: 'This ' + noun + ' would meet the Reserve Value', note: 'Nothing is placed yet — submit to register it.', bg: '#F7F8FB', border: '#E1E4ED', color: '#5B6178' };
}

export default function BiddingRoom() {
  const [params] = useSearchParams();
  const [format] = useState(() => (params.get('format') || 'EASY').toUpperCase().replace(/[^A-Z]/g, ''));
  const [bidInput, setBidInput] = useState('');
  const [myBid, setMyBid] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(767);
  const [mediaTab, setMediaTab] = useState('photos');

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = FORMAT_META[format] || FORMAT_META.EASY;
  const ev = LOT.ev, rv = LOT.rv;
  const bidNum = parseFloat((bidInput || '').replace(/[^0-9.]/g, ''));
  const ceiling = fmt.key === 'BUYNOW' ? Infinity : (myBid || rv) * 1.5;
  const overCeiling = bidNum > ceiling;
  const valid = bidNum > 0 && !overCeiling;
  const urgent = secondsLeft < 120;
  const strength = useMemo(() => strengthFor(valid ? bidNum : 0, ev, rv, fmt, bidInput ? 0 : myBid), [valid, bidNum, fmt, bidInput, myBid]);

  const guideVals = fmt.key === 'BUYNOW' ? [ev * 0.95, ev, ev * 1.05] : [rv, rv * 1.05, rv * 1.1];
  const guideLabels = fmt.key === 'BUYNOW' ? ['5% below EV', 'At EV', '5% above EV'] : ['At Reserve', '+5%', '+10%'];
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  const h1 = !myBid
    ? { label: 'NO ' + fmt.noun.toUpperCase() + ' PLACED', note: 'Place a' + (fmt.noun === 'offer' ? 'n offer' : ' bid') + ' to see your H1 standing', bg: '#F7F8FB', border: '#E1E4ED', color: '#5B6178' }
    : (myBid >= rv * 1.02
        ? { label: '★ YOU ARE H1', note: 'Highest ' + fmt.noun + ' — amounts of others stay hidden', bg: '#E7F0E9', border: '#CBE0D1', color: '#38724A' }
        : { label: 'YOU ARE NOT H1', note: 'Another ' + fmt.noun + ' is higher — its amount is never shown', bg: '#FBF6EC', border: '#EEE2CB', color: '#9C7430' });

  const ticker = [
    { id: 'Excavator CAT 320D', timeLeft: '04:12', status: 'H1', statusBg: '#1F4D32', statusColor: '#8FD6A9' },
    { id: 'Compressor Unit', timeLeft: '11:48', status: 'NOT H1', statusBg: '#4A3A16', statusColor: '#E5BE72' },
    { id: 'Cotton Yarn 40 Bales', timeLeft: '26:03', status: 'H1', statusBg: '#1F4D32', statusColor: '#8FD6A9' },
    { id: 'Delivery Van Fleet', timeLeft: '48:57', status: 'WATCHING', statusBg: '#2A2E3B', statusColor: '#8E94AC' },
  ];
  const related = [
    { title: 'Honda City 2020', ev: '₹5,80,000', timeNote: 'Closes in 18m', badge: 'OPEN', badgeBg: '#C0392B' },
    { title: 'Ford Endeavour 2019', ev: '₹9,40,000', timeNote: 'Closes in 21m', badge: 'OPEN', badgeBg: '#C0392B' },
    { title: 'Mercedes C200 2021', ev: '₹11,60,000', timeNote: 'Opens in 2h 15m', badge: 'UPCOMING', badgeBg: '#5B6178' },
    { title: 'Toyota Fortuner 2018', ev: '₹9,05,000', timeNote: 'Opens in 3h 40m', badge: 'UPCOMING', badgeBg: '#5B6178' },
    { title: 'Hyundai Creta 2020', ev: '₹6,45,000', timeNote: 'Opens in 5h 10m', badge: 'UPCOMING', badgeBg: '#5B6178' },
  ];
  const mm = fmt.maskSeller && !myBid ? { name: 'Identity locked', initials: '••', masked: true } : { name: LOT.mmName, initials: LOT.mmInitials, masked: false };

  const placeBid = () => { if (!valid) return; setMyBid(bidNum); setBidInput(''); };

  const ctaLabel = overCeiling ? (fmt.noun === 'offer' ? 'Offer exceeds 150% ceiling' : 'Bid exceeds 150% ceiling') : (valid ? (myBid ? fmt.revise : fmt.cta) + ' · ' + fmtMoney(bidNum) : fmt.cta);
  const hintText = overCeiling
    ? `⚠ Blocked: no ${fmt.noun} may exceed 150% of the current high bid (max ${fmtMoney(ceiling)}). This guards against typing errors and price-jacking.`
    : (myBid ? `Your ${fmt.noun} is with the ${fmt.arbiter}.` + (fmt.sealedOnce ? ' It is fixed and cannot be revised.' : ' You may revise it until the session closes.')
      : (fmt.key === 'TENDER' ? 'Offers are sealed — no other invited trader sees what you place.' : (fmt.noun === 'offer' ? 'Offers are confidential — no other trader sees what you place.' : 'Bids are confidential — no other trader sees what you place.')));

  return (
    <div className="br-page">
      <AppHeader variant="dark" contextLabel="Bidding Room" />

      <main className="br-main">
        <div className="br-crumbrow">
          <div className="br-crumb">Auctions › {fmt.label} › <span>{LOT.title}</span></div>
          <div className="br-badges"><span className="br-badge">CONFIDENTIAL BIDDING</span><span className="br-badge br-badge--dark">{fmt.badge}</span></div>
        </div>

        <div className="br-grid">
          <div className="br-col">
            <div className="br-gallery">
              <div className="br-gallery__main">
                {fmt.isTimed && <span className="br-gallery__live"><span className="br-dot" style={{ background: '#fff' }} />SESSION OPEN</span>}
                <span className="br-gallery__count">01 / 12</span>
              </div>
              <div className="br-thumbrow">{[0,1,2,3,4,5].map((i) => <div key={i} className="br-thumb" style={{ outlineColor: i === 0 ? '#171A26' : 'transparent' }} />)}</div>
            </div>

            <div className="br-two">
              <div className="br-panel">
                <h3>ASSET DETAILS</h3>
                {LOT.assetDetails.map((d) => <div key={d.k} className="br-kv"><div>{d.k}</div><div>{d.v}</div></div>)}
              </div>
              {fmt.hasInspection ? (
                <div className="br-panel">
                  <h3>INSPECTION</h3>
                  {[{ k: 'Window', v: '01 Jul – 05 Jul 2025, 10:00 AM – 5:00 PM' }, { k: 'Location', v: 'AutoCorp Yard, Navi Mumbai, Maharashtra' }, { k: 'Contact', v: 'Rohit Sharma · +91 98765 43210' }].map((i) => (
                    <div key={i.k} className="br-kv"><div>{i.k}</div><div>{i.v}</div></div>
                  ))}
                  <div className="br-inspected">✓ You inspected this asset on {LOT.inspectedOn}</div>
                </div>
              ) : (
                <div className="br-panel">
                  <h3>NO INSPECTION</h3>
                  <p className="br-panel__note">{fmt.noInspectionNote}</p>
                  <div className="br-warn-box">Bid on the strength of the photos, videos and documents provided.</div>
                </div>
              )}
            </div>

            <div className="br-panel">
              <div className="br-tabs">
                {['photos','videos','documents'].map((k) => (
                  <button key={k} onClick={() => setMediaTab(k)} className={`br-tab${mediaTab === k ? ' br-tab--active' : ''}`}>{k[0].toUpperCase() + k.slice(1)}</button>
                ))}
              </div>
              {mediaTab === 'photos' && <div className="br-photo-grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className="br-photo" />)}</div>}
              {mediaTab === 'videos' && <div className="br-video-grid">{[0,1].map((i) => <div key={i} className="br-video">▶</div>)}</div>}
              {mediaTab === 'documents' && (
                <div>
                  {['Registration Certificate','Insurance Certificate','Pollution Certificate','Fitness Certificate'].map((d) => (
                    <div key={d} className="br-doc-row"><span>{d}</span><span>PDF ↓</span></div>
                  ))}
                </div>
              )}
            </div>

            <div className="br-panel">
              <div className="br-mm-head"><h3>MARKET MAKER</h3><span className="br-verified">✓ VERIFIED</span></div>
              <div className="br-mm-row">
                <div className="br-mm-avatar">{mm.initials}</div>
                <div><div className="br-mm-name">{mm.name}</div><div className="br-mm-meta">★ {LOT.mmRating} · {LOT.mmReviews} reviews</div></div>
              </div>
              {mm.masked && <div className="br-warn-box" style={{ marginBottom: 16 }}>Seller identity, location and inspection access unlock once you pledge EMD.</div>}
              <div className="br-trust">
                <div className="br-trust__label">COMMERCIAL TRUST INDEX</div>
                <div className="br-trust__row">
                  <div className="br-trust__score"><span>{LOT.trustIndex}</span><span>/100</span></div>
                  <div className="br-trust__notes">✓ Timely settlements<br />✓ Accurate descriptions<br />✓ Low dispute ratio</div>
                </div>
              </div>
            </div>
          </div>

          <div className="br-col">
            <div className="br-bidbox">
              <div className="br-bidbox__head">
                <div className="br-bidbox__headrow"><h1>{LOT.title}</h1><span className="br-star">☆</span></div>
                <div className="br-bidbox__meta">{LOT.id} · {LOT.category}<br />{LOT.location}</div>
              </div>
              <div className="br-bidbox__prices">
                <div className="br-price-row">
                  <div className="br-price-cols">
                    {fmt.hasEV && <div><div className="br-price-label">EXPECTED VALUE</div><div className="br-price-value">{fmtMoney(ev)}</div><div className="br-price-hint">The seller's asking figure — offer above or below</div></div>}
                    {fmt.hasReserve && <div><div className="br-price-label">RESERVE VALUE</div><div className="br-price-value">{fmtMoney(rv)}</div><div className="br-price-hint">The floor — the Lot will not sell below this</div></div>}
                  </div>
                  {fmt.isTimed ? (
                    <div className="br-timer">
                      <div className="br-price-label">TIME LEFT</div>
                      <div className="br-timer__clock"><span style={{ background: urgent ? '#C0392B' : '#171A26' }}>{minutes}</span><span style={{ color: urgent ? '#C0392B' : '#171A26' }}>:</span><span style={{ background: urgent ? '#C0392B' : '#171A26' }}>{seconds}</span></div>
                      <div className="br-timer__note">{fmt.timeNote}</div>
                      <div className="br-timer__extend">↻ Extends on late bids</div>
                    </div>
                  ) : (
                    <div className="br-timer">
                      <div className="br-price-label">AVAILABILITY</div>
                      <div className="br-timer__open">Open until sold</div>
                      <div className="br-timer__note">Offer any time</div>
                    </div>
                  )}
                </div>

                {fmt.showH1 && (
                  <div className="br-h1-box" style={{ background: h1.bg, borderColor: h1.border }}>
                    <span style={{ color: h1.color }}>{h1.label}</span><span>{h1.note}</span>
                  </div>
                )}
                <div className="br-strength" style={{ background: strength.bg, borderColor: strength.border }}>
                  <span>{strength.icon}</span>
                  <div><div style={{ color: strength.color }}>{strength.title}</div><div>{strength.note}</div></div>
                </div>
              </div>

              <div className="br-bid-input-area">
                <div className="br-bid-input-head">
                  <span>{fmt.inputLabel}</span>
                  {!!myBid && <span>Your last: <strong>{fmtMoney(myBid)}</strong></span>}
                </div>
                <div className="br-guide-chips">
                  {guideVals.map((v, i) => (
                    <button key={i} onClick={() => setBidInput(String(Math.round(v)))} className="br-guide-chip" style={{ borderColor: String(Math.round(v)) === bidInput ? '#C9974C' : '#E1E4ED', background: String(Math.round(v)) === bidInput ? '#FBF6EC' : '#fff', color: String(Math.round(v)) === bidInput ? '#9C7430' : '#5B6178' }}>{guideLabels[i]}</button>
                  ))}
                </div>
                <input className="br-bid-input" placeholder={`Enter your ${fmt.noun} amount`} value={bidInput} onChange={(e) => setBidInput(e.target.value)} style={{ borderColor: bidInput ? '#C9974C' : '#E1E4ED' }} />
                <button className="br-cta" onClick={placeBid} style={{ background: valid ? '#C9974C' : '#EAECF2', color: valid ? '#fff' : '#9096AC', cursor: valid ? 'pointer' : 'not-allowed' }}>{ctaLabel}</button>
                <div className="br-hint">{hintText}</div>
              </div>

              <div className="br-emd-row">
                <span>🔒 {fmt.key === 'TENDER' ? 'EMD' : 'EMD pledged'} <strong>{fmt.key === 'TENDER' ? 'set by invitation' : fmtMoney(Math.round((fmt.key === 'BUYNOW' ? ev : rv) * 0.1))}</strong></span>
                <span>{fmt.emdNote}</span>
              </div>
            </div>

            <div className="br-winner-box">
              <div className="br-winner-box__label">HOW THE WINNER IS CHOSEN</div>
              <p>{fmt.winnerNote}</p>
              <div className="br-rating-row"><span>{fmt.ratingRowLabel}</span><span style={{ color: fmt.ratingMatters ? '#fff' : '#8E94AC' }}>★ 4.4 <span>· Established Trader</span></span></div>
            </div>

            <div className="br-panel">
              <h3>QUICK ACTIONS</h3>
              <div className="br-quick-grid">
                <button>↓ Lot Brochure</button><button>☆ Watchlist</button><button>↗ Share</button><button style={{ color: '#A93F2A' }}>⚠ Report Issue</button>
              </div>
            </div>
          </div>
        </div>

        <div className="br-related">
          <div className="br-related__head"><h3>RELATED AUCTIONS</h3><Link to="/marketplace">View all →</Link></div>
          <div className="br-related__grid">
            {related.map((r) => (
              <Link key={r.title} to="/lot-detail" className="br-related__card">
                <div className="br-related__photo"><span style={{ background: r.badgeBg }}>{r.badge}</span></div>
                <div className="br-related__body">
                  <div className="br-related__title">{r.title}</div>
                  <div className="br-related__price">RV <strong>{r.ev}</strong></div>
                  <div className="br-related__time">{r.timeNote}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
