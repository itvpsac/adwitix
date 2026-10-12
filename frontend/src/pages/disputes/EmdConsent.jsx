import { useState } from 'react';
import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import './EmdConsent.css';

const LOT = { ern: 'TSN-2026-3381', title: 'Industrial Compressor Unit', formatLabel: 'auction', noun: 'bid' };
const EMD_AMOUNT = '₹34,200';
const EMD_BASIS = '10% of Reserve Value · checked on every bid';

export default function EmdConsent() {
  const [agreed, setAgreed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="emd-page">
      <LightDashboardHeader homeTo="/lot-detail" />
      <main className="emd-main">
        {!confirmed && (
          <>
            <h1 className="emd-title">Confirm Your Deposit</h1>
            <p className="emd-sub">{LOT.ern} · {LOT.title}</p>

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

            <button onClick={() => { if (agreed) setConfirmed(true); }} disabled={!agreed} className="emd-confirm-btn" style={{ background: agreed ? 'var(--color-bg-dark)' : '#E9EBF2', color: agreed ? '#fff' : 'var(--color-text-faint)' }}>Confirm &amp; Pledge Deposit</button>
            <p className="emd-audit-note">This consent is logged to the platform's immutable audit trail with the exact terms shown and this transaction's reference.</p>
          </>
        )}

        {confirmed && (
          <div className="emd-success">
            <div className="emd-success__title">Deposit Pledged</div>
            <p className="emd-success__body">{EMD_AMOUNT} is now held in escrow for this {LOT.noun}. You're clear to proceed to the Bidding Room.</p>
            <Link to="/bidding-room" className="emd-success__cta">Continue to Bidding Room →</Link>
          </div>
        )}
      </main>
    </div>
  );
}
