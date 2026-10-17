import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import './SellerDashboard.css';
import { me } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { formatCurrency } from '../../utils/format.js';

const NAV_ITEMS = [
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'Browse', to: '/lot-directory' },
  { label: 'Market Maker Dashboard', to: '/seller/dashboard', active: true },
  { label: 'Trust & Support', to: '/trust-and-support' },
];
const CTAS = [{ label: 'Profile', to: '/profile' }];
const PRIMARY_CTA = { label: 'List an Asset', to: '/create-lot' };

// Data: GET /my-seller-dashboard (DashboardService::sellerSummary) for
// sales/settlement counts, and GET /my-listings for the seller's lots;
// the per-status lot counts are taken from the lot list so they work
// even before the backend returns pendingApprovalCount/inventoryCount.
const FORMAT_LABELS = { easy: 'EASY', express: 'EXPRESS', buy_now: 'BUY-NOW', tender: 'TENDER' };
const humanize = (v) => (v ? String(v).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '');

export default function SellerDashboard() {
  const [summary, setSummary] = useState(null);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([me.sellerDashboard(), me.listings()])
      .then(([dash, mine]) => {
        setSummary(unwrap(dash).summary || {});
        // my-listings LEFT JOINs sale_event, so a lot with several
        // trading sessions comes back more than once.
        const seen = new Set();
        setListings((unwrap(mine).listings || []).filter((l) => (seen.has(l.id) ? false : seen.add(l.id))));
      })
      .catch((err) => setError(err.status === 401 ? 'Please log in to view your dashboard.' : (err.message || 'Could not load your dashboard.')));
  }, []);

  if (error || !summary) {
    return (
      <div className="sd-page">
        <LightDashboardHeader navItems={NAV_ITEMS} ctas={CTAS} primaryCta={PRIMARY_CTA} />
        <main className="sd-main"><h1 className="sd-h1">Market Maker Dashboard</h1><p className="sd-sub">{error || 'Loading dashboard…'}</p></main>
      </div>
    );
  }

  const countStatus = (status) => listings.filter((l) => l.status === status).length;
  const data = {
    payoutAccount: summary.payoutBankSet ? 'Payout bank account on file' : null,
    payoutPending: summary.payoutBankPending,
    stats: {
      activeListings: listings.length ? countStatus('active') : summary.activeListingsCount,
      pendingApproval: listings.length ? countStatus('pending_approval') : summary.pendingApprovalCount,
      inventory: listings.length ? countStatus('inventory') : summary.inventoryCount,
      thisMonthSalesCount: summary.salesThisMonthCount || 0,
      thisMonthTotalSales: summary.salesThisMonthTotal || 0,
      ytdSalesCount: summary.salesYtdCount || 0,
      ytdTotalSales: summary.salesYtdTotal || 0,
      pendingSettlements: summary.pendingSettlementsCount || 0,
    },
  };

  return (
    <div className="sd-page">
      <LightDashboardHeader navItems={NAV_ITEMS} ctas={CTAS} primaryCta={PRIMARY_CTA} />
      <main className="sd-main">
        <div className="sd-title-row">
          <h1 className="sd-h1">Market Maker Dashboard</h1>
        </div>
        <p className="sd-sub">Your lots, sales and settlements at a glance.</p>

        <div className="sd-stats">
          <div className="sd-stat-card"><b>{data.stats.activeListings || 0}</b><span>Active Listings</span></div>
          <div className="sd-stat-card"><b>{data.stats.pendingApproval || 0}</b><span>Pending Approval</span></div>
          <div className="sd-stat-card"><b>{data.stats.inventory || 0}</b><span>In Inventory</span></div>
          <div className="sd-stat-card"><b className="text-gold">{formatCurrency(data.stats.thisMonthTotalSales)}</b><span>Sales This Month</span></div>
          <div className="sd-stat-card"><b>{data.stats.pendingSettlements}</b><span>Pending Settlements</span></div>
        </div>

        <section className="sd-section">
          <div className="sd-section-head">
            <h2 className="sd-h2">My Lots</h2>
            <div className="sd-head-links">
              <Link to="/lot-reach-and-interest" className="sd-pill-link">Lot Reach & Interest</Link>
              <Link to="/create-lot" className="sd-pill-link">+ Create Lot</Link>
            </div>
          </div>
          <div className="sd-table">
            {listings.length > 0 ? (
              listings.map((l) => (
                <Link to={`/lot-detail?id=${l.id}`} key={l.id} className="sd-listing-row">
                  <span><span className="sd-listing-cat">{humanize(l.category)}{l.subcategory ? ` — ${l.subcategory}` : ''}</span>{l.sale_format && <span className="sd-listing-format">{FORMAT_LABELS[l.sale_format] || l.sale_format}</span>}</span>
                  <span className="sd-listing-right">
                    {(l.current_price || l.reserve_value) && <span className="sd-listing-price">{formatCurrency(l.current_price || l.reserve_value)}</span>}
                    <span className="sd-badge">{humanize(l.status)}</span>
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState message="No lots yet." />
            )}
          </div>
        </section>

        <section className="sd-section">
          <div className="sd-section-head">
            <h2 className="sd-h2">My Sales</h2>
            <Link to="#" className="sd-export-link">Export CSV →</Link>
          </div>
          <div className="sd-table">
            <div className="sd-sales-row sd-sales-row--head">
              <div>Date</div><div>Format</div><div>Price</div><div>Fee</div><div>TDS</div><div>Trader</div><div>Status</div><div>Chronicle</div>
            </div>
            {Array.isArray(data.sales) && data.sales.length > 0 ? (
              data.sales.map((s, i) => (
                <div key={i} className="sd-sales-row">
                  <div className="sd-cell-faint">{s.date}</div>
                  <div className="sd-cell-sm">{s.format}</div>
                  <div className="sd-cell-gold">₹{s.price?.toLocaleString('en-IN')}</div>
                  <div className="sd-cell-sm">₹{s.fee?.toLocaleString('en-IN')}</div>
                  <div className="sd-cell-sm">₹{s.tds?.toLocaleString('en-IN')}</div>
                  <div className="sd-cell-buyer">{s.buyer}</div>
                  <div><Link to="#" className="sd-status-link">{s.status}</Link></div>
                  <div><Link to="#" className="sd-action-link">View →</Link></div>
                </div>
              ))
            ) : (
              <EmptyState message="No sales recorded." />
            )}
          </div>
        </section>

        <section className="sd-section">
          <h2 className="sd-h2">Earnings Summary</h2>
          <p className="sd-eyebrow">This Month</p>
          <div className="sd-earn-grid sd-earn-grid--3">
            <div className="sd-earn-card"><b>{data.stats.thisMonthSalesCount}</b><span>Sales</span></div>
            <div className="sd-earn-card"><b>{formatCurrency(data.stats.thisMonthTotalSales)}</b><span>Total Sales</span></div>
            <div className="sd-earn-card"><b>{data.stats.pendingSettlements}</b><span>Pending Settlements</span></div>
          </div>
          <p className="sd-eyebrow">Year to Date</p>
          <div className="sd-earn-grid sd-earn-grid--3">
            <div className="sd-earn-card"><b>{data.stats.ytdSalesCount}</b><span>Sales</span></div>
            <div className="sd-earn-card"><b className="text-gold">{formatCurrency(data.stats.ytdTotalSales)}</b><span>Total Sales</span></div>
            <div className="sd-earn-card"><b>{data.stats.pendingSettlements}</b><span>Pending Settlements</span></div>
          </div>
        </section>

        <section className="sd-section">
          <h2 className="sd-h2">Payout Account</h2>
          <div className="sd-payout-card">
            <div>
              <p className="sd-payout-account">{data.payoutAccount || 'Not set'}</p>
              {data.payoutPending && <p className="sd-payout-note">A change is pending — activates {data.payoutActivatesAt}.</p>}
            </div>
            <Link to="#" className="sd-pill-link">Manage Payout Bank</Link>
          </div>
        </section>

        <section className="sd-section sd-section--tight">
          <h2 className="sd-h2">My Applications — Other TradeSphereX</h2>
          <div className="sd-table">
            {Array.isArray(data.applications) && data.applications.length > 0 ? (
              data.applications.map((a, i) => (
                <div key={i} className="sd-app-row">
                  <span>{a.tenantName}</span>
                  <span className="sd-badge">{a.status}</span>
                </div>
              ))
            ) : (
              <EmptyState message="No pending applications." />
            )}
          </div>
        </section>

        <section className="sd-account">
          <h3 className="sd-account-title">Account</h3>
          <div className="sd-quick">
            <Link to="/profile" className="sd-quick-link">Profile</Link>
            <Link to="/kyc" className="sd-quick-link">KYC</Link>
            <Link to="/invoices" className="sd-quick-link">Invoices</Link>
            <Link to="/payout-bank" className="sd-quick-link">Payout Bank</Link>
            <Link to="/apply-to-sell" className="sd-quick-link">Apply to Sell Elsewhere</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
