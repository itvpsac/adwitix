import { useEffect, useState } from 'react';
import { getToken, setToken, onUnauthorized } from '../api/client.js';
import { auth as authApi } from '../api/endpoints.js';

// Auth state backed by the CI4 JWT. The token is the source of truth;
// the cached party record is a convenience for header rendering and is
// refreshed from GET /api/v1/app/auth/me on load.
const USER_KEY = 'adwitix_auth';
const EVENT = 'adwitix-auth-change';

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

export function readAuth() {
  if (!getToken()) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.name ? parsed : null;
  } catch (e) {
    return null;
  }
}

// Normalizes the backend's `party` shape into what the header renders.
export function partyToUser(party) {
  if (!party) return null;
  return {
    id: party.id,
    name: party.full_name || party.mobile_number || 'Account',
    mobile: party.mobile_number || '',
    email: party.email || party.recovery_email || '',
    entityType: party.entity_type ? party.entity_type.toLowerCase().replace(' ', '_') : null,
    roles: Array.isArray(party.roles) ? party.roles.map(r => r.toLowerCase()) : [],
    matrixRole: (party.roles?.includes('custodian') || party.roles?.includes('super_admin') || party.entity_type === 'custodian') ? 'custodian' :
                (party.roles?.includes('tenant_admin') || party.entity_type === 'tenant_admin') ? 'tsx_master' :
                (party.roles?.includes('market_maker') || party.entity_type === 'corporate' || party.entity_type === 'seller' || party.roles?.includes('seller')) ? 'mkt_maker' : 
                (party.roles?.includes('buyer') || party.entity_type === 'buyer' || party.entity_type === 'trader' || party.roles?.includes('trader')) ? 'trader' : 'trader',
    kycStatus: (party.kyc_status || 'pending').toLowerCase(),
    adminTenants: Array.isArray(party.admin_tenants) ? party.admin_tenants : [],
    // BR-51(d), D-137: documents to (re-)accept before further use.
    pendingAcceptances: Array.isArray(party.pendingAcceptances) ? party.pendingAcceptances : [],
  };
}

// Persists the session from any endpoint that returns { access_token, party }.
// `roles` fills in party.roles when the login response omits them (the
// Custodian login endpoints only succeed for super_admin but don't say so).
export function establishSession(result, { roles } = {}) {
  if (!result) return null;
  if (result.access_token) setToken(result.access_token);
  const party = result.party && roles && !result.party.roles ? { ...result.party, roles } : result.party;
  const user = partyToUser(party) || readAuth();
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  emit();
  return user;
}

// Kept for screens that log in without hitting the API (demo/offline).
export function loginUser(user) {
  const value = {
    name: (user && user.name) || 'Account',
    kycStatus: (user && user.kycStatus) || 'pending',
    mobile: (user && user.mobile) || '',
  };
  localStorage.setItem(USER_KEY, JSON.stringify(value));
  if (!getToken()) setToken('local-session');
  emit();
  return value;
}

export function logoutUser() {
  // JWT logout is client-side only — the backend has no /logout route.
  setToken(null);
  localStorage.removeItem(USER_KEY);
  emit();
}

// Custodian (Super Admin) accounts: their landing page is the Custodian
// Dashboard, not the public site.
export function isCustodian(user) {
  return !!user && (user.roles?.includes('custodian') || user.entityType === 'custodian' || user.matrixRole === 'custodian');
}

export function useAuth() {
  const [user, setUser] = useState(readAuth);

  useEffect(() => {
    const sync = () => setUser(readAuth());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    const offUnauthorized = onUnauthorized(() => { logoutUser(); });
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
      offUnauthorized();
    };
  }, []);

  // Refresh the cached party from the server once per mount when a real
  // token is present, so a stale name/KYC status self-corrects.
  useEffect(() => {
    const token = getToken();
    if (!token || token === 'local-session') return;
    // Always refresh to ensure matrixRole is up-to-date and populated
    authApi.me()
      .then((res) => {
        const fresh = partyToUser((res && (res.data || res)).party);
        if (fresh) { localStorage.setItem(USER_KEY, JSON.stringify(fresh)); emit(); }
      })
      .catch((err) => { 
        console.log("DEBUG: Caught error in auth/me:", err);
        
        // Check for ApiError properties or generic error message indicators
        const status = err.status || (err.response && err.response.status);
        const message = (err.message || "").toLowerCase();
        
        // If we get an auth-related error, or if network failed entirely, log out.
        // A network failure on a protected route usually means invalid session/CORS issues.
        if (status === 401 || status === 403 || message.includes("401") || message.includes("unauthorized")) {
          logoutUser();
        } else {
          console.error("Error fetching auth/me:", err); 
        }
      });
  }, []);

  return { user, isLoggedIn: !!user, login: loginUser, logout: logoutUser, establishSession };
}

export function initials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// Merge fields into the cached signed-in user (e.g. after accepting the
// updated Terms) and let every useAuth() consumer re-render.
export function patchStoredUser(patch) {
  const current = readAuth();
  if (!current) return;
  localStorage.setItem(USER_KEY, JSON.stringify({ ...current, ...patch }));
  emit();
}
