import { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import '../compliance/CustodianShared.css';
import './WhitelistTenant.css';

export default function WhitelistTenant() {
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [tenantClass, setTenantClass] = useState('general');
  const [tier, setTier] = useState('coco_starter');
  const [submitted, setSubmitted] = useState(false);

  const valid = !!(name && subdomain);

  return (
    <div className="custodian-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Whitelist Tenant', to: '/whitelist-tenant', active: true }]} />
      <main className="custodian-main custodian-main--narrow" style={{ paddingBottom: 100 }}>
        <div className="legal-eyebrow">Custodian</div>
        {!submitted ? (
          <>
            <h1 className="custodian-title custodian-title--sm">Whitelist a TradeSphereX</h1>
            <p className="wt-sub">Creating a tenant here IS the whitelisting act — only the Custodian can bring a new TradeSphereX onto the platform.</p>
            <div className="wt-form">
              <div>
                <label className="wt-label">TradeSphereX Name</label>
                <input placeholder="e.g. Northline Industrial Auctions" value={name} onChange={(e) => setName(e.target.value)} className="wt-input" />
              </div>
              <div>
                <label className="wt-label">Subdomain</label>
                <input placeholder="e.g. northline" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} className="wt-input wt-input--mono" />
              </div>
              <div>
                <label className="wt-label">Custom Domain (optional)</label>
                <input placeholder="e.g. www.salvagemanagers.com" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} className="wt-input wt-input--mono" />
              </div>
              <div>
                <label className="wt-label">TradeSphereX Class</label>
                <select value={tenantClass} onChange={(e) => setTenantClass(e.target.value)} className="wt-input">
                  <option value="general">General</option>
                  <option value="institutional">Institutional</option>
                  <option value="company_shop">Company Shop</option>
                </select>
              </div>
              <div>
                <label className="wt-label">Subscription Tier</label>
                <p className="wt-tier-note">The Success Fee itself is fixed platform-wide and not set here.</p>
                <select value={tier} onChange={(e) => setTier(e.target.value)} className="wt-input">
                  <option value="coco_starter">CoCo Starter (Buyer-Pays only)</option>
                  <option value="tsx_launch">TSX Launch</option>
                  <option value="tsx_growth">TSX Growth</option>
                  <option value="tsx_enterprise">TSX Enterprise</option>
                </select>
              </div>
            </div>
            <button onClick={() => { if (valid) setSubmitted(true); }} disabled={!valid} className="wt-submit-btn" style={{ background: valid ? 'var(--color-bg-dark)' : '#E9EBF2', color: valid ? '#fff' : 'var(--color-text-faint)' }}>Whitelist TradeSphereX</button>
          </>
        ) : (
          <div className="wt-success">
            <div className="wt-success__title">TradeSphereX Whitelisted</div>
            <p className="wt-success__body"><strong>{name}</strong> is live at <span className="wt-success__domain">{subdomain}.ebidhub.com</span>.</p>
            <p className="wt-success__next">Next: appoint a Tenant Admin for this TradeSphereX.</p>
            <Link to="/custodian/dashboard" className="wt-success__cta">Back to Dashboard →</Link>
          </div>
        )}
      </main>
    </div>
  );
}
