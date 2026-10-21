import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NAV_GROUPS } from '../nav/siteNav.js';
import { useAuth, initials } from '../utils/auth.js';
import { canAccess } from '../utils/accessMatrix.js';
import './AppHeader.css';

const KYC_MAP = {
  verified: { label: 'KYC Verified', color: 'var(--color-success)' },
  pending: { label: 'KYC Pending', color: 'var(--color-warning)' },
  suspended: { label: 'KYC Suspended', color: 'var(--color-danger)' },
};

// The single header used across every page.
// `variant`: 'light' (public / self-service) | 'dark' (internal ops consoles)
// `contextNav`: [{ label, to, active }] — page-specific links shown inline on wide viewports
// `contextLabel`: small console/context label beside the logo
// `ctas` / `primaryCta`: extra action links
// `backTo` / `backLabel`: compact back link for legal & document pages
export default function AppHeader({
  variant = 'light',
  homeTo = '/',
  contextLabel,
  contextNav = [],
  ctas = [],
  primaryCta,
  backTo,
  backLabel,
  maxWidth = '100%',
}) {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const loginPath = pathname.startsWith('/custodian') ? '/custodian/login' : '/onboarding';

  // Clear the session and send the user to the login page.
  const handleLogout = () => {
    logout();
    navigate(loginPath, { replace: true });
  };
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpenMenu(null);
        setAccountOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpenMenu(null); setAccountOpen(false); setMobileOpen(false); }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  const kyc = KYC_MAP[(user && user.kycStatus) || 'verified'] || KYC_MAP.verified;
  // The account's own dashboard: one menu entry, named for Super Admins.
  const isCustodian = !!user && (user.roles?.includes('custodian') || user.entityType === 'custodian' || user.matrixRole === 'custodian');
  const dashboard = !user ? null : isCustodian
    ? { to: '/custodian/dashboard', label: 'Super Admin Dashboard' }
    : {
      to: user.matrixRole === 'tsx_master' || user.entityType === 'tenant_admin' || user.roles?.includes('tenant_admin')
        ? '/tenant-admin/dashboard'
        : (user.matrixRole === 'mkt_maker' || user.entityType === 'corporate' || user.roles?.includes('market_maker')
          ? '/seller/dashboard'
          : '/buyer/dashboard'),
      label: 'My Dashboard',
    };
  const groupActive = (g) => (g.items ? g.items.some((it) => it.to === pathname) : g.to === pathname);
  const resolvedMaxWidth = (!maxWidth || maxWidth === 1240) ? '100%' : (typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth);
  
  const filterNav = (g, user) => {
    if (!g) { console.error("DEBUG: g is undefined in filterNav"); return false; }
    // Check if the user has Seller, Buyer, or Admin role
    const isSeller = user.matrixRole === 'mkt_maker' || user.entityType === 'corporate' || user.roles?.includes('market_maker');
    const isBuyer = user.matrixRole === 'trader' || user.entityType === 'buyer' || user.roles?.includes('buyer');
    const isAdmin = user.matrixRole === 'tsx_master' || user.entityType === 'tenant_admin' || user.roles?.includes('tenant_admin');
    
    const role = isSeller ? 'mkt_maker' : (isAdmin ? 'tsx_master' : (isBuyer ? 'trader' : user.matrixRole));

    // Strict role-based navigation filtering:
    if (g.label === 'Seller' && role !== 'mkt_maker') return false;
    if (g.label === 'Buyer' && (role !== 'trader' || role === 'custodian')) return false;
    if (g.label === 'Admin' && role !== 'tsx_master') return false;
    
    // Explicitly hide Buyer group for custodians
    if (g.label === 'Buyer' && role === 'custodian') return false;

    // Strict check: if it has children, at least one MUST be accessible
    if (g.items && Array.isArray(g.items) && g.items.length > 0) {
      return g.items.some(it => canAccess(role, it.to));
    }
    if (g.sections && Array.isArray(g.sections) && g.sections.length > 0) {
      return g.sections.some(sec => sec.items && Array.isArray(sec.items) && sec.items.some(it => canAccess(role, it.to)));
    }
    // Otherwise, check group base path access
    return canAccess(role, g.to);
  };

  return (
    <header ref={rootRef} className={`ah ah--${variant}`}>
      <div className="ah__inner" style={{ maxWidth: resolvedMaxWidth }}>
        <Link to={homeTo} className="ah__logo" onClick={() => setMobileOpen(false)}>
          <img src="/adwitix-icon.svg" alt="" className="ah__logo-icon" />
          <span className="ah__wordmark">Adwiti<span className="ah__wordmark-accent">X</span></span>
        </Link>
        {contextLabel && <span className="ah__context-label">{contextLabel}</span>}

        <nav className="ah__nav" aria-label="Primary">
          {NAV_GROUPS.filter(g => {
            if (!user) return canAccess('public', g.to);
            return filterNav(g, user);
          }).map((g) => {
            const hasSubmenu = Boolean(g.sections || (g.items && g.items.length > 0));
            if (!hasSubmenu) {
              return (
                <div key={g.label} className="ah__group">
                  <Link
                    to={g.to}
                    className={`ah__group-btn${groupActive(g) ? ' ah__group-btn--active' : ''}`}
                    onClick={() => setOpenMenu(null)}
                  >
                    {g.label}
                  </Link>
                </div>
              );
            }

            const open = openMenu === g.label;
            return (
              <div key={g.label} className="ah__group">
                <button
                  type="button"
                  className={`ah__group-btn${open || groupActive(g) ? ' ah__group-btn--active' : ''}`}
                  aria-expanded={open}
                  onClick={() => setOpenMenu(open ? null : g.label)}
                >
                  {g.label}
                  <span className="ah__caret" aria-hidden="true">▾</span>
                </button>
                {open && (
                  <div className={`ah__menu${g.sections ? ' ah__menu--mega' : ''}`} role="menu">
                    {g.sections ? (
                      <div className="ah__mega-grid">
                        {g.sections.map((sec) => (
                          <div key={sec.category} className="ah__mega-col">
                            <div className="ah__mega-heading">{sec.category}</div>
                            <div className="ah__mega-list">
                              {sec.items.map((it) => (
                                <Link
                                  key={it.to + it.label}
                                  to={it.to}
                                  role="menuitem"
                                  className={`ah__menu-link${pathname === it.to ? ' ah__menu-link--active' : ''}`}
                                >
                                  {it.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      g.items.map((it) => (
                        <Link
                          key={it.to + it.label}
                          to={it.to}
                          role="menuitem"
                          className={`ah__menu-link${pathname === it.to ? ' ah__menu-link--active' : ''}`}
                        >
                          {it.label}
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="ah__right">
          {backTo && <Link to={backTo} className="ah__back">← {backLabel || 'Back'}</Link>}
          {ctas.map((cta) => <Link key={cta.label} to={cta.to} className="ah__cta">{cta.label}</Link>)}
          {primaryCta && <Link to={primaryCta.to} className="ah__cta ah__cta--primary">{primaryCta.label}</Link>}

          {isLoggedIn ? (
            <div className="ah__account-wrap">
              <button type="button" className="ah__account" aria-expanded={accountOpen} onClick={() => setAccountOpen(!accountOpen)}>
                <span className="ah__avatar">{initials(user.name)}</span>
                <span className="ah__account-text">
                  <span className="ah__account-name">{user.name}</span>
                  <span className="ah__account-kyc" style={{ color: kyc.color }}>{kyc.label}</span>
                </span>
              </button>
              {accountOpen && (
                <div className="ah__menu ah__menu--right" role="menu">
                  <Link to="/profile" role="menuitem" className="ah__menu-link">Profile</Link>
                  <Link to={dashboard.to} role="menuitem" className="ah__menu-link">{dashboard.label}</Link>
                  <Link to="/preferences" role="menuitem" className="ah__menu-link">Preferences</Link>
                  <button type="button" role="menuitem" className="ah__menu-link ah__menu-link--danger" onClick={() => { setAccountOpen(false); handleLogout(); }}>Log Out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/onboarding" className="ah__login">Log In</Link>
          )}

          <button
            type="button"
            className={`ah__burger${mobileOpen ? ' ah__burger--open' : ''}`}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="ah__drawer">
          {backTo && (
            <div className="ah__drawer-group">
              <Link to={backTo} className="ah__drawer-back" onClick={() => setMobileOpen(false)}>
                ← {backLabel || 'Back'}
              </Link>
            </div>
          )}
          {(primaryCta || ctas.length > 0) && (
            <div className="ah__drawer-group">
              <div className="ah__drawer-title">Actions</div>
              <div className="ah__drawer-actions">
                {primaryCta && (
                  <Link to={primaryCta.to} className="ah__cta ah__cta--primary ah__drawer-cta" onClick={() => setMobileOpen(false)}>
                    {primaryCta.label}
                  </Link>
                )}
                {ctas.map((cta) => (
                  <Link key={cta.label} to={cta.to} className="ah__cta ah__drawer-cta" onClick={() => setMobileOpen(false)}>
                    {cta.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {NAV_GROUPS.filter(g => {
            if (!user) return canAccess('public', g.to);
            return filterNav(g, user);
          }).map((g) => {
            const hasSubmenu = Boolean(g.sections || (g.items && g.items.length > 0));
            if (!hasSubmenu) {
              return (
                <div key={g.label} className="ah__drawer-group">
                  <div className="ah__drawer-links">
                    <Link
                      to={g.to}
                      className={`ah__drawer-link${pathname === g.to ? ' ah__drawer-link--active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {g.label}
                    </Link>
                  </div>
                </div>
              );
            }
            return (
              <div key={g.label} className="ah__drawer-group">
                <div className="ah__drawer-title">{g.label}</div>
                {g.sections ? (
                  <div className="ah__drawer-subsections">
                    {g.sections.map((sec) => (
                      <div key={sec.category} className="ah__drawer-subsection">
                        <div className="ah__drawer-subtitle">{sec.category}</div>
                        <div className="ah__drawer-links">
                          {sec.items.map((it) => (
                            <Link
                              key={it.to + it.label}
                              to={it.to}
                              className={`ah__drawer-link${pathname === it.to ? ' ah__drawer-link--active' : ''}`}
                              onClick={() => setMobileOpen(false)}
                            >
                              {it.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ah__drawer-links">
                    {g.items.map((it) => (
                      <Link
                        key={it.to + it.label}
                        to={it.to}
                        className={`ah__drawer-link${pathname === it.to ? ' ah__drawer-link--active' : ''}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        {it.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="ah__drawer-foot">
            {isLoggedIn ? (
              <div className="ah__drawer-user">
                <div className="ah__drawer-user-info">
                  <span className="ah__avatar">{initials(user.name)}</span>
                  <div className="ah__account-text">
                    <span className="ah__account-name">{user.name}</span>
                    <span className="ah__account-kyc" style={{ color: kyc.color }}>{kyc.label}</span>
                  </div>
                </div>
                <div className="ah__drawer-account-links">
                  <Link to="/profile" className="ah__drawer-link" onClick={() => setMobileOpen(false)}>Profile</Link>
                  <Link to={dashboard.to} className="ah__drawer-link" onClick={() => setMobileOpen(false)}>{dashboard.label}</Link>
                  <Link to="/preferences" className="ah__drawer-link" onClick={() => setMobileOpen(false)}>Preferences</Link>
                </div>
                <button type="button" className="ah__drawer-logout" onClick={() => { setMobileOpen(false); handleLogout(); }}>Log Out</button>
              </div>
            ) : (
              <Link to="/onboarding" className="ah__drawer-login" onClick={() => setMobileOpen(false)}>Log In</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
