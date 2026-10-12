import { useState } from 'react';
import './ApplyToSell.css';
import AppHeader from '../../components/AppHeader.jsx';

export default function ApplyToSell() {
  const [status, setStatus] = useState('rejected');
  const tenant = { name: 'Ironclad Metals TSX' };

  return (
    <div className="ats-page">
      <AppHeader variant="light" contextNav={[{ label: "Apply to Sell", to: "/apply-to-sell", active: true }, { label: "TradeSphereX Directory", to: "/tenant-directory" }]} />
      <main className="ats-main">
        <div className="ats-eyebrow">Applying to sell on</div>
        <h1 className="ats-title">{tenant.name}</h1>

        {status === 'none' && (
          <div className="ats-card">
            <p>Your identity and KYC are already on file from your ADWITIX account — no form needed here. One click sends your application to {tenant.name}'s Tenant Admin for review.</p>
            <button className="ats-btn" onClick={() => setStatus('submitted')}>Apply to Sell Here</button>
          </div>
        )}
        {status === 'pending' && (
          <div className="ats-card">
            <span className="ats-badge ats-badge--pending">Pending Review</span>
            <p className="ats-card__text">Your application was submitted 2026-08-05. Waiting on {tenant.name}'s Tenant Admin — you'll be notified the moment it's decided. There's nothing further to do right now.</p>
          </div>
        )}
        {status === 'rejected' && (
          <div className="ats-card">
            <span className="ats-badge ats-badge--rejected">Rejected</span>
            <div className="ats-reason">
              <div className="ats-reason__label">Reason given by {tenant.name}</div>
              <p>Primary category (scrap metal) is outside this TradeSphereX's current listing scope. Consider Metro Surplus Exchange instead.</p>
            </div>
            <button className="ats-btn" onClick={() => setStatus('submitted')}>Re-apply</button>
          </div>
        )}
        {status === 'submitted' && (
          <div className="ats-success">
            <div className="ats-success__title">Application Sent</div>
            <p>{tenant.name}'s Tenant Admin will review it under "Pending Market Maker Applications."</p>
          </div>
        )}
      </main>
    </div>
  );
}
