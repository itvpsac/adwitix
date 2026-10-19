import { useState } from 'react';
import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import { discovery } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import './SavedSearches.css';

// Saved filters / history filters → a /marketplace URL that re-runs them.
const toHref = (filters) => `/marketplace?${new URLSearchParams(filters || {}).toString()}`;
const describe = (filters) => Object.entries(filters || {}).map(([k, v]) => `${k}=${v}`).join('&') || 'All listings';

export default function SavedSearches() {
  const [error, setError] = useState('');
  // GET /my-searches → { searches }, GET /search-history → { history }
  const { data, reload } = useApiQuery(() => discovery.savedSearches(), []);
  const { data: historyData } = useApiQuery(() => discovery.searchHistory(), []);
  const searches = ((data && data.searches) || []).map((sv) => {
    const filters = typeof sv.filters === 'string' ? JSON.parse(sv.filters || '{}') : (sv.filters || {});
    return { id: sv.id, label: sv.label, query: describe(filters), href: toHref(filters) };
  });
  const HISTORY = ((historyData && historyData.history) || []).map((h) => ({ query: describe(h.filtersDecoded), href: toHref(h.filtersDecoded) }));

  const remove = async (sv) => {
    setError('');
    try {
      await discovery.deleteSearch(sv.id);
      reload();
    } catch (err) {
      setError(err.message || 'Could not delete the search.');
    }
  };

  return (
    <div className="ss-page">
      <LightDashboardHeader ctas={[{ label: 'Preferences', to: '/preferences' }, { label: 'Dashboard', to: '/buyer/dashboard' }]} />
      <main className="ss-main">
        <h1 className="ss-title">Saved Searches</h1>
        <p className="ss-sub">Save a filter combination from <a href="/marketplace">Marketplace</a>, then re-run it here anytime.</p>

        <div className="ss-list">
          {searches.map((sv) => (
            <div key={sv.id} className="ss-row">
              <div className="ss-row__body">
                <div className="ss-row__label">{sv.label}</div>
                <div className="ss-row__query">{sv.query}</div>
              </div>
              <div className="ss-row__actions">
                <Link to={sv.href} className="ss-run-btn">Run</Link>
                <button onClick={() => remove(sv)} className="ss-delete-btn">Delete</button>
              </div>
            </div>
          ))}
          {searches.length === 0 && <p className="ss-empty">No saved searches yet.</p>}
          {error && <p className="ss-empty" style={{ color: 'var(--color-danger)' }}>{error}</p>}
        </div>

        <h2 className="ss-history-title">Search History</h2>
        <p className="ss-history-sub">Your last 20 searches on this platform.</p>
        <div className="ss-history-table">
          {HISTORY.map((h, i) => (
            <div key={i} className="ss-history-row">
              <span className="ss-history-query">{h.query}</span>
              <Link to={h.href} className="ss-rerun">Re-run →</Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
