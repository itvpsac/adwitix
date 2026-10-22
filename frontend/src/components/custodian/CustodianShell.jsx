import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { admin } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { useAuth, initials } from '../../utils/auth.js';
import './CustodianShell.css';

// Custodian Console frame: top bar (home, global search, account) and the
// grouped side navigation. Badges come from GET /admin/decision-queue.
const NAV = [
  { group: 'Overview', items: [
    { label: 'Command Center', to: '/custodian/dashboard', end: true },
    { label: 'Decision Queue', to: '/custodian/decisions', badge: 'total' },
  ] },
  { group: 'Marketplace', items: [
    { label: 'TradeSphereX', to: '/custodian/tenants' },
    { label: 'Lots', to: '/lot-directory' },
    { label: 'Trading Sessions', to: '/trading-session-directory' },
    { label: 'Users', to: '/user-directory' },
  ] },
  { group: 'Risk & Compliance', items: [
    { label: 'AML Monitoring', to: '/aml-monitoring', badge: 'aml' },
    { label: 'Disputes', to: '/dispute-center', badge: 'dispute' },
    { label: 'Chargebacks', to: '/chargeback-handling', badge: 'chargeback' },
    { label: 'Media Waivers', to: '/media-waivers', badge: 'waiver' },
    { label: 'Consent Audit', to: '/consent-audit' },
  ] },
  { group: 'Finance', items: [
    { label: 'Stalled Settlements', to: '/alerts', badge: 'settlement' },
    { label: 'Payout Reviews', to: '/payout-reviews', badge: 'payout' },
    { label: 'Invoices', to: '/invoices' },
    { label: 'Statutory Export', to: '/statutory-export' },
  ] },
  { group: 'Governance', items: [
    { label: 'Rating Reviews', to: '/rating-reviews', badge: 'rating' },
    { label: 'Delist Market Maker', to: '/delist-market-maker' },
    { label: 'Rules & Specifications', to: '/rules-and-specifications' },
    { label: 'Audit Log', to: '/audit-ledger' },
  ] },
];

export default function CustodianShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    admin.decisionQueue()
      .then((res) => { const d = unwrap(res) || {}; setCounts({ ...(d.counts || {}), total: d.total || 0 }); })
      .catch(() => {});
  }, []);

  // "/" focuses the search box, unless typing somewhere already.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (q) navigate(`/user-directory?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="cs">
      <header className="cs-top">
        <button type="button" className="cs-burger" aria-label="Menu" aria-expanded={navOpen} onClick={() => setNavOpen(!navOpen)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <Link to="/custodian/dashboard" className="cs-brand">
          <img src="/adwitix-icon.svg" alt="" width="26" height="26" />
          <span className="cs-brand__name">Adwiti<span>X</span></span>
          <span className="cs-brand__ctx">CUSTODIAN CONSOLE</span>
        </Link>
        <form className="cs-search" role="search" onSubmit={onSearch}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input ref={searchRef} type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users — mobile, name, email, PAN…  ( / )" aria-label="Search users" />
        </form>
        <div className="cs-account">
          <button type="button" className="cs-account__btn" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <span className="cs-avatar">{initials(user?.name || 'Super Admin')}</span>
            <span className="cs-account__name">{user?.name || 'Super Admin'}</span>
          </button>
          {menuOpen && (
            <div className="cs-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); logout(); navigate('/custodian/login', { replace: true }); }}>Log Out</button>
            </div>
          )}
        </div>
      </header>

      <div className="cs-body">
        <nav className={`cs-nav${navOpen ? ' cs-nav--open' : ''}`} aria-label="Custodian Console">
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="cs-nav__group">{g.group}</div>
              {g.items.map((it) => (
                <NavLink key={it.to} to={it.to} end={it.end} onClick={() => setNavOpen(false)}
                  className={({ isActive }) => `cs-nav__link${isActive ? ' cs-nav__link--active' : ''}`}>
                  <span>{it.label}</span>
                  {it.badge && counts[it.badge] > 0 && <span className="cs-badge">{counts[it.badge]}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <main className="cs-main">{children}</main>
      </div>
    </div>
  );
}
