import './TenderStakeholderView.css';
import AppHeader from '../../components/AppHeader.jsx';

const LISTING = { category: 'Industrial Equipment', ern: 'ERN-20260731-3381', title: 'Repossessed Excavator, CAT 320D' };
const BIDS = [
  { seq: 1, amount: '₹16,10,000', at: '2026-07-29 11:04' },
  { seq: 2, amount: '₹16,45,000', at: '2026-07-29 14:22' },
  { seq: 3, amount: '₹17,00,000', at: '2026-07-30 09:47' },
  { seq: 4, amount: '₹17,20,000', at: '2026-07-31 08:15' },
];

export default function TenderStakeholderView() {
  return (
    <div className="tsv-page">
      <AppHeader variant="light" contextLabel="Stakeholder View — No Login" />
      <main className="tsv-main">
        <div className="legal-eyebrow">{LISTING.category} · ERN {LISTING.ern}</div>
        <h1 className="tsv-title">{LISTING.title}</h1>

        <div className="tsv-notice">This is a shared, read-only view for interested parties. In keeping with Tender confidentiality, <strong>no bidder identity is ever shown here</strong> — only bid amounts, in sequence.</div>

        <h2 className="tsv-h2">Bid History — Amounts Only</h2>
        <div className="tsv-card">
          <div className="tsv-table-head"><div>#</div><div>Bid Amount</div><div>Placed</div></div>
          {BIDS.map((b) => (
            <div key={b.seq} className="tsv-table-row">
              <div className="tsv-cell-faint-mono">{b.seq}</div>
              <div className="tsv-cell-strong-mono">{b.amount}</div>
              <div className="tsv-cell-faint">{b.at}</div>
            </div>
          ))}
        </div>

        <p className="tsv-footer-note">Shared by the Concierge team managing this Tender. This link carries no login and identifies no bidders — per BR-21.</p>
      </main>
    </div>
  );
}
