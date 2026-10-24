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
  // A failed load or an unknown tenant id must not offer the Apply button.
  // Salvage Managers needs no seller approval (BR-09, D-131): no application.
  const status = submitted ? 'submitted' : !tenantId ? 'pick' : loading ? 'loading' : loadError ? 'error' : !(data && data.tenant) ? 'notfound' : data.openSelling ? (data.canSell ? 'open' : 'suspended') : existing ? existing.status : 'none';

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
        {loadError && <div className="ats-card"><p>{loadError.status === 401 ? 'Please log in to apply to sell.' : (loadError.message || 'Could not load this TradeSphereX.')}</p></div>}
        {status === 'notfound' && <div className="ats-card"><p>This TradeSphereX was not found. Choose one from the <Link to="/tenant-directory">TradeSphereX Directory</Link>.</p></div>}
        {error && <div className="ats-card"><p style={{ color: 'var(--color-danger)' }}>{error}</p></div>}
        {status === 'open' && (
          <div className="ats-success">
            <div className="ats-success__title">No approval needed</div>
            <p>Any verified seller can list on {tenant.name}. Each Lot is still reviewed and approved by its TSX Master before it goes live.</p>
            <Link to={`/create-lot?tenant=${tenantId}`} className="ats-btn" style={{ display: 'inline-block', textDecoration: 'none', marginTop: 12 }}>List a Lot</Link>
          </div>
        )}
        {status === 'suspended' && (
          <div className="ats-card"><p>Your selling on {tenant.name} has been suspended by its TSX Master. Contact them to have it reviewed.</p></div>
        )}
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
            {/* SellerApplicationService::apply refuses any party+tenant that
                already has an application (UNIQUE party_id, tenant_id), so a
                rejected application cannot be re-submitted from here. */}
            <p className="ats-card__text">Re-applying to the same TradeSphereX isn't available yet — contact {tenant.name}'s Tenant Admin.</p>
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
