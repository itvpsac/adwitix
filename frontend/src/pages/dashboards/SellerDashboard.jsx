import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import './SellerDashboard.css';
import { me } from '../../api/endpoints.js';

const NAV_ITEMS = [
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'Browse', to: '/lot-directory' },
  { label: 'Market Maker Dashboard', to: '/seller/dashboard', active: true },
  { label: 'Trust & Support', to: '/trust-and-support' },
];
const CTAS = [{ label: 'Profile', to: '/profile' }, { label: 'Log Out', to: '/' }];
const PRIMARY_CTA = { label: 'List an Asset', to: '/create-lot' };

export default function SellerDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    me.sellerDashboard().then(setData).catch(console.error);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="sd-page">
      <LightDashboardHeader navItems={NAV_ITEMS} ctas={CTAS} primaryCta={PRIMARY_CTA} />
      <main className="sd-main">
        <div className="sd-title-row">
          <h1 className="sd-h1">Market Maker Dashboard — {data.tenantName}</h1>
          <span className="sd-standing-badge">Standing: {data.standing || 'Unknown'}</span>
        </div>
        <p className="sd-sub">Your standing here reflects activity on {data.tenantName} only.</p>

        <div className="sd-stats">
          <div className="sd-stat-card"><b>{data.stats?.activeListings || 0}</b><span>Active Listings</span></div>
          <div className="sd-stat-card"><b>{data.stats?.pendingApproval || 0}</b><span>Pending Approval</span></div>
          <div className="sd-stat-card"><b className="text-gold">{data.stats?.thisMonthSales || '₹0'}</b><span>Sales This Month</span></div>
          <div className="sd-stat-card"><b>{data.stats?.netEarnings || '₹0'}</b><span>Net Received YTD</span></div>
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
            {Array.isArray(data.listings) && data.listings.length > 0 ? (
              data.listings.map((l, i) => (
                <Link to="#" key={i} className="sd-listing-row">
                  <span><span className="sd-listing-cat">{l.category}</span><span className="sd-listing-format">{l.format}</span></span>
                  <span className="sd-listing-right">
                    <span className="sd-listing-price">₹{l.price?.toLocaleString('en-IN')}</span>
                    <span className="sd-badge">{l.status}</span>
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState message="No active listings." />
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
          <div className="sd-earn-grid">
            <div className="sd-earn-card"><b>{data.stats?.thisMonthSalesCount || 0}</b><span>Sales</span></div>
            <div className="sd-earn-card"><b>₹{data.stats?.thisMonthTotalSales?.toLocaleString('en-IN') || 0}</b><span>Total Sales</span></div>
            <div className="sd-earn-card"><b>₹{data.stats?.thisMonthTotalFees?.toLocaleString('en-IN') || 0}</b><span>Fees Paid</span></div>
            <div className="sd-earn-card"><b>₹{data.stats?.thisMonthTotalTds?.toLocaleString('en-IN') || 0}</b><span>TDS Deducted</span></div>
          </div>
          <p className="sd-eyebrow">Year to Date</p>
          <div className="sd-earn-grid sd-earn-grid--3">
            <div className="sd-earn-card"><b>{data.stats?.ytdSalesCount || 0}</b><span>Sales</span></div>
            <div className="sd-earn-card"><b className="text-gold">₹{data.stats?.ytdNetEarnings?.toLocaleString('en-IN') || 0}</b><span>Net Received (after fees + TDS)</span></div>
            <div className="sd-earn-card"><b>{data.stats?.ytdPendingCount || 0}</b><span>Pending Settlements</span></div>
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
