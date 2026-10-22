import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import { me } from '../../api/endpoints.js';
import './Profile.css';


const KYC_MAP = {
  verified: { label: 'Verified', color: 'var(--color-success)', bg: 'var(--color-success-bg)', hint: 'Your identity is fully verified. No action needed.' },
  pending: { label: 'Pending', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', hint: "Your dossier is with your TSX Master for review — usually 1–2 business days." },
  submitted: { label: 'Submitted', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', hint: 'Your KYC dossier has been submitted and is awaiting review.' },
  suspended: { label: 'Suspended', color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', hint: 'A compliance flag needs your attention before you can bid or list again.' },
};

const PROFILE_LINKS = [
  { title: 'Preferences', subtitle: 'Categories, notifications', href: '/preferences' },
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
  const [error, setError] = useState('');

  useEffect(() => {
    me.profile()
      .then((res) => {
        const data = res.data || res;
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Could not load your profile.');
        setLoading(false);
      });
  }, []);

  if (loading || !profile) {
    return (
      <div className="pf-page">
        <LightDashboardHeader />
        <main className="pf-main"><p className="pf-meta" style={error ? { color: 'var(--color-danger)' } : undefined}>{loading ? 'Loading…' : (error || 'Could not load your profile.')}</p></main>
      </div>
    );
  }

  const party = profile.party || profile;
  const userInitials = (party.full_name || party.mobile_number || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const kyc = KYC_MAP[party.kyc_status] || { label: party.kyc_status || 'Unknown', color: 'var(--color-text-faint)', bg: 'transparent', hint: 'Open KYC to see your verification status.' };

  // party_role values are 'buyer' (granted at registration) and 'seller'
  // (granted on an approved Market Maker application).
  const isTrader = !!party.roles?.includes('buyer');
  const isMarketMaker = !!party.roles?.includes('seller');

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
            <h1 className="pf-name">{party.full_name || party.mobile_number}</h1>
            <p className="pf-meta">
              {[party.mobile_number, party.email, party.entity_type, party.created_at ? `Member since ${new Date(String(party.created_at).replace(' ', 'T')).getFullYear()}` : null].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        <Link to="/kyc" className="pf-kyc-card">
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
