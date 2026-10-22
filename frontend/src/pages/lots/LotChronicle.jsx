import './LotChronicle.css';
import { Link } from 'react-router-dom';
import AppHeader from '../../components/AppHeader.jsx';

// No Lot-level chronicle exists on the backend yet: ChronicleController
// only serves the per-settlement Trading Session Chronicle
// (GET /api/v1/app/chronicles/:id, rendered at /ax-chronicle?id=…), and no
// endpoint returns a Lot's full lifecycle timeline. Rather than show sample
// events, this page says so and points to the real per-session record.

export default function LotChronicle() {
  return (
    <div className="lc-page">
      <AppHeader variant="light" contextNav={[{ label: "Lot Chronicle", to: "/lot-chronicle", active: true }, { label: "AX Chronicle", to: "/ax-chronicle" }]} />
      <main className="lc-main">
        <div className="legal-eyebrow">AX Chronicle</div>
        <h1 className="lc-title">Lot Chronicle</h1>
        <p className="lc-sub">The complete, date/time-stamped record of this Lot's life — from Inventory to every Trading Session attempt to final settlement — with the user responsible for each action.</p>

        <div className="lc-summary">
          <div>
            <h3>Not available yet</h3>
            <span className="lc-summary__meta">A full Lot Chronicle (every stage from Inventory through each Trading Session to settlement) isn't available yet. Each completed sale already has its certified Trading Session Chronicle — open it from the settlement in <Link to="/seller/dashboard">My Sales</Link>.</span>
          </div>
        </div>

        <div className="lc-locked">
          <div>
            <span className="lc-locked__phase">Phase 2 · Requires AI Key</span>
            <h3>AX Intelligence</h3>
            <p>AI-authored narrative summaries, cross-Lot/Asset/Case rollups, and recommendations — built on top of this Chronicle once an AI key is connected.</p>
          </div>
          <span className="lc-locked__badge">🔒 Locked</span>
        </div>
      </main>
    </div>
  );
}
