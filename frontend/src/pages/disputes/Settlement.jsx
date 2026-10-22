import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import { settlements, listings } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { useApiQuery } from '../../api/hooks.js';
import './Settlement.css';

// Fee invoices a buyer/seller sees (InvoiceService::USER_FACING_INVOICE_TYPES);
// 'saas_to_tenant' is platform-internal and must not be summed in.
const USER_FACING_INVOICE_TYPES = ['tenant_to_buyer', 'platform_to_buyer', 'platform_to_seller'];

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
const money = (v) => (v == null || v === '' ? '—' : `₹${Number(v).toLocaleString('en-IN')}`);

// The backend takes a binary rating: 'good', or 'problem' with a reason.
// Three stars or more is good; fewer reports a problem.
const ratingPayload = (stars, comment) => (stars >= 3 ? { outcome: 'good', reason: comment || undefined } : { outcome: 'problem', reason: comment });

export default function Settlement() {
  const [params] = useSearchParams();
  const settlementId = params.get('id');

  // GET /settlements/:id → { settlement, saleEvent, callerId, invoices, dispute, auditEvents, chronicle }
  const { data, loading, error: loadError, reload } = useApiQuery(async () => {
    const res = unwrap(await settlements.show(settlementId));
    let listing = null;
    if (res.saleEvent && res.saleEvent.listing_id) {
      try { listing = unwrap(await listings.show(res.saleEvent.listing_id)).listing || null; } catch (e) { /* title is optional */ }
    }
    return { ...res, listing };
  }, [settlementId], { skip: !settlementId });
  const st = (data && data.settlement) || {};
  const se = (data && data.saleEvent) || {};
  const feeInvoices = ((data && data.invoices) || []).filter((inv) => USER_FACING_INVOICE_TYPES.includes(inv.invoice_type));
  const LOT = {
    id: se.ern || settlementId || '',
    title: (data && data.listing && data.listing.title) || (se.ern ? `Trading Session ${se.ern}` : 'Settlement'),
    format: (se.sale_format || '').replace(/_/g, ' ').toUpperCase(),
    closedAt: (st.created_at || '').slice(0, 10),
    saleValue: money(st.final_price),
    feePayer: se.fee_payer ? se.fee_payer.replace(/_/g, '-') : '—',
    successFee: feeInvoices.length ? money(feeInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)) : '—',
    tds: money(st.tds_amount),
    tdsRate: st.tds_rate_percent != null ? `${Number(st.tds_rate_percent)}%` : '',
  };

  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  // Only the settlement's own buyer or seller can act on it.
  const role = data ? (data.callerId === st.seller_party_id ? 'seller' : data.callerId === st.buyer_party_id ? 'buyer' : null) : null;
  const [buyerRatingStars, setBuyerRatingStars] = useState(0);
  const [buyerRatingComment, setBuyerRatingComment] = useState('');
  const [sellerRatingStars, setSellerRatingStars] = useState(0);
  const [sellerRatingComment, setSellerRatingComment] = useState('');

  const sellerNocDone = !!st.seller_noc_confirmed_at;
  const buyerNocDone = !!st.buyer_noc_confirmed_at;
  const buyerRatingDone = !!st.buyer_rated_seller_at;
  const sellerRatingDone = !!st.seller_rated_buyer_at;

  // POST the step, then reload the settlement from the backend.
  const act = async (call) => {
    if (busy) return;
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
      done: sellerNocDone, doneAt: sellerNocDone ? stamp(st.seller_noc_confirmed_at) : '',
      showNocAction: role === 'seller' && !sellerNocDone, nocCta: 'Confirm Funds Received',
      onConfirmNoc: () => act(() => settlements.confirmSellerNoc(settlementId, {})),
      waitingNote: role === 'buyer' && !sellerNocDone ? 'Waiting on the Market Maker.' : '',
    },
    {
      key: 'buyerNoc', title: 'Trader NOC — goods received', desc: 'The Trader confirms the goods were received (or self-collected) as described.',
      done: buyerNocDone, doneAt: buyerNocDone ? stamp(st.buyer_noc_confirmed_at) : '',
      showNocAction: role === 'buyer' && !buyerNocDone, nocCta: 'Confirm Goods Received',
      onConfirmNoc: () => act(() => settlements.confirmBuyerNoc(settlementId, {})),
      waitingNote: role === 'seller' && !buyerNocDone ? 'Waiting on the Trader.' : '',
    },
    {
      key: 'buyerRating', title: 'Trader rates Market Maker', desc: 'Mandatory — required before settlement can finalize.',
      done: buyerRatingDone, doneAt: buyerRatingDone ? stamp(st.buyer_rated_seller_at) : '',
      showRatingInput: role === 'buyer' && !buyerRatingDone,
      stars: buyerRatingStars, onPickStar: setBuyerRatingStars, comment: buyerRatingComment, onCommentChange: (e) => setBuyerRatingComment(e.target.value),
      submitDisabled: !buyerRatingStars || busy || (buyerRatingStars < 3 && !buyerRatingComment.trim()),
      onSubmitRating: () => { if (!buyerRatingStars) return; act(() => settlements.rateAsBuyer(settlementId, ratingPayload(buyerRatingStars, buyerRatingComment.trim()))); },
      waitingNote: role === 'seller' && !buyerRatingDone ? "Waiting on the Trader's rating." : '',
    },
    {
      key: 'sellerRating', title: 'Market Maker rates Trader', desc: 'Mandatory — required before settlement can finalize.',
      done: sellerRatingDone, doneAt: sellerRatingDone ? stamp(st.seller_rated_buyer_at) : '',
      showRatingInput: role === 'seller' && !sellerRatingDone,
      stars: sellerRatingStars, onPickStar: setSellerRatingStars, comment: sellerRatingComment, onCommentChange: (e) => setSellerRatingComment(e.target.value),
      submitDisabled: !sellerRatingStars || busy || (sellerRatingStars < 3 && !sellerRatingComment.trim()),
      onSubmitRating: () => { if (!sellerRatingStars) return; act(() => settlements.rateAsSeller(settlementId, ratingPayload(sellerRatingStars, sellerRatingComment.trim()))); },
      waitingNote: role === 'buyer' && !sellerRatingDone ? "Waiting on the Market Maker's rating." : '',
    },
  ];
  const stallWarning = st.status === 'stalled' ? `flagged ${stamp(st.stall_flagged_at)}` : '';

  if (!settlementId || loadError || loading || !data) {
    const msg = !settlementId
      ? 'No settlement selected. Open a settlement from My Purchases or My Sales.'
      : loadError ? (loadError.message || 'Could not load this settlement.') : 'Loading settlement…';
    return (
      <div className="stl-page">
        <LightDashboardHeader ctas={[{ label: 'My Purchases', to: '/buyer/dashboard' }, { label: 'My Sales', to: '/seller/dashboard' }]} />
        <main className="stl-main">
          <p className="stl-sub" style={loadError ? { color: 'var(--color-danger)' } : undefined}>{msg}</p>
          {loadError && <button onClick={reload} className="stl-noc-btn">Retry</button>}
        </main>
      </div>
    );
  }

  return (
    <div className="stl-page">
      <LightDashboardHeader ctas={[{ label: role === 'seller' ? 'My Sales' : 'My Purchases', to: role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard' }, { label: 'Chronicle', to: data.chronicle ? `/ax-chronicle?id=${data.chronicle.id}` : '/ax-chronicle' }]} />
      <main className="stl-main">
        <div className="legal-eyebrow">Settlement · {LOT.id}</div>
        <div className="stl-title-row">
          <h1 className="stl-title">{LOT.title}</h1>
          <span className="stl-banner" style={{ background: allComplete ? 'var(--color-success-bg)' : '#FBF6EC', color: allComplete ? 'var(--color-success)' : '#9C7430' }}>
            {allComplete ? 'Complete' : `${doneCount} of 4 steps done`}
          </span>
        </div>
        <p className="stl-sub">{[LOT.format, LOT.closedAt && `Sold ${LOT.closedAt}`].filter(Boolean).join(' · ')}</p>

        <div className="stl-stats-card">
          <div className="stl-stats-grid">
            <div><div className="stl-stat-label">SALE VALUE</div><div className="stl-stat-value-lg">{LOT.saleValue}</div></div>
            <div><div className="stl-stat-label">FEE PAYER</div><div className="stl-stat-value">{LOT.feePayer}</div></div>
            <div><div className="stl-stat-label">SUCCESS FEE</div><div className="stl-stat-value">{LOT.successFee}</div></div>
            <div><div className="stl-stat-label">{LOT.tdsRate ? `TDS (${LOT.tdsRate})` : 'TDS'}</div><div className="stl-stat-value">{LOT.tds}</div></div>
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
            <p className="stl-complete__body">All four settlement steps are in. This transaction is now closed and reflected in the Trading Session Chronicle.</p>
            <Link to={data.chronicle ? `/ax-chronicle?id=${data.chronicle.id}` : '/ax-chronicle'} className="stl-complete__cta">View Chronicle →</Link>
          </div>
        )}

        <div className="stl-links">
          {feeInvoices.map((inv) => <span key={inv.id} className="stl-link">Invoice {inv.invoice_number}</span>)}
          {data.dispute
            ? <Link to={`/dispute-center?id=${data.dispute.id}`} className="stl-link stl-link--danger">View Dispute →</Link>
            : <Link to={`/dispute-center?saleEvent=${st.sale_event_id}`} className="stl-link stl-link--danger">File a Dispute →</Link>}
        </div>
      </main>
    </div>
  );
}
