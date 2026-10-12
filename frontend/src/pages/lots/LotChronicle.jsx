import './LotChronicle.css';
import AppHeader from '../../components/AppHeader.jsx';

const LOT = { lotId: 'LOT-2026-0851', title: 'Repossessed Excavator', category: 'Construction Equipment', condition: 'Used', currentStage: 'Settled & Closed' };
const EVENTS = [
  { label: 'Lot Presented', detail: 'Entered Inventory by the Market Maker.', timestamp: '2026-06-02 10:14 UTC', actor: 'R. Mehta (Seller)', dotColor: '#9A9FB5' },
  { label: 'Approved', detail: 'Listing reviewed and approved.', timestamp: '2026-06-03 09:02 UTC', actor: 'A. Khanna (Tenant Admin)', dotColor: '#9A9FB5' },
  { label: 'Published — Upcoming', detail: 'Visible to matched Buyers.', timestamp: '2026-06-03 09:05 UTC', actor: 'System', dotColor: '#9A9FB5' },
  { label: 'Trading Session 1 — Easy Auction', detail: 'Closed after 3 days with no qualifying bids.', badge: 'Cycle Ended Unsold', badgeColor: '#9C5B1F', badgeBg: '#FBF2E2', timestamp: '2026-06-10 18:00 UTC', actor: 'System', dotColor: '#C9974C', link: '#' },
  { label: 'Relisted — Upcoming', detail: 'New Sale-System assigned, re-entered from Upcoming.', timestamp: '2026-06-11 08:30 UTC', actor: 'R. Mehta (Seller)', dotColor: '#9A9FB5' },
  { label: 'Trading Session 2 — Tender', detail: 'Closed with winning offer accepted.', badge: 'Sold ₹18,50,000', badgeColor: '#3F7A4E', badgeBg: '#E4EFE6', timestamp: '2026-06-22 17:00 UTC', actor: 'System', dotColor: '#C9974C', link: '#' },
  { label: 'Seller NOC Confirmed', timestamp: '2026-06-23 11:12 UTC', actor: 'R. Mehta (Seller)', dotColor: '#9A9FB5' },
  { label: 'Buyer NOC Confirmed', timestamp: '2026-06-23 11:40 UTC', actor: 'S. Iyer (Buyer)', dotColor: '#9A9FB5' },
  { label: 'Shipping Dispatched', detail: 'Carrier: BlueDart Freight · AWB 88213410', timestamp: '2026-06-25 14:05 UTC', actor: 'R. Mehta (Seller)', dotColor: '#9A9FB5' },
  { label: 'Delivery Confirmed', timestamp: '2026-06-28 16:22 UTC', actor: 'S. Iyer (Buyer)', dotColor: '#9A9FB5' },
  { label: 'Buyer Payment Received', detail: '₹18,50,000 settled to escrow.', timestamp: '2026-06-23 12:00 UTC', actor: 'System', dotColor: '#9A9FB5' },
  { label: 'TDS Deducted', detail: '₹1,85,000 (10%).', timestamp: '2026-06-23 12:01 UTC', actor: 'System', dotColor: '#9A9FB5' },
  { label: 'Platform Success Fee Charged', detail: '₹37,000.', timestamp: '2026-06-23 12:01 UTC', actor: 'System', dotColor: '#9A9FB5' },
  { label: 'Seller Payout Released', detail: '₹16,28,000 to registered bank account.', timestamp: '2026-06-29 10:00 UTC', actor: 'System', dotColor: '#9A9FB5' },
  { label: 'Invoice Generated', detail: 'Tax invoice INV-2026-04471 issued to both parties.', timestamp: '2026-06-29 10:01 UTC', actor: 'System', dotColor: '#3F7A4E' },
];

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
            <span className="lc-summary__id">{LOT.lotId}</span>
            <h3>{LOT.title}</h3>
            <span className="lc-summary__meta">{LOT.category} · {LOT.condition} · Currently: <b>{LOT.currentStage}</b></span>
          </div>
          <button className="lc-download" onClick={(e) => e.preventDefault()}>Download Full Chronicle (PDF)</button>
        </div>

        <div className="lc-timeline">
          {EVENTS.map((ev, i) => (
            <div key={i} className="lc-event">
              <div className="lc-event__rail">
                <div className="lc-event__dot" style={{ background: ev.dotColor }} />
                {i < EVENTS.length - 1 && <div className="lc-event__line" />}
              </div>
              <div className="lc-event__body">
                <div className="lc-event__head">
                  <span className="lc-event__label">{ev.label}</span>
                  {ev.badge && <span className="lc-event__badge" style={{ color: ev.badgeColor, background: ev.badgeBg }}>{ev.badge}</span>}
                </div>
                {ev.detail && <p className="lc-event__detail">{ev.detail}</p>}
                <span className="lc-event__ts">{ev.timestamp} · {ev.actor}</span>
                {ev.link && <span> · <a href={ev.link} className="lc-event__link">View Session Chronicle →</a></span>}
              </div>
            </div>
          ))}
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
