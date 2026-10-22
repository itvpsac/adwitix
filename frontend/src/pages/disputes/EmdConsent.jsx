import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import { saleEvents } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import './EmdConsent.css';

// EmdService::calculateBaselineEmd: Buy-Now uses the expected value,
// Easy/Express the reserve value; Tender EMD is handled offline (0 here).
const EMD_BASIS = { buy_now: '10% of Expected Value', express: '10% of Reserve Value', easy: '10% of Reserve Value', tender: 'Tender EMD is arranged offline' };
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
  const { data, loading, error: loadError, reload } = useApiQuery(() => saleEvents.emdConsentTerms(saleEventId, action), [saleEventId, action], { skip: !saleEventId });
  const se = data && data.saleEvent;
  const LOT = { ern: (se && se.ern) || '', title: '', formatLabel: 'auction', noun: 'bid', ...(se ? FORMAT_COPY[se.sale_format] : {}) };
  const EMD_AMOUNT = data && data.amount != null ? `₹${Number(data.amount).toLocaleString('en-IN')}` : '—';
  const emdBasis = (se && EMD_BASIS[se.sale_format]) || '';
  const termsReady = !!(saleEventId && se && data.amount != null);
  const biddingRoom = lotId ? `/bidding-room?id=${lotId}${se ? `&format=${se.sale_format}` : ''}` : '/bidding-room';

  const confirm = async () => {
    if (!agreed || busy || !termsReady) return;
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
            {!saleEventId && <p className="emd-audit-note" style={{ color: 'var(--color-danger)' }}>No trading session selected. Open EMD consent from a lot's page.</p>}
            {saleEventId && loading && <p className="emd-audit-note">Loading deposit terms…</p>}
            {loadError && <p className="emd-audit-note" style={{ color: 'var(--color-danger)' }}>{loadError.message || 'Could not load the deposit terms.'} <button type="button" onClick={reload} className="emd-retry">Retry</button></p>}

            <div className="emd-card">
              <div className="emd-card__label">Earnest Money Deposit (EMD)</div>
              <div className="emd-card__amount">{EMD_AMOUNT}</div>
              {emdBasis && <div className="emd-card__basis">{emdBasis}</div>}
            </div>

            <div className="emd-terms">
              <p>I understand that pledging <strong>{EMD_AMOUNT}</strong> as Earnest Money Deposit for this {LOT.noun} means: if the {LOT.formatLabel} closes and I fail to complete my obligation, this deposit is <strong>forfeited</strong> — allocated to the TradeSphereX, ADWITIX, and (where applicable) the Market Maker per the platform's standard forfeiture rules.</p>
            </div>

            <label className="emd-checkbox-row">
              <input type="checkbox" checked={agreed} onChange={() => setAgreed(!agreed)} className="emd-checkbox" />
              <span>I have read and understand the deposit and forfeiture terms above.</span>
            </label>

            {error && <p className="emd-audit-note" style={{ color: 'var(--color-danger)' }}>{error}</p>}
            <button onClick={confirm} disabled={!agreed || busy || !termsReady} className="emd-confirm-btn" style={{ background: agreed && termsReady ? 'var(--color-bg-dark)' : '#E9EBF2', color: agreed && termsReady ? '#fff' : 'var(--color-text-faint)' }}>{busy ? 'Pledging…' : <>Confirm &amp; Pledge Deposit</>}</button>
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
