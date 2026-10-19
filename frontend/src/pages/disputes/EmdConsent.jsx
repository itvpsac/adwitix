import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import { saleEvents } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import './EmdConsent.css';

const DEMO_LOT = { ern: 'TSN-2026-3381', title: 'Industrial Compressor Unit', formatLabel: 'auction', noun: 'bid' };
const DEMO_AMOUNT = '₹34,200';
const EMD_BASIS = '10% of Reserve Value · checked on every bid';
const consentAction = (format) => (format === 'buy_now' ? 'buy_now' : format === 'express' ? 'express' : 'easy_or_tender');
const FORMAT_COPY = {
  buy_now: { formatLabel: 'offer', noun: 'offer' },
  express: { formatLabel: 'Express auction', noun: 'pledge' },
  tender: { formatLabel: 'tender', noun: 'bid' },
};

export default function EmdConsent() {
  const [agreed, setAgreed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [params] = useSearchParams();
  const saleEventId = params.get('saleEvent');
  const lotId = params.get('lot');
  const action = consentAction(params.get('format'));

  // GET /sale-events/:id/emd-consent/:action → { saleEvent, amount }
  const { data } = useApiQuery(() => saleEvents.emdConsentTerms(saleEventId, action), [saleEventId, action], { skip: !saleEventId });
  const se = data && data.saleEvent;
  const LOT = se ? { ern: se.ern, title: '', formatLabel: 'auction', noun: 'bid', ...FORMAT_COPY[se.sale_format] } : DEMO_LOT;
  const EMD_AMOUNT = data && data.amount != null ? `₹${Number(data.amount).toLocaleString('en-IN')}` : DEMO_AMOUNT;
  const biddingRoom = lotId ? `/bidding-room?id=${lotId}${se ? `&format=${se.sale_format}` : ''}` : '/bidding-room';

  const confirm = async () => {
    if (!agreed || busy) return;
    if (!saleEventId) { setConfirmed(true); return; }
    setBusy(true);
    setError('');
    try {
      await saleEvents.confirmEmdConsent(saleEventId, action, { confirmed: '1' });
      setConfirmed(true);
    } catch (err) {
      setError(err.message || 'Could not pledge the deposit.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="emd-page">
      <LightDashboardHeader homeTo={lotId ? `/lot-detail?id=${lotId}` : '/lot-detail'} />
      <main className="emd-main">
        {!confirmed && (
          <>
            <h1 className="emd-title">Confirm Your Deposit</h1>
            <p className="emd-sub">{[LOT.ern, LOT.title].filter(Boolean).join(' · ')}</p>

            <div className="emd-card">
              <div className="emd-card__label">Earnest Money Deposit (EMD)</div>
              <div className="emd-card__amount">{EMD_AMOUNT}</div>
              <div className="emd-card__basis">{EMD_BASIS}</div>
            </div>

            <div className="emd-terms">
              <p>I understand that pledging <strong>{EMD_AMOUNT}</strong> as Earnest Money Deposit for this {LOT.noun} means: if the {LOT.formatLabel} closes and I fail to complete my obligation, this deposit is <strong>forfeited</strong> — allocated to the TradeSphereX, ADWITIX, and (where applicable) the Market Maker per the platform's standard forfeiture rules.</p>
            </div>

            <label className="emd-checkbox-row">
              <input type="checkbox" checked={agreed} onChange={() => setAgreed(!agreed)} className="emd-checkbox" />
              <span>I have read and understand the deposit and forfeiture terms above.</span>
            </label>

            {error && <p className="emd-audit-note" style={{ color: 'var(--color-danger)' }}>{error}</p>}
            <button onClick={confirm} disabled={!agreed || busy} className="emd-confirm-btn" style={{ background: agreed ? 'var(--color-bg-dark)' : '#E9EBF2', color: agreed ? '#fff' : 'var(--color-text-faint)' }}>Confirm &amp; Pledge Deposit</button>
            <p className="emd-audit-note">This consent is logged to the platform's immutable audit trail with the exact terms shown and this transaction's reference.</p>
          </>
        )}

        {confirmed && (
          <div className="emd-success">
            <div className="emd-success__title">Deposit Pledged</div>
            <p className="emd-success__body">{EMD_AMOUNT} is now held in escrow for this {LOT.noun}. You're clear to proceed to the Bidding Room.</p>
            <Link to={biddingRoom} className="emd-success__cta">Continue to Bidding Room →</Link>
          </div>
        )}
      </main>
    </div>
  );
}
