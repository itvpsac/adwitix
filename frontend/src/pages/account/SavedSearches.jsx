import { useState } from 'react';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import './SavedSearches.css';

const INITIAL_SEARCHES = [
  { label: 'Industrial machinery under ₹5L', query: 'category=Industrial+Machinery&maxValue=500000' },
  { label: 'Vehicles — Easy Auctions near Delhi', query: 'category=Vehicles&format=EASY&loc=Delhi&radius=100' },
];
const HISTORY = [
  { query: 'category=Heavy+Equipment&format=TENDER' },
  { query: 'category=Office+IT+Assets&maxValue=100000' },
  { query: 'format=BUYNOW&loc=Mumbai' },
  { query: 'category=Fleet+Vehicles' },
];

export default function SavedSearches() {
  const [searches, setSearches] = useState(INITIAL_SEARCHES);

  return (
    <div className="ss-page">
      <LightDashboardHeader ctas={[{ label: 'Preferences', to: '/preferences' }, { label: 'Dashboard', to: '/buyer/dashboard' }]} />
      <main className="ss-main">
        <h1 className="ss-title">Saved Searches</h1>
        <p className="ss-sub">Save a filter combination from <a href="/marketplace">Marketplace</a>, then re-run it here anytime.</p>

        <div className="ss-list">
          {searches.map((sv, i) => (
            <div key={i} className="ss-row">
              <div className="ss-row__body">
                <div className="ss-row__label">{sv.label}</div>
                <div className="ss-row__query">{sv.query}</div>
              </div>
              <div className="ss-row__actions">
                <a href="/marketplace" className="ss-run-btn">Run</a>
                <button onClick={() => setSearches(searches.filter((_, si) => si !== i))} className="ss-delete-btn">Delete</button>
              </div>
            </div>
          ))}
          {searches.length === 0 && <p className="ss-empty">No saved searches yet.</p>}
        </div>

        <h2 className="ss-history-title">Search History</h2>
        <p className="ss-history-sub">Your last 20 searches on this platform.</p>
        <div className="ss-history-table">
          {HISTORY.map((h, i) => (
            <div key={i} className="ss-history-row">
              <span className="ss-history-query">{h.query}</span>
              <a href="/marketplace" className="ss-rerun">Re-run →</a>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
