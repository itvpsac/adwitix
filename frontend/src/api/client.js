// Low-level HTTP client for the CI4 backend (psinghalnoida/ebid.oreo).
//
// Response conventions taken from the CI4 controllers:
//   • success → 2xx with a plain JSON object (no envelope)
//   • failure → 4xx/5xx with { error, error_description }
//   • CSV exports → raw text/csv body with Content-Disposition
//
// Auth is a user-scoped JWT sent as `Authorization: Bearer <token>`
// (app/Filters/JwtAuthFilter.php). Logout is client-side only — the
// backend has no /logout route; we simply discard the token.

const RAW_BASE = '';
export const API_BASE = RAW_BASE.replace(/\/+$/, '');

const TOKEN_KEY = 'adwitix_jwt';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(status, code, description, payload) {
    super(description || code || `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.description = description;
    this.payload = payload;
  }
  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }
}

const UNAUTHORIZED_EVENT = 'adwitix-unauthorized';

export function onUnauthorized(handler) {
  window.addEventListener(UNAUTHORIZED_EVENT, handler);
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
}

function buildUrl(path, query) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, v);
  });
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request(method, path, { body, query, auth = true, raw = false, signal } = {}) {
  const headers = {};
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (body instanceof FormData) {
    payload = body; // let the browser set the multipart boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(buildUrl(path, query), { method, headers, body: payload, signal });

  if (res.status === 401 && auth) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (raw) {
    if (!res.ok) throw new ApiError(res.status, 'request_failed', `Export failed (${res.status})`, null);
    return res.blob();
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
  }

  if (!res.ok) {
    if (res.status >= 500) {
      if (path === '/api/v1/app/listings' && method === 'POST') {
        console.error("DEBUG: 500 Listing Creation Failure", {
          path,
          method,
          headers,
          payload: body
        });
      } else {
        console.error(`API Request Failed: ${method} ${path}`, { status: res.status, data, text });
      }
    }
    // 429s come from the hosting layer's rate limiter, not the app, and
    // carry no envelope.
    if (res.status === 429) {
      throw new ApiError(429, 'rate_limited', 'Too many requests — please wait a minute and try again.', data);
    }
    // Errors arrive in the envelope as { status: false, message, data: { error } }.
    const inner = (data && data.data) || {};
    throw new ApiError(res.status, inner.error || (data && data.error) || 'request_failed', (data && data.error_description) || (data && data.message) || null, data);
  }
  return data;
}

// The backend wraps every response as { status, message, data }; returns
// the inner data (or the response itself if it isn't wrapped).
export function unwrap(res) {
  if (res && typeof res === 'object' && 'status' in res && 'data' in res) return res.data || {};
  return res || {};
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  // CSV/PDF exports: fetch with the Bearer header, hand back a Blob.
  download: (path, opts) => request('GET', path, { ...opts, raw: true }),
};

// Triggers a browser save for a Blob returned by api.download().
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
