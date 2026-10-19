import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './ApplyToSell.css';
import AppHeader from '../../components/AppHeader.jsx';
import { tenants } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';

export default function ApplyToSell() {
  const [params] = useSearchParams();
  const tenantId = params.get('tenant');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // GET /tenants/:id/apply-to-sell → { tenant, existing: seller_application | null }
  const { data, loading, error: loadError } = useApiQuery(() => tenants.applyStatus(tenantId), [tenantId], { skip: !tenantId });
  const tenant = (data && data.tenant) || { name: 'a TradeSphereX' };
  const existing = data && data.existing;
  const status = submitted ? 'submitted' : !tenantId ? 'pick' : loading ? 'loading' : existing ? existing.status : 'none';

  const apply = async () => {
    setBusy(true);
    setError('');
    try {
      await tenants.applyToSell(tenantId, {});
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Could not submit the application.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ats-page">
      <AppHeader variant="light" contextNav={[{ label: "Apply to Sell", to: "/apply-to-sell", active: true }, { label: "TradeSphereX Directory", to: "/tenant-directory" }]} />
      <main className="ats-main">
        <div className="ats-eyebrow">Applying to sell on</div>
        <h1 className="ats-title">{tenant.name}</h1>

        {status === 'pick' && (
          <div className="ats-card">
            <p>Choose a TradeSphereX from the <Link to="/tenant-directory">TradeSphereX Directory</Link> to apply to sell there.</p>
          </div>
        )}
        {status === 'loading' && <div className="ats-card"><p>Loading…</p></div>}
        {loadError && <div className="ats-card"><p>{loadError.message || 'Could not load this TradeSphereX.'}</p></div>}
        {error && <div className="ats-card"><p style={{ color: 'var(--color-danger)' }}>{error}</p></div>}
        {status === 'approved' && (
          <div className="ats-success">
            <div className="ats-success__title">Approved</div>
            <p>You can list Lots on {tenant.name}.</p>
          </div>
        )}
        {status === 'none' && (
          <div className="ats-card">
            <p>Your identity and KYC are already on file from your ADWITIX account — no form needed here. One click sends your application to {tenant.name}'s Tenant Admin for review.</p>
            <button className="ats-btn" onClick={apply} disabled={busy}>{busy ? 'Applying…' : 'Apply to Sell Here'}</button>
          </div>
        )}
        {status === 'pending' && (
          <div className="ats-card">
            <span className="ats-badge ats-badge--pending">Pending Review</span>
            <p className="ats-card__text">Your application was submitted {((existing && existing.applied_at) || '').slice(0, 10)}. Waiting on {tenant.name}'s Tenant Admin — you'll be notified the moment it's decided. There's nothing further to do right now.</p>
          </div>
        )}
        {status === 'rejected' && (
          <div className="ats-card">
            <span className="ats-badge ats-badge--rejected">Rejected</span>
            <div className="ats-reason">
              <div className="ats-reason__label">Reason given by {tenant.name}</div>
              <p>{(existing && existing.rejection_reason) || 'No reason recorded.'}</p>
            </div>
            <button className="ats-btn" onClick={apply} disabled={busy}>{busy ? 'Applying…' : 'Re-apply'}</button>
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
