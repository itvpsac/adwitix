import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { api, unwrap } from '../../api/client.js';
import { formatCurrency } from '../../utils/format.js';
import './CustodianDashboard.css';

const NAV_ITEMS = [
  { label: 'TradeSphereX', to: '/custodian/dashboard#tenants' },
  { label: 'Users', to: '/user-directory' },
  { label: 'Lots', to: '/lot-directory' },
  { label: 'Sessions', to: '/trading-session-directory' },
  { label: 'Compliance', to: '/custodian/dashboard#compliance' },
  { label: 'Dashboard', to: '/custodian/dashboard', active: true },
];

const STATUS_STYLE = {
  Active: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  'Shadow-banned': { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  Delisted: { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
};
const KYC_STYLE = {
  Verified: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  Approved: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  Pending: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  Rejected: { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
};
const COMPLIANCE_LINKS = [
  ['Alerts', '/alerts'], ['Delist Market Maker', '/delist-market-maker'], ['Audit Log', '/audit-ledger'],
  ['Statutory Export', '/statutory-export'], ['Media Waivers', '/media-waivers'], ['AML Monitoring', '/aml-monitoring'],
  ['Payout Reviews', '/payout-reviews'], ['Chargeback Handling', '/chargeback-handling'], ['TradeSphereX Invoices', '/invoices'],
  ['Rating Reviews', '/rating-reviews'], ['Consent Audit', '/consent-audit'], ['Rules & Specifications', '/rules-and-specifications'],
  ['KYC Review Queue', '/kyc-queue'], ['Whitelist TradeSphereX', '/whitelist-tenant'],
];

const humanize = (v) => (v ? String(v).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—');
const TIER_LABEL = { coco_starter: 'CoCo Starter', tsx_launch: 'Launch', tsx_growth: 'Growth', tsx_enterprise: 'Enterprise' };
const day = (d) => (d ? String(d).slice(0, 10) : '—');
const signedCurrency = (v) => (Number(v) > 0 ? '+' : Number(v) < 0 ? '−' : '') + formatCurrency(Math.abs(Number(v) || 0));

// GET /api/v1/app/admin (AdminController::dashboard) → what the page shows.
function toView(raw) {
  return {
    tenantCount: (raw.tenants || []).length,
    openDisputes: raw.openDisputes ?? 0,
    stalledSettlements: raw.stalledSettlements ?? 0,
    openAmlFlags: raw.openAmlFlags ?? 0,
    bidsPlacedToday: raw.bidsPlacedToday ?? 0,
    salesClosedToday: raw.salesClosedToday ?? 0,
    disputesFiledToday: raw.disputesFiledToday ?? 0,
    newByFormat: (raw.listingsByFormatToday || []).map((r) => ({ format: String(r.sale_format || '').toUpperCase().replace('_', '-'), count: Number(r.cnt) || 0 })),
    tenants: (raw.tenants || []).map((t) => ({
      id: t.id,
      name: t.name,
      tenantClass: humanize(t.tenant_class),
      subdomain: t.subdomain || '—',
      tier: TIER_LABEL[t.subscription_tier] || humanize(t.subscription_tier),
      // Company-shop tenants run tenders through the concierge console.
      href: t.tenant_class === 'company_shop' ? '/tender-concierge-console' : null,
    })),
    stalledAging: (raw.stalledAging || []).map((r) => ({ id: r.id, amount: formatCurrency(r.final_price), since: day(r.created_at), daysStalled: r.days_stalled })),
    highValueDisposals: (raw.highValueDisposals || []).map((r) => ({
      id: r.id, tenantName: r.tenant_name, format: String(r.sale_format || '').toUpperCase(),
      finalValue: formatCurrency(r.final_sale_value), variance: signedCurrency(r.variance), date: day(r.created_at),
    })),
    users: (raw.recentUsers || []).map((u) => ({
      id: u.id,
      mobile: u.mobile_number || '—',
      name: u.full_name || u.mobile_number || '—',
      type: (u.entity_type || 'individual').toLowerCase() === 'organization' ? 'Business' : 'Individual',
      kyc: u.kyc_status ? u.kyc_status.charAt(0).toUpperCase() + u.kyc_status.slice(1) : 'Pending',
      traderRating: Number(u.star_rating ?? 0).toFixed(1),
      mmRating: Number(u.seller_star_rating ?? 0).toFixed(1),
      status: u.seller_delisted_at ? 'Delisted' : (u.shadow_banned_at_buyer || u.shadow_banned_at_seller) ? 'Shadow-banned' : 'Active',
    })),
  };
}

export default function CustodianDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/v1/app/admin')
      .then((res) => setData(toView(unwrap(res) || {})))
      .catch((err) => setError(err.description || err.message || 'Could not load the dashboard.'));
  }, []);

  const d = data || toView({});
  const value = (n) => (data ? n : '…');

  return (
    <div className="cd-page">
      <DashboardHeader consoleLabel="Custodian Console" homeTo="/" navItems={NAV_ITEMS} />

      <main className="cd-main">
        <h1 className="cd-h1">Custodian Dashboard</h1>
        <p className="cd-sub">Platform-wide oversight — TradeSphereX onboarding, compliance, billing, and governance.</p>
        {error && <p className="cd-sub" style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <div className="cd-stats">
          <Link to="/custodian/dashboard#tenants" className="cd-stat-card"><b>{value(d.tenantCount)}</b><span>Whitelisted TradeSphereX</span></Link>
          <Link to="/dispute-center" className="cd-stat-card"><b>{value(d.openDisputes)}</b><span>Open Disputes</span></Link>
          <Link to="/alerts" className="cd-stat-card"><b>{value(d.stalledSettlements)}</b><span>Stalled Settlements</span></Link>
          <Link to="/aml-monitoring" className="cd-stat-card"><b className="text-gold">{value(d.openAmlFlags)}</b><span>Open AML Flags</span></Link>
        </div>

        <section className="cd-section">
          <h2 className="cd-eyebrow">Today</h2>
          <div className="cd-today">
            <div className="cd-today-card"><b>{value(d.bidsPlacedToday)}</b><span>Bids Placed</span></div>
            <div className="cd-today-card"><b>{value(d.salesClosedToday)}</b><span>Trading Sessions Closed</span></div>
            <div className="cd-today-card"><b>{value(d.disputesFiledToday)}</b><span>Disputes Filed</span></div>
            {d.newByFormat.map((lf) => (
              <div key={lf.format} className="cd-today-card"><b>{lf.count}</b><span>New {lf.format} Sessions</span></div>
            ))}
          </div>
        </section>

        <section id="tenants" className="cd-section">
          <div className="cd-section-head">
            <h2 className="cd-h2">TradeSphereX</h2>
            <div className="cd-section-actions">
              <Link to="/trading-session-directory" className="cd-btn">Full Session Directory →</Link>
              <Link to="#" className="cd-btn">+ Whitelist New TradeSphereX</Link>
            </div>
          </div>
          <div className="cd-table">
            <div className="cd-table-row cd-table-row--head cd-tenant-cols">
              <div>Name</div><div>Class</div><div>Subdomain</div><div>CoCo Tier</div>
            </div>
            {d.tenants.map((t) => {
              const cells = (
                <>
                  <div className="cd-cell-strong">{t.name}</div>
                  <div className="cd-cell-muted">{t.tenantClass}</div>
                  <div className="cd-cell-mono">{t.subdomain}</div>
                  <div>{t.tier}</div>
                </>
              );
              return t.href
                ? <Link to={t.href} key={t.id} className="cd-table-row cd-tenant-cols cd-table-row--link">{cells}</Link>
                : <div key={t.id} className="cd-table-row cd-tenant-cols">{cells}</div>;
            })}
            {data && d.tenants.length === 0 && <div className="cd-table-row cd-cell-faint">No TradeSphereX whitelisted yet.</div>}
          </div>
        </section>

        <section className="cd-section">
          <h2 className="cd-h2">Stalled Settlements — Aging</h2>
          <div className="cd-table">
            {d.stalledAging.map((st) => (
              <Link to="/alerts" key={st.id} className="cd-stalled-row">
                <span className="text-gold-strong">{st.amount}</span>
                <span className="cd-cell-faint">since {st.since} · {st.daysStalled} day{st.daysStalled === 1 ? '' : 's'} stalled</span>
              </Link>
            ))}
            {data && d.stalledAging.length === 0 && <div className="cd-stalled-row cd-cell-faint">No stalled settlements.</div>}
          </div>
        </section>

        <section className="cd-section">
          <div className="cd-section-head">
            <h2 className="cd-h2">High-Value Disposal Records (&gt;₹10L, platform-wide)</h2>
            <Link to="/lot-directory" className="cd-btn">Full Lot Directory →</Link>
          </div>
          <div className="cd-table">
            <div className="cd-table-row cd-table-row--head cd-disposal-cols">
              <div>TradeSphereX</div><div>Format</div><div>Final Value</div><div>Variance</div><div>Date</div>
            </div>
            {d.highValueDisposals.map((disposal) => (
              <div key={disposal.id} className="cd-table-row cd-disposal-cols">
                <div className="cd-cell-strong">{disposal.tenantName}</div>
                <div className="cd-cell-muted">{disposal.format}</div>
                <div className="text-gold-strong">{disposal.finalValue}</div>
                <div>{disposal.variance}</div>
                <div className="cd-cell-faint">{disposal.date}</div>
              </div>
            ))}
            {data && d.highValueDisposals.length === 0 && <div className="cd-table-row cd-cell-faint">No disposals above ₹10L yet.</div>}
          </div>
        </section>

        <section id="users" className="cd-section">
          <div className="cd-section-head">
            <h2 className="cd-h2">Newest Users</h2>
            <Link to="/user-directory" className="cd-btn">Full User Directory →</Link>
          </div>
          <div className="cd-table">
            <div className="cd-table-row cd-table-row--head cd-user-cols">
              <div>Mobile</div><div>Name</div><div>Type</div><div>KYC</div><div>Trader★</div><div>MM★</div><div>Status</div>
            </div>
            {d.users.map((u) => {
              const st = STATUS_STYLE[u.status];
              const kycSt = KYC_STYLE[u.kyc] || { color: 'var(--color-text)', bg: '#eee' };
              return (
                <Link to={`/user-detail?id=${u.id}`} key={u.id} className="cd-table-row cd-table-row--link cd-user-cols">
                  <div className="cd-cell-mono-sm">{u.mobile}</div>
                  <div className="cd-cell-name">{u.name}</div>
                  <div className="cd-cell-muted">{u.type}</div>
                  <div><span className="cd-status-badge" style={{ color: kycSt.color, background: kycSt.bg }}>{u.kyc}</span></div>
                  <div>{u.traderRating}★</div>
                  <div>{u.mmRating}★</div>
                  <div><span className="cd-status-badge" style={{ color: st.color, background: st.bg }}>{u.status}</span></div>
                </Link>
              );
            })}
            {data && d.users.length === 0 && <div className="cd-table-row cd-cell-faint">No users yet.</div>}
          </div>
        </section>

        <section id="compliance" className="cd-compliance">
          <h3 className="cd-compliance-title">Governance &amp; Compliance</h3>
          <div className="cd-quick">
            {COMPLIANCE_LINKS.map(([label, to]) => (
              <Link key={label} to={to} className="cd-quick-link">{label}</Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
