import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import './TenantAdminDashboard.css';

const NAV_ITEMS = [
  { label: 'Approvals', to: '#pending' },
  { label: 'Market Makers', to: '#sellers' },
  { label: 'Billing', to: '#billing' },
  { label: 'Dashboard', to: '/tenant-admin/dashboard', active: true },
];
const CTAS = [{ label: 'Profile', to: '/profile' }];

const TENANT_NAME = 'Northline Industrial Auctions';
const TIER_LABEL = 'CoCo Tier: Growth';
const STATS = { pendingListings: 5, pendingSaleEvents: 2, pendingSellers: 3, openDisputes: 1, stalledSettlements: 1 };

const PENDING_LISTINGS = [
  { category: 'Repossessed Excavator', condition: 'Working, Moderate Wear' },
  { category: 'Warehouse Racking Lot', condition: 'Used, Good Condition' },
  { category: 'Diesel Generator Set', condition: 'Working, Minor Wear' },
];
const PENDING_SALE_EVENTS = [
  { ern: 'ERN-20260731-042', format: 'TENDER' },
  { ern: 'ERN-20260730-039', format: 'EASY' },
];
const OPEN_DISPUTES = [{ category: 'Item condition mismatch' }];
const STALLED_SETTLEMENTS = [{ price: '₹4,80,000' }];
const HIGH_VALUE_DISPOSALS = [
  { finalValue: '₹18,50,000', reserveValue: '₹16,00,000', variance: '+₹2,50,000', format: 'TENDER' },
  { finalValue: '₹12,40,000', reserveValue: '₹11,80,000', variance: '+₹60,000', format: 'TENDER' },
];
const good = { standing: 'Good standing', standingColor: 'var(--color-success)', standingBg: 'var(--color-success-bg)' };
const review = { standing: 'Under Review', standingColor: 'var(--color-warning)', standingBg: 'var(--color-warning-bg)' };
const delisted = { standing: 'Delisted (fraud)', standingColor: 'var(--color-danger)', standingBg: 'var(--color-danger-bg)' };
const SELLERS = [
  { mobile: '98xxxxxx21', rating: '4.6', sales: 34, complaints: 1, ...good },
  { mobile: '97xxxxxx08', rating: '3.2', sales: 12, complaints: 7, ...review },
  { mobile: '99xxxxxx44', rating: '2.1', sales: 5, complaints: 14, ...delisted },
  { mobile: '96xxxxxx77', rating: '4.9', sales: 61, complaints: 0, ...good },
];
const VERIFICATION_QUEUE = [
  { category: 'Repossessed Excavator', mediaSummary: '6 photos · 1 video · 0 documents' },
  { category: 'Warehouse Racking Lot', mediaSummary: '3 photos · 0 videos · 1 document · 2 still processing' },
];
const UNBILLED_TOTAL = '₹1,84,600';
const LATEST_INVOICE = { number: 'INV-2026-07-0142', total: '₹2,41,900', period: 'Jun 1 – Jun 30, 2026', status: 'Paid' };
const CONSOLE_LINKS = [
  ['Media Waiver Request', '#'], ['Full Market Maker List', '#'], ['API Access', '#'], ['Pending Market Maker Applications', '#'],
];

export default function TenantAdminDashboard() {
  return (
    <div className="ta-page">
      <LightDashboardHeader navItems={NAV_ITEMS} ctas={CTAS} />
      <main className="ta-main">
        <div className="ta-title-row">
          <h1 className="ta-h1">TSX Master — {TENANT_NAME}</h1>
          <span className="ta-tier-badge">{TIER_LABEL}</span>
        </div>
        <p className="ta-sub">Everything awaiting your action across lots, trading sessions, Market Maker standing, and billing on this TradeSphereX.</p>

        <div className="ta-stats">
          <Link to="/lot-approval" className="ta-stat-card"><b>{STATS.pendingListings}</b><span>Lots to Review</span></Link>
          <Link to="/lot-approval" className="ta-stat-card"><b>{STATS.pendingSaleEvents}</b><span>Trading Sessions to Approve</span></Link>
          <Link to="#sellers" className="ta-stat-card"><b className="text-gold">{STATS.pendingSellers}</b><span>Market Maker Applications</span></Link>
          <Link to="#" className="ta-stat-card"><b>{STATS.openDisputes}</b><span>Open Disputes</span></Link>
          <Link to="#disputes" className="ta-stat-card"><b>{STATS.stalledSettlements}</b><span>Stalled Settlements</span></Link>
        </div>

        <section id="pending" className="ta-section">
          <div className="ta-twocol">
            <div>
              <h2 className="ta-h2">Lots Awaiting Approval</h2>
              <div className="ta-table">
                {PENDING_LISTINGS.map((l, i) => (
                  <Link to="/lot-approval" key={i} className="ta-list-row">{l.category} — {l.condition}</Link>
                ))}
              </div>
            </div>
            <div>
              <h2 className="ta-h2">Trading Sessions Awaiting Approval</h2>
              <div className="ta-table">
                {PENDING_SALE_EVENTS.map((se, i) => (
                  <Link to="/lot-approval" key={i} className="ta-list-row">{se.ern} — {se.format}</Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="disputes" className="ta-section">
          <div className="ta-twocol">
            <div>
              <h2 className="ta-h2">Open Disputes</h2>
              <div className="ta-table">
                {OPEN_DISPUTES.map((d, i) => (
                  <Link to="#" key={i} className="ta-list-row">{d.category}</Link>
                ))}
              </div>
            </div>
            <div>
              <h2 className="ta-h2">Stalled Settlements</h2>
              <div className="ta-table">
                {STALLED_SETTLEMENTS.map((s, i) => (
                  <Link to="#" key={i} className="ta-list-row ta-list-row--gold">{s.price}</Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ta-section">
          <h2 className="ta-h2">High-Value Disposal Records (&gt;₹10L)</h2>
          <div className="ta-table">
            {HIGH_VALUE_DISPOSALS.map((d, i) => (
              <Link to="#" key={i} className="ta-disposal-row">
                <span className="ta-disposal-value">{d.finalValue}</span>
                <span className="ta-disposal-meta">RV {d.reserveValue} · Variance {d.variance} · {d.format}</span>
              </Link>
            ))}
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
            {SELLERS.map((s, i) => (
              <Link to="#" key={i} className="ta-seller-row">
                <div>{s.mobile}</div>
                <div>{s.rating}★</div>
                <div>{s.sales}</div>
                <div>{s.complaints}</div>
                <div><span className="ta-badge" style={{ color: s.standingColor, background: s.standingBg }}>{s.standing}</span></div>
              </Link>
            ))}
          </div>
        </section>

        <section className="ta-section">
          <h2 className="ta-h2" style={{ marginBottom: 6 }}>Verification Console</h2>
          <p className="ta-hint">Authentic media catalog + thumbnail for every listing awaiting approval.</p>
          <div className="ta-verify-list">
            {VERIFICATION_QUEUE.map((v, i) => (
              <Link to="#" key={i} className="ta-verify-row">
                <div className="ta-verify-thumb" />
                <div>
                  <p className="ta-verify-cat">{v.category}</p>
                  <p className="ta-verify-summary">{v.mediaSummary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="billing" className="ta-section">
          <h2 className="ta-h2" style={{ marginBottom: 6 }}>Billing</h2>
          <p className="ta-hint">Success fees accrue here and consolidate into one GST-compliant invoice per calendar month.</p>
          <div className="ta-twocol ta-twocol--tight">
            <div className="ta-billing-card">
              <p className="ta-billing-label">Unbilled This Period</p>
              <b className="ta-billing-amount">{UNBILLED_TOTAL}</b>
            </div>
            <div className="ta-billing-card">
              <p className="ta-billing-label">Latest Invoice</p>
              <p className="ta-invoice-line">{LATEST_INVOICE.number} — {LATEST_INVOICE.total}</p>
              <p className="ta-invoice-meta">{LATEST_INVOICE.period} · {LATEST_INVOICE.status}</p>
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
