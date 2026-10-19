import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import './BuyerDashboard.css';
import { me, discovery, saleEvents } from '../../api/endpoints.js';
import { unwrap, saveBlob } from '../../api/client.js';

const CTAS = [{ label: 'Profile', to: '/profile' }];
const FORMAT_LABEL = { easy: 'EASY', express: 'EXPRESS', buy_now: 'BUY NOW', tender: 'TENDER' };
const num = (v) => (v == null ? null : Number(v));
const humanize = (v) => (v ? String(v).replace(/_/g, ' ') : '');

// Builds the view model this screen renders from /auth/me,
// /my-buyer-dashboard, /my-purchases and /ticker-feed.
async function loadDashboard() {
  const [profile, dash, purchases, feed] = await Promise.all([
    me.profile().then(unwrap),
    me.buyerDashboard().then(unwrap),
    me.purchases({ per_page: 10 }).then(unwrap).catch(() => ({})),
    discovery.tickerFeed().then(unwrap).catch(() => ({})),
  ]);
  const summary = dash.summary || {};
  return {
    party: profile.party || {},
    stats: {
      activeBids: summary.activeBidsCount, activeOffers: summary.openOffersCount,
      pendingRatings: summary.purchasesToRateCount, favorites: summary.favoriteCount,
    },
    bids: (summary.activeBids || []).map((b) => ({ category: b.category, format: FORMAT_LABEL[b.sale_format], amount: num(b.amount), standing: b.standing })),
    offers: (summary.openOffers || []).map((o) => ({ id: o.id, category: o.category, amount: num(o.amount), status: 'Submitted', canWithdraw: true })),
    purchases: (purchases.purchases || []).map((p) => ({
      date: (p.created_at || '').slice(0, 10), format: FORMAT_LABEL[p.sale_format] || p.sale_format, price: num(p.final_price),
      seller: p.seller_mobile, status: humanize(p.status),
      actionLabel: p.dispute ? 'View Dispute' : (!p.buyer_rated_seller_at ? 'Rate & Settle' : 'View'),
      actionHref: p.dispute ? `/dispute-center?id=${p.dispute.id}` : `/settlement?id=${p.id}`,
    })),
    favorites: [],
    recommendations: (feed.interestMatches || []).map((r) => ({
      listingId: r.listing_id, format: FORMAT_LABEL[r.sale_format], category: r.category, isMatch: true,
      price: num(r.current_price ?? r.expected_value ?? r.reserve_value), bidCount: null,
    })),
    ticker: (feed.ownBids || []).map((t) => ({ listingId: t.listing_id, category: t.category, format: FORMAT_LABEL[t.sale_format], amount: num(t.amount) })),
  };
}

export default function BuyerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const reload = () => loadDashboard().then(setData).catch((err) => setError(err.message || 'Could not load your dashboard.'));
  useEffect(() => { reload(); }, []);

  const withdraw = async (offer) => {
    try {
      await saleEvents.withdrawOffer(offer.id);
      reload();
    } catch (err) {
      setError(err.message || 'Could not withdraw the offer.');
    }
  };
  const exportPurchases = async () => {
    try {
      saveBlob(await me.purchasesExport(), 'my-purchases.csv');
    } catch (err) {
      setError(err.message || 'Export failed.');
    }
  };

  if (!data) return <div>{error || 'Loading...'}</div>;
  const ticker = data.ticker;

  return (
    <div className="bd-page">
      <LightDashboardHeader ctas={CTAS} />

      <aside className="bd-ticker">
        <p className="bd-ticker-title">Live Ticker</p>
        {Array.isArray(ticker) && ticker.map((t, i) => (
          <Link to={`/bidding-room?id=${t.listingId}`} key={i} className="bd-ticker-row">
            <div className="bd-ticker-row-top">{t.category} <span className="bd-ticker-format">{t.format}</span></div>
            <div className="bd-ticker-row-bottom">
              <span className="bd-ticker-amount">₹{t.amount?.toLocaleString('en-IN')}</span>
            </div>
          </Link>
        ))}
      </aside>

      <main className="bd-main">
        <div className="bd-title-row">
          <h1 className="bd-h1">Welcome back, {data.party?.full_name || 'User'}</h1>
          <span className="bd-kyc-badge">{data.party?.kyc_status || 'Unknown'}</span>
        </div>
        <p className="bd-sub">{error || "Here's everything moving on your account right now."}</p>

        <div className="bd-stats">
          <div className="bd-stat-card"><b>{data.stats?.activeBids || 0}</b><span>Active Bids</span></div>
          <div className="bd-stat-card"><b>{data.stats?.activeOffers || 0}</b><span>Open Offers</span></div>
          <div className="bd-stat-card"><b className="text-gold">{data.stats?.pendingRatings || 0}</b><span>Purchases to Rate</span></div>
          <div className="bd-stat-card"><b>{data.stats?.favorites || 0}</b><span>Favorites</span></div>
        </div>

        <section className="bd-section">
          <h2 className="bd-h2">My Bids</h2>
          <div className="bd-table">
            {Array.isArray(data.bids) && data.bids.length > 0 ? (
              data.bids.map((b, i) => (
                <Link to="#" key={i} className="bd-bid-row">
                  <span className="bd-bid-cat">{b.category} <span className="bd-ticker-format">{b.format}</span></span>
                  <span className="bd-bid-right">
                    <span className="bd-bid-amount">₹{b.amount?.toLocaleString('en-IN')}</span>
                    {b.standing && <span className="bd-offer-status">{b.standing.toUpperCase()}</span>}
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState message="No active bids found." />
            )}
          </div>
        </section>

        <section className="bd-section">
          <h2 className="bd-h2">My Offers</h2>
          <div className="bd-table">
            {Array.isArray(data.offers) && data.offers.length > 0 ? (
              data.offers.map((o, i) => (
                <div key={i} className="bd-offer-row">
                  <Link to="#" className="bd-offer-label">{o.category} — ₹{o.amount?.toLocaleString('en-IN')}</Link>
                  <span className="bd-offer-right">
                    <span className="bd-offer-status">{o.status}</span>
                    {o.canWithdraw && <button type="button" onClick={() => withdraw(o)} className="bd-withdraw-btn">Withdraw</button>}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState message="No active offers." />
            )}
          </div>
        </section>

        <section className="bd-section">
          <div className="bd-section-head">
            <h2 className="bd-h2">My Purchases</h2>
            <button type="button" onClick={exportPurchases} className="bd-export-link">Export CSV →</button>
          </div>
          <div className="bd-table">
            <div className="bd-purchase-row bd-purchase-row--head">
              <div>Date</div><div>Format</div><div>Price</div><div>Market Maker</div><div>Status</div><div>Action</div>
            </div>
            {Array.isArray(data.purchases) && data.purchases.length > 0 ? (
              data.purchases.map((p, i) => (
                <div key={i} className="bd-purchase-row">
                  <div className="bd-cell-faint">{p.date}</div>
                  <div className="bd-cell-sm">{p.format}</div>
                  <div className="text-gold-strong">₹{p.price?.toLocaleString('en-IN')}</div>
                  <div className="bd-cell-sm2">{p.seller}</div>
                  <div className="bd-cell-status">{p.status}</div>
                  <div><Link to={p.actionHref || '#'} className="bd-action-link">{p.actionLabel}</Link></div>
                </div>
              ))
            ) : (
              <EmptyState message="No recent purchases." />
            )}
          </div>
        </section>

        <section className="bd-section">
          <h2 className="bd-h2">Favorites</h2>
          <div className="bd-fav-grid">
            {Array.isArray(data.favorites) && data.favorites.length > 0 ? (
              data.favorites.map((f, i) => (
                <Link to="/marketplace" key={i} className="bd-fav-card">
                  <div className="bd-fav-thumb" />
                  <div className="bd-fav-body">
                    <p className="bd-fav-format">{f.format}</p>
                    <p className="bd-fav-cat">{f.category}</p>
                    <p className="bd-fav-price">₹{f.price?.toLocaleString('en-IN')}</p>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState message="No favorites yet." />
            )}
          </div>
        </section>

        <section className="bd-section">
          <h2 className="bd-h2" style={{ marginBottom: 4 }}>Recommended for You</h2>
          <p className="bd-rec-sub">Ranked by your <Link to="/preferences">CAT-LOC-VAL preferences</Link>.</p>
          <div className="bd-rec-grid">
            {Array.isArray(data.recommendations) && data.recommendations.length > 0 ? (
              data.recommendations.map((r, i) => (
                <Link to={r.listingId ? `/lot-detail?id=${r.listingId}` : '/marketplace'} key={i} className="bd-rec-card">
                  <p className="bd-rec-meta">{r.format}{r.bidCount != null ? ` · ${r.bidCount} bids` : ''}</p>
                  <p className="bd-rec-cat">{r.category}</p>
                  <p className="bd-rec-price">₹{r.price?.toLocaleString('en-IN')}</p>
                  {r.isMatch && <span className="bd-match-badge">✓ Matches your preferences</span>}
                </Link>
              ))
            ) : (
              <EmptyState message="No recommendations at this time." />
            )}
          </div>
        </section>

        <section className="bd-account">
          <h3 className="bd-account-title">Account</h3>
          <div className="bd-quick">
            <Link to="/profile" className="bd-quick-link">Profile</Link>
            <Link to="/kyc" className="bd-quick-link">KYC</Link>
            <Link to="/preferences" className="bd-quick-link">Preferences</Link>
            <Link to="/invoices" className="bd-quick-link">Invoices</Link>
            <Link to="/payout-bank" className="bd-quick-link">Payout Bank</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
