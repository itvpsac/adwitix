import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import { settlements, listings } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { useApiQuery } from '../../api/hooks.js';
import './Settlement.css';

const DEMO_LOT = { id: 'LOT-49012 · TSN-2026-3381', title: 'Industrial Compressor Unit', tsx: 'Ironclad Metals TSX', format: 'EASY AUCTION',
  closedAt: '2026-07-31', saleValue: '₹4,52,000', feePayer: 'Buyer-Pays', successFee: '₹5,424', tds: '₹45,200', emdBalance: '₹40,776' };

function nowStamp() { return new Date().toISOString().slice(0, 16).replace('T', ' '); }
function logAudit(entry) {
  try {
    const key = 'adwitix_audit_ledger';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({ at: nowStamp(), ...entry });
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (e) { /* noop */ }
}
function Stars({ current, onPick }) {
  return (
    <div className="stl-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} onClick={() => onPick(i)} className="stl-star" style={{ color: i <= current ? 'var(--color-accent)' : 'var(--color-border)' }}>★</span>
      ))}
    </div>
  );
}

const stamp = (v) => (v || '').slice(0, 16).replace('T', ' ');
const money = (v) => (v == null ? '—' : `₹${Number(v).toLocaleString('en-IN')}`);

// The backend takes a binary rating: 'good', or 'problem' with a reason.
// Three stars or more is good; fewer reports a problem.
const ratingPayload = (stars, comment) => (stars >= 3 ? { outcome: 'good', reason: comment || undefined } : { outcome: 'problem', reason: comment });

export default function Settlement() {
  const [params] = useSearchParams();
  const settlementId = params.get('id');
  const live = !!settlementId;

  // GET /settlements/:id → { settlement, saleEvent, callerId, invoices, dispute, chronicle }
  const { data, error: loadError, reload } = useApiQuery(async () => {
    const res = unwrap(await settlements.show(settlementId));
    let listing = null;
    if (res.saleEvent && res.saleEvent.listing_id) {
      try { listing = unwrap(await listings.show(res.saleEvent.listing_id)).listing || null; } catch (e) { /* title is optional */ }
    }
    return { ...res, listing };
  }, [settlementId], { skip: !live });
  const st = (data && data.settlement) || {};
  const se = (data && data.saleEvent) || {};
  const LOT = live ? {
    id: se.ern || settlementId,
    title: (data && data.listing && data.listing.title) || `Trading Session ${se.ern || ''}`.trim(),
    tsx: '',
    format: (se.sale_format || '').replace(/_/g, ' ').toUpperCase(),
    closedAt: (st.created_at || '').slice(0, 10),
    saleValue: money(st.final_price),
    feePayer: se.fee_payer ? se.fee_payer.replace(/_/g, '-') : '—',
    successFee: money(((data && data.invoices) || []).reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || null),
    tds: money(st.tds_amount),
    emdBalance: '',
  } : DEMO_LOT;

  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoRole, setRole] = useState('buyer');
  const role = live && data ? (data.callerId === st.seller_party_id ? 'seller' : 'buyer') : demoRole;
  const [demoSellerNocDone, setSellerNocDone] = useState(true);
  const sellerNocAt = live ? stamp(st.seller_noc_confirmed_at) : '2026-08-01 10:12';
  const [demoBuyerNocDone, setBuyerNocDone] = useState(false);
  const [demoBuyerRatingDone, setBuyerRatingDone] = useState(false);
  const [buyerRatingStars, setBuyerRatingStars] = useState(0);
  const [buyerRatingComment, setBuyerRatingComment] = useState('');
  const [demoSellerRatingDone, setSellerRatingDone] = useState(false);
  const [sellerRatingStars, setSellerRatingStars] = useState(0);
  const [sellerRatingComment, setSellerRatingComment] = useState('');

  const sellerNocDone = live ? !!st.seller_noc_confirmed_at : demoSellerNocDone;
  const buyerNocDone = live ? !!st.buyer_noc_confirmed_at : demoBuyerNocDone;
  const buyerRatingDone = live ? !!st.buyer_rated_seller_at : demoBuyerRatingDone;
  const sellerRatingDone = live ? !!st.seller_rated_buyer_at : demoSellerRatingDone;

  // Live: POST the step, then reload the settlement. Demo: flip local state.
  const act = async (call, demo) => {
    if (!live) { demo(); return; }
    setBusy(true);
    setActionError('');
    try {
      await call();
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not record this step.');
    } finally {
      setBusy(false);
    }
  };

  const doneCount = [sellerNocDone, buyerNocDone, buyerRatingDone, sellerRatingDone].filter(Boolean).length;
  const allComplete = doneCount === 4;

  const steps = [
    {
      key: 'sellerNoc', title: 'Market Maker NOC — funds cleared', desc: 'The Market Maker confirms they received full payment directly from the Trader.',
      done: sellerNocDone, doneAt: sellerNocDone ? sellerNocAt : '',
      showNocAction: role === 'seller' && !sellerNocDone, nocCta: 'Confirm Funds Received',
      onConfirmNoc: () => act(() => settlements.confirmSellerNoc(settlementId, {}), () => { setSellerNocDone(true); logAudit({ actor: 'Market Maker', action: 'Filed Seller NOC', target: LOT.id, reason: '' }); }),
      waitingNote: role === 'buyer' && !sellerNocDone ? 'Waiting on the Market Maker.' : '',
    },
    {
      key: 'buyerNoc', title: 'Trader NOC — goods received', desc: 'The Trader confirms the goods were received (or self-collected) as described.',
      done: buyerNocDone, doneAt: buyerNocDone ? (live ? stamp(st.buyer_noc_confirmed_at) : nowStamp()) : '',
      showNocAction: role === 'buyer' && !buyerNocDone, nocCta: 'Confirm Goods Received',
      onConfirmNoc: () => act(() => settlements.confirmBuyerNoc(settlementId, {}), () => { setBuyerNocDone(true); logAudit({ actor: 'Trader', action: 'Filed Buyer NOC', target: LOT.id, reason: '' }); }),
      waitingNote: role === 'seller' && !buyerNocDone ? 'Waiting on the Trader.' : '',
    },
    {
      key: 'buyerRating', title: 'Trader rates Market Maker', desc: 'Mandatory — required before settlement can finalize.',
      done: buyerRatingDone, doneAt: buyerRatingDone ? (live ? stamp(st.buyer_rated_seller_at) : nowStamp()) + (buyerRatingStars ? ' · ' + buyerRatingStars + '★' : '') : '',
      showRatingInput: role === 'buyer' && !buyerRatingDone,
      stars: buyerRatingStars, onPickStar: setBuyerRatingStars, comment: buyerRatingComment, onCommentChange: (e) => setBuyerRatingComment(e.target.value),
      submitDisabled: !buyerRatingStars || busy || (buyerRatingStars < 3 && !buyerRatingComment.trim()),
      onSubmitRating: () => { if (!buyerRatingStars) return; act(() => settlements.rateAsBuyer(settlementId, ratingPayload(buyerRatingStars, buyerRatingComment.trim())), () => { setBuyerRatingDone(true); logAudit({ actor: 'Trader', action: `Rated Market Maker ${buyerRatingStars}★`, target: LOT.id, reason: buyerRatingComment }); }); },
      waitingNote: role === 'seller' && !buyerRatingDone ? "Waiting on the Trader's rating." : '',
    },
    {
      key: 'sellerRating', title: 'Market Maker rates Trader', desc: 'Mandatory — required before settlement can finalize.',
      done: sellerRatingDone, doneAt: sellerRatingDone ? (live ? stamp(st.seller_rated_buyer_at) : nowStamp()) + (sellerRatingStars ? ' · ' + sellerRatingStars + '★' : '') : '',
      showRatingInput: role === 'seller' && !sellerRatingDone,
      stars: sellerRatingStars, onPickStar: setSellerRatingStars, comment: sellerRatingComment, onCommentChange: (e) => setSellerRatingComment(e.target.value),
      submitDisabled: !sellerRatingStars || busy || (sellerRatingStars < 3 && !sellerRatingComment.trim()),
      onSubmitRating: () => { if (!sellerRatingStars) return; act(() => settlements.rateAsSeller(settlementId, ratingPayload(sellerRatingStars, sellerRatingComment.trim())), () => { setSellerRatingDone(true); logAudit({ actor: 'Market Maker', action: `Rated Trader ${sellerRatingStars}★`, target: LOT.id, reason: sellerRatingComment }); }); },
      waitingNote: role === 'buyer' && !sellerRatingDone ? "Waiting on the Market Maker's rating." : '',
    },
  ];
  const stallWarning = live
    ? (st.status === 'stalled' ? `flagged ${stamp(st.stall_flagged_at)}` : '')
    : (!buyerNocDone && !allComplete ? 'Trader NOC pending 26 hours' : '');

  if (live && loadError) {
    return (
      <div className="stl-page">
        <LightDashboardHeader ctas={[{ label: 'My Purchases', to: '/buyer/dashboard' }]} />
        <main className="stl-main"><p className="stl-sub">{loadError.message || 'Settlement not found.'}</p></main>
      </div>
    );
  }

  return (
    <div className="stl-page">
      <LightDashboardHeader ctas={[{ label: role === 'buyer' ? 'My Purchases' : 'My Sales', to: role === 'buyer' ? '/buyer/dashboard' : '/seller/dashboard' }, { label: 'Chronicle', to: '#' }]} />
      <main className="stl-main">
        <div className="legal-eyebrow">Settlement · {LOT.id}</div>
        <div className="stl-title-row">
          <h1 className="stl-title">{LOT.title}</h1>
          <span className="stl-banner" style={{ background: allComplete ? 'var(--color-success-bg)' : '#FBF6EC', color: allComplete ? 'var(--color-success)' : '#9C7430' }}>
            {allComplete ? 'Complete' : `${doneCount} of 4 steps done`}
          </span>
        </div>
        <p className="stl-sub">{[LOT.tsx, LOT.format, LOT.closedAt && `Sold ${LOT.closedAt}`].filter(Boolean).join(' · ')}</p>

        {!live && <div className="stl-role-toggle">
          <button onClick={() => setRole('buyer')} className={`stl-role-btn${role === 'buyer' ? ' stl-role-btn--active' : ''}`}>Viewing as Trader (Buyer)</button>
          <button onClick={() => setRole('seller')} className={`stl-role-btn${role === 'seller' ? ' stl-role-btn--active' : ''}`}>Viewing as Market Maker (Seller)</button>
        </div>}

        <div className="stl-stats-card">
          <div className="stl-stats-grid">
            <div><div className="stl-stat-label">SALE VALUE</div><div className="stl-stat-value-lg">{LOT.saleValue}</div></div>
            <div><div className="stl-stat-label">FEE PAYER</div><div className="stl-stat-value">{LOT.feePayer}</div></div>
            <div><div className="stl-stat-label">SUCCESS FEE</div><div className="stl-stat-value">{LOT.successFee}</div></div>
            <div><div className="stl-stat-label">TDS (10%)</div><div className="stl-stat-value">{LOT.tds}</div></div>
          </div>
        </div>

        {stallWarning && (
          <div className="stl-warning"><strong>Stalled — {stallWarning}</strong> A time-bound warning has been sent. If unresolved, the relevant admin will force-log the outstanding step per BR-39.</div>
        )}

        {actionError && <div className="stl-warning">{actionError}</div>}
        <div className="stl-steps">
          {steps.map((st, i) => (
            <div key={st.key} className="stl-step" style={{ borderColor: st.done ? '#CBE0D1' : 'var(--color-border)' }}>
              <div className="stl-step__row">
                <div className="stl-step__icon" style={{ background: st.done ? 'var(--color-success)' : '#E9EBF2', color: st.done ? '#fff' : '#9096AC' }}>{st.done ? '✓' : i + 1}</div>
                <div className="stl-step__body">
                  <div className="stl-step__head">
                    <div className="stl-step__title">{st.title}</div>
                    {st.doneAt && <span className="stl-step__time">{st.doneAt}</span>}
                  </div>
                  <div className="stl-step__desc">{st.desc}</div>

                  {st.showRatingInput && (
                    <div className="stl-rating-input">
                      <Stars current={st.stars} onPick={st.onPickStar} />
                      <textarea placeholder="Optional comment…" value={st.comment} onChange={st.onCommentChange} rows={2} className="stl-comment" />
                      <button onClick={st.onSubmitRating} disabled={st.submitDisabled} className="stl-submit-btn" style={{ background: st.submitDisabled ? '#E9EBF2' : 'var(--color-bg-dark)', color: st.submitDisabled ? 'var(--color-text-faint)' : '#fff' }}>Submit Rating</button>
                    </div>
                  )}
                  {st.showNocAction && <button onClick={st.onConfirmNoc} className="stl-noc-btn">{st.nocCta}</button>}
                  {st.waitingNote && <div className="stl-waiting">{st.waitingNote}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {allComplete && (
          <div className="stl-complete">
            <div className="stl-complete__title">Settlement Complete</div>
            <p className="stl-complete__body">All four settlement steps are in. {LOT.emdBalance ? `${LOT.emdBalance} of held EMD has been released to the Trader.` : 'Held EMD has been released to the Trader.'} This transaction is now closed and reflected in the Trading Session Chronicle.</p>
            <Link to="#" className="stl-complete__cta">View Chronicle →</Link>
          </div>
        )}

        <div className="stl-links">
          {LOT.format !== 'TENDER AUCTION' && <Link to="/invoices" className="stl-link">View Invoice →</Link>}
          {live && data && data.dispute
            ? <Link to={`/dispute-center?id=${data.dispute.id}`} className="stl-link stl-link--danger">View Dispute →</Link>
            : <Link to={live && st.sale_event_id ? `/dispute-center?saleEvent=${st.sale_event_id}` : '/dispute-center'} className="stl-link stl-link--danger">File a Dispute →</Link>}
        </div>
      </main>
    </div>
  );
}
