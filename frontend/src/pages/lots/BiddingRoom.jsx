import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './BiddingRoom.css';
import AppHeader from '../../components/AppHeader.jsx';
import { listings, saleEvents, me as meApi } from '../../api/endpoints.js';
import { unwrap, mediaUrl, getToken } from '../../api/client.js';
import { useApiQuery } from '../../api/hooks.js';
import { readAuth, isCustodian } from '../../utils/auth.js';

const FORMAT_META = {
  EASY: { key: 'EASY', label: 'Easy Auction', badge: 'EASY AUCTION', isTimed: true, hasInspection: true, timeNote: 'Set by the Market Maker', hasReserve: true, hasEV: false, showH1: true, maskSeller: false, noun: 'bid', arbiter: 'Market Maker', sealedOnce: false, emdNote: '10% of Reserve Value · checked on every bid', inputLabel: 'YOUR BID', cta: 'Submit Bid', revise: 'Revise Bid', winnerNote: 'Only the highest valid bid at close (H1) is eligible to win. The Market Maker may close automatically at the top bid, or hold results for manual approval — your Star Rating plays no part in who wins. If H1 defaults, the win passes to H2, then H3.', ratingRowLabel: 'Your rating (reputation only — not a factor here)', ratingMatters: false },
  EXPRESS: { key: 'EXPRESS', label: 'Express Auction', badge: 'EXPRESS AUCTION', isTimed: true, hasInspection: false, timeNote: 'Starts once 3 Traders pledge EMD', hasReserve: true, hasEV: false, showH1: true, maskSeller: false, noun: 'bid', arbiter: 'Market Maker', sealedOnce: true, emdNote: '10% of Reserve Value · checked on every bid', noInspectionNote: 'Express sessions run without a physical inspection window so the asset can move quickly. There is zero inspection window — the most buyer risk of any format.', inputLabel: 'YOUR BID', cta: 'Submit Bid', revise: 'Revise Bid', winnerNote: 'Only the highest valid bid at close (H1) wins, under standard auction rules — no manual review, no rating weighting.', ratingRowLabel: 'Your rating (reputation only — not a factor here)', ratingMatters: false },
  BUYNOW: { key: 'BUYNOW', label: 'Buy Now', badge: 'BUY NOW', isTimed: false, isInstant: true, hasInspection: true, hasReserve: false, hasEV: true, showH1: false, maskSeller: true, noun: 'offer', arbiter: 'Market Maker', sealedOnce: false, emdNote: '10% of Expected Value · checked on every offer', inputLabel: 'YOUR OFFER', cta: 'Submit Offer', revise: 'Revise Offer', winnerNote: 'The Market Maker personally reviews every offer against the stated Expected Value and chooses who to sell to — weighing both price and your Star Rating. The highest offer is not guaranteed to win.', ratingRowLabel: 'Your rating (factored into award)', ratingMatters: true },
  TENDER: { key: 'TENDER', label: 'Tender Auction', badge: 'TENDER · BY INVITATION', isTimed: true, hasInspection: true, timeNote: 'Window set by the Concierge', hasReserve: true, hasEV: false, showH1: true, maskSeller: false, noun: 'offer', arbiter: 'Concierge', sealedOnce: false, emdNote: 'Per the terms of your invitation', inputLabel: 'YOUR TENDER OFFER', cta: 'Submit Offer', revise: 'Revise Offer', winnerNote: 'This is a private, invitation-only tender run by the Company Shop. Offers are sealed — you see only your own. The Concierge evaluates offers against the curated terms of the tender and awards the Lot.', ratingRowLabel: 'Your rating (reputation only)', ratingMatters: false },
};
const FORMAT_KEY = { easy: 'EASY', express: 'EXPRESS', buy_now: 'BUYNOW', tender: 'TENDER' };
const humanize = (v) => (v ? String(v).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');
const fmtMoney = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const parseDate = (d) => (d ? new Date(String(d).replace(' ', 'T')) : null);
const fmtDate = (d) => (d ? parseDate(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const SALE_STATUS = { pending_approval: 'Pending Approval', grace_period: 'Grace Period', active: 'Live', closed_sold: 'Closed — Sold', cancelled: 'Cancelled', cycle_ended_unsold: 'Ended Unsold' };

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
  const listingId = params.get('id');
  const [bidInput, setBidInput] = useState('');
  const [myBid, setMyBid] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [mediaTab, setMediaTab] = useState('photos');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [favorited, setFavorited] = useState(null);

  // GET /listings/:id → { listing, saleEvent, media, myEmdHold, isOwner, isFavorited, relatedListings, sellerStarRating, … }
  const { data, loading, error, reload } = useApiQuery(() => listings.show(listingId), [listingId], { skip: !listingId });
  const live = !!(data && data.listing);
  const se = (data && data.saleEvent) || null;
  const fmtKey = se ? FORMAT_KEY[se.sale_format] : null;
  const me = readAuth();

  // Count down to the live session's scheduled_end_at (no clock without one).
  useEffect(() => {
    const end = se && se.scheduled_end_at ? parseDate(se.scheduled_end_at).getTime() : null;
    if (!end) { setSecondsLeft(null); return undefined; }
    const tick = () => setSecondsLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [se && se.scheduled_end_at]);

  // The viewer's own latest bid / offer on this session (GET /my-bids, /my-offers).
  useEffect(() => {
    setMyBid(null);
    if (!se || !getToken() || !me) return undefined;
    let alive = true;
    const req = se.sale_format === 'buy_now' ? meApi.offers({ per_page: 100 }) : meApi.bids({ per_page: 100 });
    req.then((res) => {
      if (!alive) return;
      const d = unwrap(res);
      const rows = (se.sale_format === 'buy_now' ? d.offers : d.bids) || [];
      const mine = rows.find((r) => r.sale_event_id === se.id && (se.sale_format !== 'buy_now' || ['submitted', 'accepted'].includes(r.status)));
      if (mine) setMyBid(Number(mine.amount));
    }).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [se && se.id]);

  useEffect(() => { if (data) setFavorited(!!data.isFavorited); }, [data]);

  const fmt = FORMAT_META[fmtKey] || FORMAT_META.EASY;
  const ev = Number((se && se.expected_value) || 0);
  const rv = Number((se && se.reserve_value) || 0);
  const currentPrice = Number((se && se.current_price) || 0);
  const bidNum = parseFloat((bidInput || '').replace(/[^0-9.]/g, ''));
  // BR-43: no bid above 150% of the current high bid (or the reserve before any bid).
  const ceilingBase = currentPrice > 0 ? currentPrice : rv;
  const ceiling = fmt.key === 'BUYNOW' || !ceilingBase ? Infinity : ceilingBase * 1.5;
  const overCeiling = bidNum > ceiling;

  const endsAt = se && se.scheduled_end_at ? parseDate(se.scheduled_end_at).getTime() : null;
  const isLive = !!se && se.status === 'active' && !se.actual_closed_at && (!endsAt || endsAt > Date.now());
  // BR-15: the Super Admin may never bid, offer or pledge.
  const blockedReason = isCustodian(me) ? 'Super Admin accounts cannot bid, offer or pledge (BR-15).'
    : (data && data.isOwner) ? 'This is your own lot — you cannot bid on it.'
    : !isLive ? (se && se.status === 'active' ? 'This session has ended.' : `Status: ${se ? (SALE_STATUS[se.status] || humanize(se.status)) : '—'} — ${fmt.noun}s are not open.`)
    : '';
  const valid = bidNum > 0 && !overCeiling && !blockedReason;
  const urgent = secondsLeft != null && secondsLeft < 120;
  const strength = useMemo(() => strengthFor(valid ? bidNum : 0, ev, rv, fmt, bidInput ? 0 : myBid), [valid, bidNum, ev, rv, fmt, bidInput, myBid]);

  const guideVals = fmt.key === 'BUYNOW' ? [ev * 0.95, ev, ev * 1.05] : [rv, rv * 1.05, rv * 1.1];
  const guideLabels = fmt.key === 'BUYNOW' ? ['5% below EV', 'At EV', '5% above EV'] : ['At Reserve', '+5%', '+10%'];
  const minutes = secondsLeft == null ? '--' : String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = secondsLeft == null ? '--' : String(secondsLeft % 60).padStart(2, '0');

  const isH1 = !!me && !!se && se.current_high_bidder_party_id === me.id;
  const h1 = !myBid
    ? { label: 'NO ' + fmt.noun.toUpperCase() + ' PLACED', note: 'Place a' + (fmt.noun === 'offer' ? 'n offer' : ' bid') + ' to see your H1 standing', bg: '#F7F8FB', border: '#E1E4ED', color: '#5B6178' }
    : (isH1
        ? { label: '★ YOU ARE H1', note: 'Highest ' + fmt.noun + ' — amounts of others stay hidden', bg: '#E7F0E9', border: '#CBE0D1', color: '#38724A' }
        : { label: 'YOU ARE NOT H1', note: 'Another ' + fmt.noun + ' is higher — its amount is never shown', bg: '#FBF6EC', border: '#EEE2CB', color: '#9C7430' });

  const emdHeld = !!(data && data.myEmdHold && data.myEmdHold.status === 'held');
  const mm = fmt.maskSeller && !emdHeld ? { name: 'Identity locked', initials: '••', masked: true } : { name: 'Identity not disclosed', initials: 'MM', masked: false };

  const placeBid = async () => {
    if (!valid || submitting || !se) return;
    const call = {
      EASY: () => saleEvents.placeBid(se.id, { amount: bidNum }),
      EXPRESS: () => saleEvents.expressBid(se.id, { amount: bidNum }),
      BUYNOW: () => saleEvents.submitOffer(se.id, { amount: bidNum }),
    }[fmt.key];
    if (!call) { setSubmitError('Tender offers are placed through the Tender Concierge.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      unwrap(await call());
      setMyBid(bidNum);
      setBidInput('');
      reload();
    } catch (err) {
      setSubmitError(err.description || err.message || 'Could not place your ' + fmt.noun + '.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFavorite = async () => {
    setActionMsg('');
    if (!getToken()) { setActionMsg('Log in to add this lot to your watchlist.'); return; }
    try {
      await (favorited ? listings.unfavorite(listingId) : listings.favorite(listingId));
      setFavorited(!favorited);
      setActionMsg(favorited ? 'Removed from your watchlist.' : 'Added to your watchlist.');
    } catch (err) {
      setActionMsg(err.description || err.message || 'Could not update your watchlist.');
    }
  };
  const share = async () => {
    const url = `${window.location.origin}/lot-detail?id=${listingId}`;
    try {
      await navigator.clipboard.writeText(url);
      setActionMsg('Lot link copied to clipboard.');
    } catch (e) {
      setActionMsg(`Copy this link: ${url}`);
    }
  };

  const shell = (text) => (
    <div className="br-page">
      <AppHeader variant="dark" contextLabel="Bidding Room" />
      <main className="br-main"><div className="br-panel"><p className="br-panel__note">{text}</p><Link to="/marketplace">← Back to Marketplace</Link></div></main>
    </div>
  );
  if (!listingId) return shell('No lot selected. Open a lot from the Marketplace to enter its Bidding Room.');
  if (error) return shell(error.status === 404 ? 'This lot was not found. It may have been removed.' : (error.description || error.message || 'Could not load this lot.'));
  if (loading || !live) return shell('Loading lot…');
  if (!se) return shell('This lot has no Trading Session yet — bidding opens once a sale is scheduled and approved.');

  const L = data.listing;
  const LOT = {
    id: se.ern || L.id,
    title: L.title || L.make_model || 'Lot',
    category: [L.category, L.subcategory].filter(Boolean).join(' › '),
    location: [L.city, L.state].filter(Boolean).join(', '),
    mmRating: data.sellerStarRating != null ? Number(data.sellerStarRating).toFixed(1) : '—',
    assetDetails: [
      { k: 'Make / Model', v: L.make_model },
      { k: 'Condition', v: humanize(L.physical_condition) },
      { k: 'Quantity', v: L.quantity ? `${Number(L.quantity)} ${L.quantity_basis || ''}`.trim() : null },
      { k: 'Yard', v: mm.masked ? null : L.yard_location_address },
    ].filter((d) => d.v),
  };
  const media = data.media || [];
  const photos = media.filter((m) => m.media_type === 'photo');
  const videos = media.filter((m) => m.media_type === 'video');
  const documents = media.filter((m) => m.media_type === 'document');
  const hero = photos[0];
  const inspection = [
    { k: 'Window', v: se.inspection_window_start ? `${fmtDate(se.inspection_window_start)}${se.inspection_window_end ? ` – ${fmtDate(se.inspection_window_end)}` : ''}` : 'Not scheduled' },
    { k: 'Location', v: mm.masked ? 'Unlocks once you pledge EMD' : (L.yard_location_address || '—') },
    { k: 'Contact', v: mm.masked ? 'Unlocks once you pledge EMD' : (L.inspector_contact_note || '—') },
  ];
  const related = (data.relatedListings || []).map((r) => {
    const price = Number(r.current_price) > 0 ? r.current_price : r.expected_value;
    return {
      id: r.id, title: [r.category, r.subcategory].filter(Boolean).join(' › ') || 'Lot',
      price: Number(price) > 0 ? fmtMoney(Number(price)) : '—',
      badge: r.status === 'active' ? 'OPEN' : (SALE_STATUS[r.status] || humanize(r.status) || 'NOT SCHEDULED').toUpperCase(),
      badgeBg: r.status === 'active' ? '#C0392B' : '#5B6178', photo: r.photo_path,
    };
  });
  const emdAmount = emdHeld ? Number(data.myEmdHold.amount) : Math.round((fmt.key === 'BUYNOW' ? ev : rv) * 0.1);
  const needsEmd = fmt.key !== 'TENDER' && !emdHeld && !blockedReason;

  const ctaLabel = blockedReason ? (fmt.noun === 'offer' ? 'Offers closed' : 'Bidding closed') : overCeiling ? (fmt.noun === 'offer' ? 'Offer exceeds 150% ceiling' : 'Bid exceeds 150% ceiling') : (submitting ? 'Submitting…' : valid ? (myBid ? fmt.revise : fmt.cta) + ' · ' + fmtMoney(bidNum) : fmt.cta);
  const hintText = blockedReason || (overCeiling
    ? `⚠ Blocked: no ${fmt.noun} may exceed 150% of the current high bid (max ${fmtMoney(ceiling)}). This guards against typing errors and price-jacking.`
    : (myBid ? `Your ${fmt.noun} is with the ${fmt.arbiter}.` + (fmt.sealedOnce ? ' It is fixed and cannot be revised.' : ' You may revise it until the session closes.')
      : (fmt.key === 'TENDER' ? 'Offers are sealed — no other invited trader sees what you place.' : (fmt.noun === 'offer' ? 'Offers are confidential — no other trader sees what you place.' : 'Bids are confidential — no other trader sees what you place.'))));

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
                {hero && <img src={mediaUrl(hero.file_path)} alt={LOT.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                {fmt.isTimed && isLive && <span className="br-gallery__live"><span className="br-dot" style={{ background: '#fff' }} />SESSION OPEN</span>}
                {photos.length > 0 && <span className="br-gallery__count">{photos.length} photo{photos.length === 1 ? '' : 's'}</span>}
              </div>
              {photos.length > 1 && (
                <div className="br-thumbrow">{photos.slice(0, 6).map((m, i) => (
                  <div key={m.id} className="br-thumb" style={{ outlineColor: i === 0 ? '#171A26' : 'transparent', overflow: 'hidden' }}>
                    <img src={mediaUrl(m.file_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}</div>
              )}
            </div>

            <div className="br-two">
              <div className="br-panel">
                <h3>ASSET DETAILS</h3>
                {LOT.assetDetails.map((d) => <div key={d.k} className="br-kv"><div>{d.k}</div><div>{d.v}</div></div>)}
              </div>
              {fmt.hasInspection ? (
                <div className="br-panel">
                  <h3>INSPECTION</h3>
                  {inspection.map((i) => (
                    <div key={i.k} className="br-kv"><div>{i.k}</div><div>{i.v}</div></div>
                  ))}
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
              {mediaTab === 'photos' && (photos.length ? (
                <div className="br-photo-grid">{photos.map((m) => (
                  <a key={m.id} href={mediaUrl(m.file_path)} target="_blank" rel="noreferrer" className="br-photo" style={{ overflow: 'hidden', display: 'block' }}>
                    <img src={mediaUrl(m.file_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </a>
                ))}</div>
              ) : <p className="br-panel__note">No photos uploaded.</p>)}
              {mediaTab === 'videos' && (videos.length ? (
                <div className="br-video-grid">{videos.map((v) => <video key={v.id} src={mediaUrl(v.file_path)} controls className="br-video" style={{ width: '100%' }} />)}</div>
              ) : <p className="br-panel__note">No videos uploaded.</p>)}
              {mediaTab === 'documents' && (documents.length ? (
                <div>
                  {documents.map((d) => (
                    <a key={d.id} href={mediaUrl(d.file_path)} target="_blank" rel="noreferrer" className="br-doc-row" style={{ color: 'inherit' }}><span>{d.original_filename || 'Document'}</span><span>PDF ↓</span></a>
                  ))}
                </div>
              ) : <p className="br-panel__note">No documents uploaded.</p>)}
            </div>

            <div className="br-panel">
              <div className="br-mm-head"><h3>MARKET MAKER</h3></div>
              <div className="br-mm-row">
                <div className="br-mm-avatar">{mm.initials}</div>
                <div><div className="br-mm-name">{mm.name}</div><div className="br-mm-meta">Seller rating ★ {LOT.mmRating}</div></div>
              </div>
              {mm.masked && <div className="br-warn-box" style={{ marginBottom: 16 }}>Seller identity, location and inspection access unlock once you pledge EMD.</div>}
            </div>
          </div>

          <div className="br-col">
            <div className="br-bidbox">
              <div className="br-bidbox__head">
                <div className="br-bidbox__headrow"><h1>{LOT.title}</h1><span className="br-star" role="button" title={favorited ? 'Remove from watchlist' : 'Add to watchlist'} onClick={toggleFavorite}>{favorited ? '★' : '☆'}</span></div>
                <div className="br-bidbox__meta">{LOT.id} · {LOT.category}{LOT.location && <><br />{LOT.location}</>}</div>
              </div>
              <div className="br-bidbox__prices">
                <div className="br-price-row">
                  <div className="br-price-cols">
                    {fmt.hasEV && <div><div className="br-price-label">EXPECTED VALUE</div><div className="br-price-value">{ev > 0 ? fmtMoney(ev) : '—'}</div><div className="br-price-hint">The seller's asking figure — offer above or below</div></div>}
                    {fmt.hasReserve && <div><div className="br-price-label">RESERVE VALUE</div><div className="br-price-value">{rv > 0 ? fmtMoney(rv) : '—'}</div><div className="br-price-hint">The floor — the Lot will not sell below this</div></div>}
                  </div>
                  {fmt.isTimed ? (
                    <div className="br-timer">
                      <div className="br-price-label">TIME LEFT</div>
                      <div className="br-timer__clock"><span style={{ background: urgent ? '#C0392B' : '#171A26' }}>{minutes}</span><span style={{ color: urgent ? '#C0392B' : '#171A26' }}>:</span><span style={{ background: urgent ? '#C0392B' : '#171A26' }}>{seconds}</span></div>
                      <div className="br-timer__note">{endsAt ? `Ends ${fmtDate(se.scheduled_end_at)}` : fmt.timeNote}</div>
                      {fmt.key === 'EASY' && <div className="br-timer__extend">↻ Extends on late bids</div>}
                    </div>
                  ) : (
                    <div className="br-timer">
                      <div className="br-price-label">AVAILABILITY</div>
                      <div className="br-timer__open">{isLive ? 'Open until sold' : (SALE_STATUS[se.status] || humanize(se.status))}</div>
                      <div className="br-timer__note">{isLive ? 'Offer any time' : 'Offers are not open'}</div>
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
                    <button key={i} disabled={!v || !!blockedReason} onClick={() => setBidInput(String(Math.round(v)))} className="br-guide-chip" style={{ borderColor: String(Math.round(v)) === bidInput ? '#C9974C' : '#E1E4ED', background: String(Math.round(v)) === bidInput ? '#FBF6EC' : '#fff', color: String(Math.round(v)) === bidInput ? '#9C7430' : '#5B6178' }}>{guideLabels[i]}</button>
                  ))}
                </div>
                <input className="br-bid-input" placeholder={`Enter your ${fmt.noun} amount`} value={bidInput} disabled={!!blockedReason} onChange={(e) => setBidInput(e.target.value)} style={{ borderColor: bidInput ? '#C9974C' : '#E1E4ED' }} />
                <button className="br-cta" onClick={placeBid} disabled={!valid || submitting} style={{ background: valid ? '#C9974C' : '#EAECF2', color: valid ? '#fff' : '#9096AC', cursor: valid ? 'pointer' : 'not-allowed' }}>{ctaLabel}</button>
                <div className="br-hint" style={blockedReason ? { color: '#A93F2A' } : undefined}>{hintText}</div>
                {needsEmd && <div className="br-hint">EMD not yet pledged — <Link to={`/emd-consent?saleEvent=${se.id}&lot=${listingId}&format=${se.sale_format}`}>pledge your deposit</Link> before you {fmt.noun}.</div>}
                {submitError && <div className="br-hint" style={{ color: '#C0392B' }}>{submitError}</div>}
              </div>

              <div className="br-emd-row">
                <span>🔒 {fmt.key === 'TENDER' ? 'EMD' : (emdHeld ? 'EMD pledged' : 'EMD required')} <strong>{fmt.key === 'TENDER' ? 'set by invitation' : (emdAmount > 0 ? fmtMoney(emdAmount) : '—')}</strong></span>
                <span>{fmt.emdNote}</span>
              </div>
            </div>

            <div className="br-winner-box">
              <div className="br-winner-box__label">HOW THE WINNER IS CHOSEN</div>
              <p>{fmt.winnerNote}</p>
              <div className="br-rating-row"><span>{fmt.ratingRowLabel}</span><span style={{ color: fmt.ratingMatters ? '#fff' : '#8E94AC' }}><Link to="/rating-history" style={{ color: 'inherit' }}>View your rating →</Link></span></div>
            </div>

            <div className="br-panel">
              <h3>QUICK ACTIONS</h3>
              <div className="br-quick-grid">
                <button onClick={toggleFavorite}>{favorited ? '★ Watching' : '☆ Watchlist'}</button><button onClick={share}>↗ Share</button>
                <Link to={`/lot-detail?id=${listingId}`} className="br-quick-link"><button style={{ width: '100%' }}>↩ Lot Detail</button></Link>
                <Link to="/trust-and-support" className="br-quick-link"><button style={{ width: '100%', color: '#A93F2A' }}>⚠ Report Issue</button></Link>
              </div>
              {actionMsg && <p className="br-panel__note" style={{ marginTop: 10 }}>{actionMsg}</p>}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="br-related">
            <div className="br-related__head"><h3>RELATED LOTS</h3><Link to="/marketplace">View all →</Link></div>
            <div className="br-related__grid">
              {related.map((r) => (
                <Link key={r.id} to={`/lot-detail?id=${r.id}`} className="br-related__card">
                  <div className="br-related__photo" style={{ overflow: 'hidden' }}>
                    {r.photo && <img src={mediaUrl(r.photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                    <span style={{ background: r.badgeBg }}>{r.badge}</span>
                  </div>
                  <div className="br-related__body">
                    <div className="br-related__title">{r.title}</div>
                    <div className="br-related__price">Price <strong>{r.price}</strong></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
