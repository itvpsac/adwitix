import './TenderAuctionReport.css';
import AppHeader from '../../components/AppHeader.jsx';

const LOT = { title: 'Repossessed Excavator, CAT 320D', ern: 'ERN-20260731-3381', closedAt: '2026-07-31', awardee: 'Priyanka Suresh Holdings' };
const PARTICIPANTS = [
  { name: 'Ramesh Agarwal', source: 'Registered Interest' },
  { name: 'Priyanka Suresh Holdings', source: 'Directly Added' },
  { name: 'Suresh Auto Traders', source: 'Registered Interest' },
];
const BIDS = [
  { name: 'Ramesh Agarwal', amount: '₹16,10,000', at: '2026-07-29 11:04' },
  { name: 'Suresh Auto Traders', amount: '₹16,45,000', at: '2026-07-29 14:22' },
  { name: 'Ramesh Agarwal', amount: '₹17,20,000', at: '2026-07-31 08:15' },
  { name: 'Priyanka Suresh Holdings', amount: '₹16,45,000', at: '2026-07-30 09:47' },
];
const EMD = [
  { name: 'Ramesh Agarwal', amount: '₹1,85,000', ref: 'UTR2607290912' },
  { name: 'Priyanka Suresh Holdings', amount: '₹1,64,500', ref: 'UTR2607291455' },
];
const ROUNDS = [
  { n: 1, candidate: 'Ramesh Agarwal (H1, ₹17,20,000)', outcome: 'Rejected', outcomeBg: 'var(--color-danger-bg)', outcomeColor: 'var(--color-danger)', note: 'Failed to confirm within the review window — cascaded to H2 per BR-12.' },
  { n: 2, candidate: 'Priyanka Suresh Holdings (H2, ₹16,45,000)', outcome: 'Awarded', outcomeBg: 'var(--color-success-bg)', outcomeColor: 'var(--color-success)', note: 'Confirmed and awarded by Concierge Vikram Chauhan.' },
];

export default function TenderAuctionReport() {
  return (
    <div className="tar-page">
      <AppHeader variant="dark" contextLabel="Tender" backTo="/tender-concierge-console" backLabel="Concierge Console" />
      <main className="tar-main">
        <div className="legal-eyebrow">Tender Auction Report</div>
        <h1 className="tar-title">{LOT.title}</h1>
        <p className="tar-sub">{LOT.ern} · Closed {LOT.closedAt} · Awarded to {LOT.awardee}</p>

        <section className="tar-section">
          <h2 className="tar-h2">1 · Eligible Participants ({PARTICIPANTS.length})</h2>
          <div className="tar-card">
            {PARTICIPANTS.map((p, i) => (
              <div key={i} className="tar-simple-row"><span className="tar-simple-row__name">{p.name}</span><span className="tar-simple-row__mono">{p.source}</span></div>
            ))}
          </div>
        </section>

        <section className="tar-section">
          <h2 className="tar-h2">2 · Bid History ({BIDS.length})</h2>
          <div className="tar-card">
            <div className="tar-table-head tar-cols3"><div>Bidder</div><div>Amount</div><div>Placed</div></div>
            {BIDS.map((b, i) => (
              <div key={i} className="tar-table-row tar-cols3">
                <div className="tar-cell-strong">{b.name}</div>
                <div className="tar-cell-mono-strong">{b.amount}</div>
                <div className="tar-cell-faint">{b.at}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="tar-section">
          <h2 className="tar-h2">3 · EMD Log ({EMD.length})</h2>
          <div className="tar-card">
            {EMD.map((e, i) => (
              <div key={i} className="tar-simple-row"><span className="tar-simple-row__name">{e.name}</span><span className="tar-simple-row__mono">{e.amount} · {e.ref}</span></div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="tar-h2">4 · Review Rounds ({ROUNDS.length})</h2>
          <div className="tar-rounds">
            {ROUNDS.map((r) => (
              <div key={r.n} className="tar-round-card">
                <div className="tar-round-card__head">
                  <span className="tar-round-card__title">Round {r.n} — {r.candidate}</span>
                  <span className="tar-round-outcome" style={{ background: r.outcomeBg, color: r.outcomeColor }}>{r.outcome}</span>
                </div>
                <p className="tar-round-note">{r.note}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
