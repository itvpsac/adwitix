import { useState, useMemo } from 'react';
import PublicMiniHeader from '../../components/PublicMiniHeader.jsx';
import './Terminology.css';

const TERMS = [
  { term: 'Baton-Pass (Cascading Default)', def: "What happens when a winning Trader doesn't pay: the win passes to the next-highest Trader at their own price, within their own time window. This can happen up to three times before a Trading Session is cancelled outright.", related: ['Forfeiture', 'H1 / H2 / H3'] },
  { term: 'Bid Ceiling (150% Rule)', def: 'A safety limit stopping any single bid from jumping more than 150% above the current price — catches typing mistakes and blocks deliberate price manipulation.', related: [] },
  { term: 'Buy-Now', def: "A sale format where Traders make offers and the Market Maker personally chooses who to sell to, considering price and the Trader's rating — not necessarily the highest offer.", related: ['Express Auction', 'Easy Auction'] },
  { term: 'CAT-LOC-VAL', def: 'Short for Category-Location-Value — the set of preferences that personalises which Lots and alerts you see.', related: ['Live Ticker'] },
  { term: 'Certified by Seller (CBS)', def: 'A Lot where the Market Maker has taken their own photos, by any method. Real, unedited photos of the actual item are required — stock or generated images are never allowed. Contrast with Verified Lot.', related: ['Verified Lot', 'Standing Review'] },
  { term: 'Crawl-Back', def: 'A recovery path for a Trader whose rating has dropped significantly — temporarily limited to smaller purchases until a set number of clean transactions restores their standing.', related: ['Star Rating', 'Shadow Banning'] },
  { term: 'Dispute Resolution', def: 'The formal process for resolving a disagreement about a specific Trading Session — filed by a Trader or Market Maker, reviewed with evidence from both sides, and decided with a stated reason.', related: ['Grievance Redressal', 'Standing Review'] },
  { term: 'Dynamic Time (Anti-Sniping)', def: "A rule that extends a Trading Session by a short period whenever a bid lands in the closing minutes, so a last-second bid can't unfairly end it before others can respond.", related: [] },
  { term: 'Easy Auction', def: 'A scheduled auction with a real inspection window (set by the Market Maker, 24 hours to 7 days) before bidding opens. The Market Maker can choose whether results close instantly or need their approval.', related: ['Buy-Now', 'Express Auction'] },
  { term: 'EMD (Security Deposit)', def: "The refundable deposit — 10% of the item's value — a Trader must pledge before placing a bid or offer. Returned automatically unless they win and then fail to pay.", related: ['Forfeiture', 'Money Points (PC)'] },
  { term: 'EV (Expected Value)', def: "The price a Market Maker states as their target/asking figure in a Buy-Now Lot. Traders may offer above or below it — it's a reference point, not a hard limit.", related: ['Reserve Value (RV)', 'Buy-Now'] },
  { term: 'Express Auction', def: 'The fastest sale format — no inspection window at all. The Trading Session only starts once exactly 3 Traders have pledged a deposit, then runs for about an hour.', related: ['Easy Auction', 'Buy-Now'] },
  { term: 'Forfeiture', def: "The loss of a Trader's deposit after winning a Trading Session and then failing to complete payment. In most cases the money goes to the Market Maker as compensation; in a full cascading default, it doesn't.", related: ['EMD (Security Deposit)', 'Baton-Pass (Cascading Default)'] },
  { term: 'Grievance Redressal', def: 'The process for raising a broader concern about the platform itself — separate from a dispute about one specific Trading Session.', related: ['Dispute Resolution'] },
  { term: 'H1 / H2 / H3', def: 'Shorthand for the highest, second-highest, and third-highest bidder in a Trading Session at the moment it closes. If H1 defaults, the win passes to H2, then H3.', related: ['Baton-Pass (Cascading Default)'] },
  { term: 'KYC', def: 'Know Your Customer — the identity verification every user completes before transacting, using documents like PAN and Aadhaar (individuals) or company registration details (businesses).', related: [] },
  { term: 'Live Ticker', def: 'The real-time scrolling feed showing your account balance, the status of your active bids, and new Lots matching your interests.', related: ['CAT-LOC-VAL'] },
  { term: 'Money Points (PC)', def: "The platform's internal representation of deposited funds — always equal in value to what you deposited (1:1), held as a distinct amount tied to each specific bid, not one shared spendable balance.", related: ['EMD (Security Deposit)'] },
  { term: 'NOC (No Objection Certificate)', def: 'A digital confirmation both sides must submit before a deal is considered closed — the Market Maker confirms they were paid, the Trader confirms they received the goods.', related: ['Settlement'] },
  { term: 'Payment Gateway Charge', def: 'A processing fee some payment methods (like cards) carry, added on top of your deposit so the full deposit amount still reaches escrow untouched.', related: ['EMD (Security Deposit)'] },
  { term: 'Related Auctions', def: 'Multiple Lots that share a common origin (e.g., items from the same site) shown together on one screen for convenience — while each one remains a fully separate, independent sale.', related: [] },
  { term: 'Reserve Value (RV)', def: "The confidential floor price a Market Maker sets for an Easy or Express Auction. The item won't sell for less than this, and it's what a Trader's deposit is calculated against.", related: ['EV (Expected Value)', 'Easy Auction'] },
  { term: 'Custodian (SaaS Admin)', def: 'The platform\'s top-level administrator, who oversees the whole system but never personally trades, lists, or has any visibility into a live Trading Session while it\'s happening.', related: ['TSX Master'] },
  { term: 'Market Maker Rating (sellerStarRating)', def: 'Your reputation score specifically as a Market Maker — separate from your Trader rating, even if you do both.', related: ['Star Rating'] },
  { term: 'Settlement', def: 'The final stage of a completed sale: the Trader pays the Market Maker directly, both confirm their side (NOC), both rate each other, and any remaining deposit is refunded.', related: ['NOC (No Objection Certificate)'] },
  { term: 'Shadow Banning', def: 'A gradual reduction in visibility (fewer alerts, less promotion) for an account with a persistently poor rating — not a full block, just reduced platform support.', related: ['Crawl-Back', 'Star Rating'] },
  { term: 'Standing Review', def: "A periodic, big-picture check on a Market Maker's overall conduct — triggered either once a year, or sooner if enough complaints build up.", related: ['Certified by Seller (CBS)', 'Dispute Resolution'] },
  { term: 'Star Rating', def: 'Your reputation score, starting at 3 out of 5, that rises with clean, on-time transactions and falls with defaults or disputes. Traders and Market Makers each have their own, separate score.', related: ['Market Maker Rating (sellerStarRating)', 'Crawl-Back'] },
  { term: 'TradeSphereX (TSX) / Shop', def: 'An individual storefront operating on ADWITIX under its own branding — could be a bank, an institution, or the platform\'s own general marketplace.', related: ['TSX Master'] },
  { term: 'TSX Master', def: 'The person a TradeSphereX has authorised to approve Lots, set local terms, and manage Market Makers on that specific storefront.', related: ['TradeSphereX (TSX) / Shop', 'Custodian (SaaS Admin)'] },
  { term: 'Tender Auction', def: "A fully private, invite-only sale format where the Market Maker personally controls who can participate and on what terms — available only through the platform's own operated shop.", related: ['Buy-Now'] },
  { term: 'Verified Lot', def: "A Lot where ADWITIX's own inspection team has visited the item and taken the photos themselves. Contrast with Certified by Seller.", related: ['Certified by Seller (CBS)'] },
];

export default function Terminology() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => (q ? TERMS.filter((t) => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q)) : TERMS), [q]);
  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((t) => {
      const letter = t.term[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter).push(t);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);
  const alphabet = useMemo(() => [...new Set(TERMS.map((t) => t.term[0].toUpperCase()))].sort(), []);

  return (
    <div className="tm-page">
      <PublicMiniHeader />
      <main className="tm-main">
        <div className="legal-eyebrow">Trust &amp; Support</div>
        <h1 className="tm-title">Terminology</h1>
        <p className="tm-desc">Plain-language definitions for every ADWITIX-specific term you'll come across as a Trader or Market Maker.</p>

        <input className="tm-search" placeholder="Search a term — EMD, Crawl-Back, Verified, Forfeiture..." value={query} onChange={(e) => setQuery(e.target.value)} />

        <div className="tm-alpha">
          {alphabet.map((c) => <a key={c} className="tm-letter" href={`#letter-${c}`}>{c}</a>)}
        </div>

        <div className="tm-count">{filtered.length} {filtered.length === 1 ? 'term' : 'terms'}</div>

        {groups.length === 0 && <div className="tm-empty">No terms match "{query}".</div>}

        {groups.map(([letter, terms]) => (
          <section key={letter} id={`letter-${letter}`} className="tm-group">
            <div className="tm-group__letter">{letter}</div>
            <div className="tm-group__list">
              {terms.map((t) => (
                <div key={t.term} className="tm-card">
                  <h3>{t.term}</h3>
                  <p>{t.def}</p>
                  {t.related.length > 0 && (
                    <div className="tm-related">
                      <span>SEE ALSO:</span>
                      {t.related.map((r) => <span key={r} className="tm-related__chip">{r}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
      <footer className="tm-footer"><p>Still not sure about a term? Check our <a href="/faq">FAQ</a>, or reach out through <a href="/trust-and-support">Contact Us</a>.</p></footer>
    </div>
  );
}
