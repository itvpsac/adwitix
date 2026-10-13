import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import { me } from '../../api/endpoints.js';
import './Profile.css';


const KYC_MAP = {
  verified: { label: 'Verified', color: 'var(--color-success)', bg: 'var(--color-success-bg)', hint: 'Your identity is fully verified. No action needed.' },
  pending: { label: 'Pending', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', hint: "Your dossier is with your TSX Master for review — usually 1–2 business days." },
  suspended: { label: 'Suspended', color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', hint: 'A compliance flag needs your attention before you can bid or list again.' },
};

const PROFILE_LINKS = [
  { title: 'Personal Details', subtitle: 'Name, mobile, email', href: '/profile' }, // Assuming current page is personal details placeholder
  { title: 'Preferences', subtitle: 'Categories, notifications', href: '/preferences' },
  { title: 'Invoices', subtitle: 'GST invoices & receipts', href: '/invoices' },
  { title: 'Change mPIN', subtitle: 'Update login PIN via OTP', href: '/change-mpin' },
  { title: 'Delete Account', subtitle: '30-day grace period', href: '/delete-account' },
  { title: 'Saved Searches', subtitle: 'Filters saved from Marketplace', href: '/saved-searches' },
  { title: 'Payout Bank', subtitle: 'Bank account for settlements', href: '/payout-bank' },
  { title: 'Rating History', subtitle: 'Trader★ / Market Maker★ ledger', href: '/rating-history' },
  { title: 'Activity Log', subtitle: 'Sessions, device & location', href: '/activity-log' },
  { title: 'Buyer Dashboard', subtitle: 'Bids, offers, purchases', href: '/buyer/dashboard' },
  { title: 'Market Maker Dashboard', subtitle: 'Lots, sales, earnings', href: '/seller/dashboard' },
];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    me.profile()
      .then((res) => {
        const data = res.data || res;
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch profile', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="pf-page">Loading...</div>;
  if (!profile) return <div className="pf-page">Failed to load profile.</div>;

  const party = profile.party || profile;
  const userInitials = (party.full_name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const kyc = KYC_MAP[party.kyc_status] || KYC_MAP.verified;

  // Filter links based on role (derived from entity_type or roles in API response)
  const isTrader = party.roles?.includes('trader') || party.entity_type === 'individual';
  const isMarketMaker = party.roles?.includes('market_maker') || party.entity_type === 'corporate';

  const visibleLinks = PROFILE_LINKS.filter(link => {
    if (link.title === 'Buyer Dashboard') return isTrader;
    if (link.title === 'Market Maker Dashboard') return isMarketMaker;
    if (link.title === 'Saved Searches') return isTrader;
    if (link.title === 'Payout Bank') return isMarketMaker;
    return true;
  });

  return (
    <div className="pf-page">
      <LightDashboardHeader />
      <main className="pf-main">
        <div className="pf-identity">
          <div className="pf-avatar">{userInitials}</div>
          <div>
            <h1 className="pf-name">{party.full_name}</h1>
            <p className="pf-meta">
              {party.mobile_number} · {party.email} · {party.entity_type} · Member since {new Date(party.created_at || Date.now()).getFullYear()}
            </p>
          </div>
        </div>

        <Link to="#" className="pf-kyc-card">
          <div className="pf-kyc-row">
            <div>
              <p className="pf-kyc-eyebrow">Identity Verification</p>
              <div className="pf-kyc-title-row">
                <span className="pf-kyc-title">KYC Compliance</span>
                <span className="pf-kyc-badge" style={{ color: kyc.color, background: kyc.bg }}>{kyc.label}</span>
              </div>
              <p className="pf-kyc-hint">{kyc.hint}</p>
            </div>
            <span className="pf-kyc-arrow">→</span>
          </div>
        </Link>

        <div className="pf-grid">
          {visibleLinks.map((l) => (
            <Link to={l.href} key={l.title} className="pf-link-card">
              <p className="pf-link-title">{l.title}</p>
              <p className="pf-link-subtitle">{l.subtitle}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
