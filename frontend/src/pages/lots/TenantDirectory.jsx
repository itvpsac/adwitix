import { useState } from 'react';
import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import { tenants as tenantsApi } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import './TenantDirectory.css';


export default function TenantDirectory() {
  const [query, setQuery] = useState('');
  const [applyingTenant, setApplyingTenant] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [entityType, setEntityType] = useState('');
  const [category, setCategory] = useState('');
  const [mobile, setMobile] = useState('');

  const { data: apiData, loading: apiLoading } = useApiQuery(() => tenantsApi.directory(), []);
  const apiRows = (apiData && (apiData.tenants || apiData.rows)) || [];
  const SWATCHES = ['#3B5A8A', '#3F7A6B', '#8A5B3B', '#6A4A9C', '#5B6178', '#A9622C'];
  const source = apiRows.map((t, i) => ({
    id: t.id,
    name: t.name || t.display_name || '—',
    subdomain: t.subdomain || '—',
    tenantClass: t.tenant_class || t.class || 'General',
    tier: (t.subscription_tier || 'starter').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    swatch: SWATCHES[i % SWATCHES.length],
    activeLots: t.active_listing_count ?? 0,
    sellerCount: t.seller_count ?? 0,
    blurb: t.description || 'Assets listed on this TradeSphereX storefront.',
  }));

  const q = query.toLowerCase();
  const tenants = source.filter((t) => !q || t.name.toLowerCase().includes(q) || t.tenantClass.toLowerCase().includes(q));
  const valid = !!(businessName && entityType && category && mobile.length >= 10);
  const submitApplication = () => {
    if (!valid) return;
    if (applyingTenant && applyingTenant.id) {
      tenantsApi.applyToSell(applyingTenant.id, {
        business_name: businessName, entity_type: entityType, primary_category: category, mobile_number: mobile,
      }).catch(() => {});
    }
    setSubmitted(true);
  };
  const appRef = `APP-${applyingTenant ? applyingTenant.subdomain.slice(0, 4).toUpperCase() : 'XXXX'}-2607`;

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
            {!apiLoading && tenants.length === 0 && <div className="custodian-empty">No TradeSphereX storefronts yet.</div>}
            <div className="tdir-grid">
              {tenants.map((t) => (
                <div key={t.name} className="tdir-card">
                  <div className="tdir-card__head">
                    <span className="tdir-swatch" style={{ background: t.swatch }} />
                    <span className="tdir-tier">{t.tier}</span>
                  </div>
                  <div className="tdir-card__name">{t.name}</div>
                  <div className="tdir-card__subdomain">{t.subdomain}.ebidhub.com</div>
                  <div className="tdir-card__class">{t.tenantClass}</div>
                  <p className="tdir-card__blurb">{t.blurb}</p>
                  <div className="tdir-card__stats">{t.activeLots} active Lots · {t.sellerCount} Market Makers</div>
                  <button onClick={() => { setApplyingTenant(t); setSubmitted(false); }} className="tdir-apply-btn">Apply to Sell Here</button>
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
            <div className="tdir-form-fields">
              <input placeholder="Business / entity name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="tdir-input" />
              <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="tdir-input">
                <option value="">Entity type…</option>
                <option value="individual">Individual</option>
                <option value="organization">Organization</option>
              </select>
              <input placeholder="Primary category you'll sell" value={category} onChange={(e) => setCategory(e.target.value)} className="tdir-input" />
              <input placeholder="Mobile number (+91)" value={mobile} onChange={(e) => setMobile(e.target.value)} className="tdir-input" />
            </div>
            <p className="tdir-form-note">Submitting routes your application to {applyingTenant.name}'s Tenant Admin for review. Full KYC is completed separately once approved.</p>
            <button onClick={submitApplication} disabled={!valid} className="tdir-submit-btn" style={{ background: valid ? 'var(--color-bg-dark)' : '#E9EBF2', color: valid ? '#fff' : 'var(--color-text-faint)' }}>Submit Application</button>
          </div>
        )}

        {applyingTenant && submitted && (
          <div className="tdir-success">
            <div className="tdir-success__title">Application Submitted</div>
            <p className="tdir-success__body">Your application to sell on <strong>{applyingTenant.name}</strong> is now with their Tenant Admin.</p>
            <p className="tdir-success__ref">Reference: {appRef}</p>
            <Link to="/seller/dashboard" className="tdir-success__cta">Go to Dashboard →</Link>
          </div>
        )}
      </main>
    </div>
  );
}
