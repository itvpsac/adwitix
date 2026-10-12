import { useState } from 'react';
import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import './Settlement.css';

const LOT = { id: 'LOT-49012 · TSN-2026-3381', title: 'Industrial Compressor Unit', tsx: 'Ironclad Metals TSX', format: 'EASY AUCTION',
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

export default function Settlement() {
  const [role, setRole] = useState('buyer');
  const [sellerNocDone, setSellerNocDone] = useState(true);
  const [sellerNocAt] = useState('2026-08-01 10:12');
  const [buyerNocDone, setBuyerNocDone] = useState(false);
  const [buyerRatingDone, setBuyerRatingDone] = useState(false);
  const [buyerRatingStars, setBuyerRatingStars] = useState(0);
  const [buyerRatingComment, setBuyerRatingComment] = useState('');
  const [sellerRatingDone, setSellerRatingDone] = useState(false);
  const [sellerRatingStars, setSellerRatingStars] = useState(0);
  const [sellerRatingComment, setSellerRatingComment] = useState('');

  const doneCount = [sellerNocDone, buyerNocDone, buyerRatingDone, sellerRatingDone].filter(Boolean).length;
  const allComplete = doneCount === 4;

  const steps = [
    {
      key: 'sellerNoc', title: 'Market Maker NOC — funds cleared', desc: 'The Market Maker confirms they received full payment directly from the Trader.',
      done: sellerNocDone, doneAt: sellerNocDone ? sellerNocAt : '',
      showNocAction: role === 'seller' && !sellerNocDone, nocCta: 'Confirm Funds Received',
      onConfirmNoc: () => { setSellerNocDone(true); logAudit({ actor: 'Market Maker', action: 'Filed Seller NOC', target: LOT.id, reason: '' }); },
      waitingNote: role === 'buyer' && !sellerNocDone ? 'Waiting on the Market Maker.' : '',
    },
    {
      key: 'buyerNoc', title: 'Trader NOC — goods received', desc: 'The Trader confirms the goods were received (or self-collected) as described.',
      done: buyerNocDone, doneAt: buyerNocDone ? nowStamp() : '',
      showNocAction: role === 'buyer' && !buyerNocDone, nocCta: 'Confirm Goods Received',
      onConfirmNoc: () => { setBuyerNocDone(true); logAudit({ actor: 'Trader', action: 'Filed Buyer NOC', target: LOT.id, reason: '' }); },
      waitingNote: role === 'seller' && !buyerNocDone ? 'Waiting on the Trader.' : '',
    },
    {
      key: 'buyerRating', title: 'Trader rates Market Maker', desc: 'Mandatory — required before settlement can finalize.',
      done: buyerRatingDone, doneAt: buyerRatingDone ? nowStamp() + (buyerRatingStars ? ' · ' + buyerRatingStars + '★' : '') : '',
      showRatingInput: role === 'buyer' && !buyerRatingDone,
      stars: buyerRatingStars, onPickStar: setBuyerRatingStars, comment: buyerRatingComment, onCommentChange: (e) => setBuyerRatingComment(e.target.value),
      submitDisabled: !buyerRatingStars,
      onSubmitRating: () => { if (!buyerRatingStars) return; setBuyerRatingDone(true); logAudit({ actor: 'Trader', action: `Rated Market Maker ${buyerRatingStars}★`, target: LOT.id, reason: buyerRatingComment }); },
      waitingNote: role === 'seller' && !buyerRatingDone ? "Waiting on the Trader's rating." : '',
    },
    {
      key: 'sellerRating', title: 'Market Maker rates Trader', desc: 'Mandatory — required before settlement can finalize.',
      done: sellerRatingDone, doneAt: sellerRatingDone ? nowStamp() + (sellerRatingStars ? ' · ' + sellerRatingStars + '★' : '') : '',
      showRatingInput: role === 'seller' && !sellerRatingDone,
      stars: sellerRatingStars, onPickStar: setSellerRatingStars, comment: sellerRatingComment, onCommentChange: (e) => setSellerRatingComment(e.target.value),
      submitDisabled: !sellerRatingStars,
      onSubmitRating: () => { if (!sellerRatingStars) return; setSellerRatingDone(true); logAudit({ actor: 'Market Maker', action: `Rated Trader ${sellerRatingStars}★`, target: LOT.id, reason: sellerRatingComment }); },
      waitingNote: role === 'buyer' && !sellerRatingDone ? "Waiting on the Market Maker's rating." : '',
    },
  ];
  const stallWarning = !buyerNocDone && !allComplete ? 'Trader NOC pending 26 hours' : '';

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
        <p className="stl-sub">{LOT.tsx} · {LOT.format} · Sold {LOT.closedAt}</p>

        <div className="stl-role-toggle">
          <button onClick={() => setRole('buyer')} className={`stl-role-btn${role === 'buyer' ? ' stl-role-btn--active' : ''}`}>Viewing as Trader (Buyer)</button>
          <button onClick={() => setRole('seller')} className={`stl-role-btn${role === 'seller' ? ' stl-role-btn--active' : ''}`}>Viewing as Market Maker (Seller)</button>
        </div>

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
            <p className="stl-complete__body">All four settlement steps are in. {LOT.emdBalance} of held EMD has been released to the Trader. This transaction is now closed and reflected in the Trading Session Chronicle.</p>
            <Link to="#" className="stl-complete__cta">View Chronicle →</Link>
          </div>
        )}

        <div className="stl-links">
          {LOT.format !== 'TENDER AUCTION' && <Link to="/invoices" className="stl-link">View Invoice →</Link>}
          <Link to="/dispute-center" className="stl-link stl-link--danger">File a Dispute →</Link>
        </div>
      </main>
    </div>
  );
}
