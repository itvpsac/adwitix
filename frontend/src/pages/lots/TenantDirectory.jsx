import { useState } from 'react';
import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import { tenants as tenantsApi } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import { unwrap } from '../../api/client.js';
import './TenantDirectory.css';


export default function TenantDirectory() {
  const [query, setQuery] = useState('');
  const [applyingTenant, setApplyingTenant] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [application, setApplication] = useState(null);
  const humanize = (v) => String(v || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // GET /tenants → { tenants: tenant rows } (TenantController::directory)
  const { data: apiData, loading: apiLoading, error: apiError } = useApiQuery(() => tenantsApi.directory(), []);
  const apiRows = (apiData && (apiData.tenants || apiData.rows)) || [];
  const SWATCHES = ['#3B5A8A', '#3F7A6B', '#8A5B3B', '#6A4A9C', '#5B6178', '#A9622C'];
  const source = apiRows.map((t, i) => ({
    id: t.id,
    name: t.name || t.display_name || '—',
    domain: t.custom_domain || t.subdomain || '',
    tenantClass: humanize(t.tenant_class) || 'General',
    // Salvage Managers (the CoCo plan) needs no seller approval (D-131).
    openSelling: t.subscription_tier === 'coco_starter',
    tier: t.subscription_tier === 'coco_starter' ? 'Salvage Managers' : humanize(t.subscription_tier),
    swatch: t.branding_primary_color || SWATCHES[i % SWATCHES.length],
    suspended: !!t.suspended_at,
  })).filter((t) => !t.suspended);

  const q = query.toLowerCase();
  const tenants = source.filter((t) => !q || t.name.toLowerCase().includes(q) || t.tenantClass.toLowerCase().includes(q));
  // POST /tenants/:id/apply-to-sell takes no body (SellerApplicationController::applySubmit).
  const submitApplication = async () => {
    if (!applyingTenant || submitting) return;
    setSubmitting(true); setSubmitError('');
    try {
      const d = unwrap(await tenantsApi.applyToSell(applyingTenant.id));
      setApplication(d.application || null);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.status === 401 ? 'Log in to apply to sell.' : (err.description || err.message || 'Could not submit the application.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tdir-page">
      <LightDashboardHeader navItems={[{ label: 'Marketplace', to: '/marketplace' }, { label: 'Dashboard', to: '/seller/dashboard' }]} primaryCta={{ label: 'Apply to Sell', to: '/apply-to-sell' }} />
      <main className="tdir-main">
        <h1 className="tdir-title">Choose a TradeSphereX to Apply To</h1>
        <p className="tdir-sub">Selling rights are tenant-specific — approval on one TradeSphereX does not carry over to another. Pick the storefront that fits what you're selling, then apply below.</p>

        {!applyingTenant && (
          <>
            <div className="tdir-search">
              <input placeholder="Search TradeSphereX by name or category…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <span className="tdir-search__icon">⌕</span>
            </div>
            {apiLoading && <div className="custodian-empty">Loading…</div>}
            {apiError && <div className="custodian-empty" style={{ color: 'var(--color-danger)' }}>{apiError.description || apiError.message || 'Could not load the directory.'}</div>}
            {!apiLoading && !apiError && tenants.length === 0 && <div className="custodian-empty">No TradeSphereX storefronts yet.</div>}
            <div className="tdir-grid">
              {tenants.map((t) => (
                <div key={t.id} className="tdir-card">
                  <div className="tdir-card__head">
                    <span className="tdir-swatch" style={{ background: t.swatch }} />
                    {t.tier && <span className="tdir-tier">{t.tier}</span>}
                  </div>
                  <div className="tdir-card__name">{t.name}</div>
                  {t.domain && <div className="tdir-card__subdomain">{t.domain}</div>}
                  <div className="tdir-card__class">{t.tenantClass}</div>
                  {t.openSelling ? (
                    <>
                      <p style={{ margin: '8px 0 0', font: '500 12.5px/1.45 var(--font-sans)', color: 'var(--color-text-muted)' }}>Open to every verified seller — no approval needed. Each Lot is approved by its TSX Master.</p>
                      <Link to={`/create-lot?tenant=${t.id}`} className="tdir-apply-btn" style={{ textAlign: 'center', textDecoration: 'none' }}>List a Lot Here</Link>
                    </>
                  ) : (
                    <button onClick={() => { setApplyingTenant(t); setSubmitted(false); setSubmitError(''); }} className="tdir-apply-btn">Apply to Sell Here</button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {applyingTenant && !submitted && (
          <div className="tdir-form-card">
            <button onClick={() => setApplyingTenant(null)} className="tdir-back-link">← Back to directory</button>
            <div className="legal-eyebrow">Applying to</div>
            <h2 className="tdir-form-title">{applyingTenant.name}</h2>
            <p className="tdir-form-note">Submitting routes your application to {applyingTenant.name}'s Tenant Admin for review. Full KYC is completed separately once approved.</p>
            <button onClick={submitApplication} disabled={submitting} className="tdir-submit-btn" style={{ background: !submitting ? 'var(--color-bg-dark)' : '#E9EBF2', color: !submitting ? '#fff' : 'var(--color-text-faint)' }}>{submitting ? 'Submitting…' : 'Submit Application'}</button>
            {submitError && <p className="tdir-form-note" style={{ color: 'var(--color-danger)' }}>{submitError}</p>}
          </div>
        )}

        {applyingTenant && submitted && (
          <div className="tdir-success">
            <div className="tdir-success__title">Application Submitted</div>
            <p className="tdir-success__body">Your application to sell on <strong>{applyingTenant.name}</strong> is now with their Tenant Admin.</p>
            {application && application.id && <p className="tdir-success__ref">Reference: {application.id}</p>}
            <Link to="/seller/dashboard" className="tdir-success__cta">Go to Dashboard →</Link>
          </div>
        )}
      </main>
    </div>
  );
}
