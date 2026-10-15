import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth as authApi, tenants as tenantsApi } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { readAuth } from '../../utils/auth.js';
import { formatCurrency } from '../../utils/format.js';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import './TenantAdminDashboard.css';

const NAV_ITEMS = [
  { label: 'Approvals', to: '#pending' },
  { label: 'Market Makers', to: '#sellers' },
  { label: 'Billing', to: '#billing' },
  { label: 'Dashboard', to: '/tenant-admin/dashboard', active: true },
];
const CTAS = [{ label: 'Profile', to: '/profile' }];

// Data: the tenant comes from GET /auth/me (party.admin_tenants); the page
// then loads /tenants/:id/{dashboard,verification,sellers,billing}, all
// gated to that tenant's Tenant Admin.
const TIER_LABELS = { coco_starter: 'CoCo Starter', tsx_launch: 'TSX Launch', tsx_growth: 'TSX Growth', tsx_enterprise: 'TSX Enterprise' };
const FORMAT_LABELS = { easy: 'EASY', express: 'EXPRESS', buy_now: 'BUY-NOW', tender: 'TENDER' };
const STANDING = {
  good: { standing: 'Good standing', standingColor: 'var(--color-success)', standingBg: 'var(--color-success-bg)' },
  review: { standing: 'Under Review', standingColor: 'var(--color-warning)', standingBg: 'var(--color-warning-bg)' },
  delisted: { standing: 'Delisted (fraud)', standingColor: 'var(--color-danger)', standingBg: 'var(--color-danger-bg)' },
};
const humanize = (v) => (v ? String(v).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '');
const maskMobile = (m) => { const d = String(m || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? `${d.slice(0, 2)}xxxxxx${d.slice(-2)}` : (m || '—'); };
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const shortDate = (d) => (d ? new Date(String(d).replace(' ', 'T')).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const Empty = ({ children }) => <div className="ta-list-row" style={{ color: 'var(--color-text-faint)' }}>{children}</div>;

const CONSOLE_LINKS = [
  ['Media Waiver Request', '#'], ['Full Market Maker List', '#'], ['API Access', '#'], ['Pending Market Maker Applications', '#'],
];

export default function TenantAdminDashboard() {
  const [tenantChoices, setTenantChoices] = useState([]);
  const [tenantId, setTenantId] = useState('');
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  // Which tenant(s) does this user administer? Use the list saved from the
  // login response straight away, then refresh it from /auth/me.
  useEffect(() => {
    const saved = (readAuth() || {}).adminTenants || [];
    if (saved.length) { setTenantChoices(saved); setTenantId(saved[0].id); }
    authApi.me()
      .then((res) => {
        const party = unwrap(res).party || {};
        const list = party.admin_tenants || [];
        if (list.length) { setTenantChoices(list); setTenantId((cur) => (list.some((t) => t.id === cur) ? cur : list[0].id)); }
        else if (saved.length) return;
        else if ((party.roles || []).includes('tenant_admin')) setError('Your account is a Tenant Admin, but the server did not say for which tenant. The backend needs the latest update (admin_tenants in /auth/me).');
        else setError('This dashboard is for Tenant Admins (TSX Masters). Your account is not a Tenant Admin for any tenant.');
      })
      .catch((err) => { if (!saved.length || err.status === 401) setError(err.status === 401 ? 'Please log in to view the Tenant Admin dashboard.' : (err.message || 'Could not load your account.')); });
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    setD(null);
    Promise.all([
      tenantsApi.dashboard(tenantId), tenantsApi.verification(tenantId),
      tenantsApi.sellers(tenantId), tenantsApi.billing(tenantId),
    ])
      .then(([dash, ver, sel, bill]) => {
        if (cancelled) return;
        const dashboard = unwrap(dash), verification = unwrap(ver), sellers = unwrap(sel), billing = unwrap(bill);
        setD({
          tenant: dashboard.tenant || {},
          pendingListings: verification.pending || [],
          pendingSaleEvents: verification.pendingSaleEvents || [],
          pendingSellers: dashboard.pendingSellers || [],
          openDisputes: dashboard.openDisputes || [],
          stalledSettlements: dashboard.stalledSettlements || [],
          highValueDisposals: dashboard.highValueDisposals || [],
          sellers: sellers.sellers || [],
          unbilled: billing.unbilled || [],
          invoices: billing.invoices || [],
        });
      })
      .catch((err) => { if (!cancelled) setError(err.status === 403 ? 'You are not the Tenant Admin for this tenant.' : (err.message || 'Could not load the dashboard.')); });
    return () => { cancelled = true; };
  }, [tenantId]);

  if (error || !d) {
    return (
      <div className="ta-page">
        <LightDashboardHeader navItems={NAV_ITEMS} ctas={CTAS} />
        <main className="ta-main"><h1 className="ta-h1">TSX Master Dashboard</h1><p className="ta-sub">{error || 'Loading dashboard…'}</p></main>
      </div>
    );
  }

  const sellerStanding = (s) => (s.seller_delisted_at ? STANDING.delisted : (s.hasOpenCase ? STANDING.review : STANDING.good));
  const unbilledTotal = d.unbilled.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const latestInvoice = d.invoices[0];

  return (
    <div className="ta-page">
      <LightDashboardHeader navItems={NAV_ITEMS} ctas={CTAS} />
      <main className="ta-main">
        <div className="ta-title-row">
          <h1 className="ta-h1">TSX Master — {d.tenant.name}</h1>
          <span className="ta-tier-badge">CoCo Tier: {TIER_LABELS[d.tenant.subscription_tier] || humanize(d.tenant.subscription_tier)}</span>
          {tenantChoices.length > 1 && (
            <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} style={{ marginLeft: 12 }}>
              {tenantChoices.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
        </div>
        <p className="ta-sub">Everything awaiting your action across lots, trading sessions, Market Maker standing, and billing on this TradeSphereX.</p>

        <div className="ta-stats">
          <Link to="/lot-approval" className="ta-stat-card"><b>{d.pendingListings.length}</b><span>Lots to Review</span></Link>
          <Link to="/lot-approval" className="ta-stat-card"><b>{d.pendingSaleEvents.length}</b><span>Trading Sessions to Approve</span></Link>
          <Link to="#sellers" className="ta-stat-card"><b className="text-gold">{d.pendingSellers.length}</b><span>Market Maker Applications</span></Link>
          <Link to="#" className="ta-stat-card"><b>{d.openDisputes.length}</b><span>Open Disputes</span></Link>
          <Link to="#disputes" className="ta-stat-card"><b>{d.stalledSettlements.length}</b><span>Stalled Settlements</span></Link>
        </div>

        <section id="pending" className="ta-section">
          <div className="ta-twocol">
            <div>
              <h2 className="ta-h2">Lots Awaiting Approval</h2>
              <div className="ta-table">
                {d.pendingListings.map((l) => (
                  <Link to={`/lot-detail?id=${l.id}`} key={l.id} className="ta-list-row">{l.title || l.category} — {humanize(l.physical_condition)}</Link>
                ))}
                {d.pendingListings.length === 0 && <Empty>No lots awaiting approval.</Empty>}
              </div>
            </div>
            <div>
              <h2 className="ta-h2">Trading Sessions Awaiting Approval</h2>
              <div className="ta-table">
                {d.pendingSaleEvents.map((se) => (
                  <Link to={`/lot-detail?id=${se.listing_id}`} key={se.id} className="ta-list-row">{se.ern || se.category} — {FORMAT_LABELS[se.sale_format] || se.sale_format}</Link>
                ))}
                {d.pendingSaleEvents.length === 0 && <Empty>No trading sessions awaiting approval.</Empty>}
              </div>
            </div>
          </div>
        </section>

        <section id="disputes" className="ta-section">
          <div className="ta-twocol">
            <div>
              <h2 className="ta-h2">Open Disputes</h2>
              <div className="ta-table">
                {d.openDisputes.map((x) => (
                  <Link to="/dispute-center" key={x.id} className="ta-list-row">{humanize(x.category)} · {humanize(x.status)}</Link>
                ))}
                {d.openDisputes.length === 0 && <Empty>No open disputes.</Empty>}
              </div>
            </div>
            <div>
              <h2 className="ta-h2">Stalled Settlements</h2>
              <div className="ta-table">
                {d.stalledSettlements.map((x) => (
                  <Link to="#" key={x.id} className="ta-list-row ta-list-row--gold">{formatCurrency(x.final_price)}{x.stall_flagged_at ? ` · stalled since ${shortDate(x.stall_flagged_at)}` : ''}</Link>
                ))}
                {d.stalledSettlements.length === 0 && <Empty>No stalled settlements.</Empty>}
              </div>
            </div>
          </div>
        </section>

        <section className="ta-section">
          <h2 className="ta-h2">High-Value Disposal Records (&gt;₹10L)</h2>
          <div className="ta-table">
            {d.highValueDisposals.map((x) => (
              <Link to="#" key={x.id} className="ta-disposal-row">
                <span className="ta-disposal-value">{formatCurrency(x.final_sale_value)}</span>
                <span className="ta-disposal-meta">RV {formatCurrency(x.reserve_value)} · Variance {Number(x.variance) >= 0 ? '+' : '−'}{formatCurrency(Math.abs(Number(x.variance)))} · {FORMAT_LABELS[x.sale_format] || x.sale_format}</span>
              </Link>
            ))}
            {d.highValueDisposals.length === 0 && <Empty>No high-value disposals yet.</Empty>}
          </div>
        </section>

        <section id="sellers" className="ta-section">
          <div className="ta-section-head">
            <h2 className="ta-h2" style={{ margin: 0 }}>Market Maker Management</h2>
            <Link to="#" className="ta-pill-link">Review Pending Applications</Link>
          </div>
          <p className="ta-hint">Backed by the Standing Review system — sorted by complaint count.</p>
          <div className="ta-table">
            <div className="ta-seller-row ta-seller-row--head">
              <div>Mobile</div><div>Rating</div><div>Sales</div><div>Complaints</div><div>Standing</div>
            </div>
            {d.sellers.map((s) => {
              const st = sellerStanding(s);
              return (
                <Link to="#" key={s.party_id} className="ta-seller-row">
                  <div>{maskMobile(s.mobile_number)}</div>
                  <div>{s.seller_star_rating != null ? `${Number(s.seller_star_rating).toFixed(1)}★` : '—'}</div>
                  <div>{s.salesOnTenant ?? 0}</div>
                  <div>{s.standing_review_complaint_count ?? 0}</div>
                  <div><span className="ta-badge" style={{ color: st.standingColor, background: st.standingBg }}>{st.standing}</span></div>
                </Link>
              );
            })}
            {d.sellers.length === 0 && <Empty>No approved Market Makers on this tenant yet.</Empty>}
          </div>
        </section>

        <section className="ta-section">
          <h2 className="ta-h2" style={{ marginBottom: 6 }}>Verification Console</h2>
          <p className="ta-hint">Authentic media catalog + thumbnail for every listing awaiting approval.</p>
          <div className="ta-verify-list">
            {d.pendingListings.map((v) => (
              <Link to={`/lot-detail?id=${v.id}`} key={v.id} className="ta-verify-row">
                <div className="ta-verify-thumb" style={v.primaryPhotoPath ? { background: `center / cover no-repeat url(/${String(v.primaryPhotoPath).replace(/^\/+/, '')})` } : undefined} />
                <div>
                  <p className="ta-verify-cat">{v.title || v.category}</p>
                  <p className="ta-verify-summary">
                    {plural(Number(v.photoCount || 0), 'photo')} · {plural(Number(v.videoCount || 0), 'video')} · {plural(Number(v.documentCount || 0), 'document')}
                    {Number(v.queuedJobCount) > 0 ? ` · ${v.queuedJobCount} still processing` : ''}
                  </p>
                </div>
              </Link>
            ))}
            {d.pendingListings.length === 0 && <p className="ta-hint">Nothing awaiting verification.</p>}
          </div>
        </section>

        <section id="billing" className="ta-section">
          <h2 className="ta-h2" style={{ marginBottom: 6 }}>Billing</h2>
          <p className="ta-hint">Success fees accrue here and consolidate into one GST-compliant invoice per calendar month.</p>
          <div className="ta-twocol ta-twocol--tight">
            <div className="ta-billing-card">
              <p className="ta-billing-label">Unbilled This Period</p>
              <b className="ta-billing-amount">{formatCurrency(unbilledTotal)}</b>
            </div>
            <div className="ta-billing-card">
              <p className="ta-billing-label">Latest Invoice</p>
              {latestInvoice ? (
                <>
                  <p className="ta-invoice-line">{latestInvoice.invoice_number} — {formatCurrency(latestInvoice.total_amount)}</p>
                  <p className="ta-invoice-meta">{shortDate(latestInvoice.period_start)} – {shortDate(latestInvoice.period_end)} · {humanize(latestInvoice.status)}</p>
                </>
              ) : <p className="ta-invoice-meta">No invoices yet.</p>}
            </div>
          </div>
        </section>

        <section className="ta-account">
          <h3 className="ta-account-title">Console</h3>
          <div className="ta-quick">
            {CONSOLE_LINKS.map(([label, to]) => (
              <Link key={label} to={to} className="ta-quick-link">{label}</Link>
            ))}
          </div>
        </section>

        <section className="ta-footer-links">
          <h3 className="ta-account-title">Quick Links</h3>
          <div className="ta-quick">
            <Link to="/lot-approval" className="ta-quick-link">Lot Approval</Link>
            <Link to="/trading-session-directory" className="ta-quick-link">Trading Session Directory</Link>
            <Link to="/dispute-center" className="ta-quick-link">Dispute Center</Link>
            <Link to="/rating-reviews" className="ta-quick-link">Rating & Reviews</Link>
            <Link to="/invoices" className="ta-quick-link">Invoices</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
