import { useState, useMemo } from 'react';
import PublicMiniHeader from '../../components/PublicMiniHeader.jsx';
import './FAQ.css';

const CATEGORIES = [
  { id: 'start', label: 'Getting Started', items: [
    { code: 'GS-01', q: 'How do I create an account?', buyer: "Enter your mobile number and verify it with an OTP. Once verified, set a 4-digit mPIN — you'll use your number and mPIN to log in from then on.", seller: 'Same first step — every account starts as a Trader account. To list items, you then apply to a specific TradeSphereX and get approved by that TSX Master.' },
    { code: 'GS-02', q: 'What documents do I need to verify my account?', buyer: 'Individuals: name, PAN, Aadhaar, date of birth, occupation. Businesses: company registration details (CIN, GST, PAN) and supporting documents. Verification is reviewed by a person, not an automated system.', seller: 'Same requirements as a Trader, since every Market Maker account is a Trader account first. Your TSX may also ask for category-specific documents.' },
    { code: 'GS-03', q: 'How do I become a Market Maker?', buyer: "Apply to sell through a specific TradeSphereX's storefront. Approval is scoped to that one TSX — approval on one doesn't carry over to another.", seller: 'You apply, the TSX Master reviews your request, and once approved you can start listing on that storefront. You can apply to multiple TSXs independently.' },
  ]},
  { id: 'money', label: 'Deposits & Balance', items: [
    { code: 'DB-01', q: 'What is the EMD and why do I need one?', buyer: "To bid or make an offer, you pledge 10% of the item's value upfront. It shows you're serious and stops people placing bids they never intend to honour.", seller: "Market Makers only — Traders never pay a deposit to list or sell. This is what protects you from a winner walking away." },
    { code: 'DB-02', q: 'How do I add money to my account balance?', buyer: 'Transfer funds by bank transfer and upload the receipt. Once verified, the equivalent balance credits to your account for bidding anywhere on the platform.', seller: "Not applicable — Market Makers don't need a balance to list items." },
    { code: 'DB-03', q: "Do I get my deposit back if I don't win?", buyer: "Yes. As soon as you're outbid or not selected, your deposit is released back to your balance immediately.", seller: 'Not applicable, since you never post a deposit.' },
    { code: 'DB-04', q: 'Can my deposit be forfeited?', buyer: 'Yes — if you win and then fail to pay, your deposit is forfeited in full. This is treated seriously and affects your rating.', seller: "If a Trader defaults after winning your Lot, their forfeited deposit generally passes to you as compensation, after the TSX's and platform's fee is taken out." },
    { code: 'DB-05', q: 'Do I pay extra if my payment method charges a fee?', buyer: 'Yes — a card processing charge is added on top of your deposit and shown clearly before you pay. Bank transfer or UPI usually carries little to no such charge.', seller: 'Not applicable to you, since you never pay a deposit.' },
  ]},
  { id: 'formats', label: 'Sale Formats', items: [
    { code: 'SF-01', q: "What's the difference between Buy-Now, Express, Easy, and Tender?", buyer: 'Buy-Now: you offer and the Market Maker picks who to sell to. Express: fast, starts once 3 Traders join, closes within the hour. Easy: scheduled with a proper inspection window. Tender: fully private, invite-only, run directly by the Market Maker.', seller: 'Buy-Now lets you personally choose the best offer. Express gets you a fast sale once enough interest builds. Easy gives Traders time to inspect. Tender gives you complete control over participation.' },
    { code: 'SF-02', q: 'Can I inspect an item before bidding?', buyer: 'Depends on the format. Easy Auctions give a proper inspection window (24 hours to 7 days). Express Auctions skip inspection — you bid on the listing photos and description alone.', seller: 'For Easy Auctions, you choose the inspection window (24 hours to 7 days). Express Auctions skip inspection entirely, in exchange for a much faster sale.' },
    { code: 'SF-03', q: 'In Buy-Now, does the highest offer always win?', buyer: "Not necessarily. The Market Maker can choose a lower offer from a Trader they trust more (based on your rating). If they do, they're required to record why.", seller: "Yes — you're not locked into the highest number. You can factor in reliability. If you pick someone other than the top offer, you'll need to state a reason, kept on record." },
    { code: 'SF-04', q: "If Express has no inspection, how do I know what I'm bidding on?", buyer: 'Every Express Lot includes a mandatory checklist the Market Maker fills out declaring known damage or missing parts. A false disclosure is treated as a genuine dispute.', seller: "You're required to complete a defect-disclosure checklist before your Express Lot goes live. Answering it falsely can result in a dispute against you." },
  ]},
  { id: 'winning', label: 'Winning & Payment', items: [
    { code: 'WP-01', q: 'I won a Trading Session — what happens next?', buyer: 'If the final price is higher than your original deposit covered, you may need to top up first. Then you pay the Market Maker directly (offline) and arrange collection.', seller: 'Once a winner is confirmed, you deal with the Trader directly for payment and handover — the platform never holds the full sale amount, only the deposit.' },
    { code: 'WP-02', q: "What happens if the winning bidder doesn't pay?", buyer: 'If you win and don\'t pay within the required window, you forfeit your deposit and the win passes to the next-highest bidder.', seller: 'Non-paying winners are automatically replaced by the next-highest bidder. If every bidder fails to pay, the Trading Session is cancelled and you\'ll need to relist.' },
    { code: 'WP-03', q: 'Can I lose my win to someone else?', buyer: 'No — once confirmed as winner and you pay on time, the sale is yours. You only lose a win by failing to pay in time.', seller: "No — once a Trader completes payment on time, you can't reassign the sale." },
  ]},
  { id: 'ratings', label: 'Ratings & Trust', items: [
    { code: 'RT-01', q: 'How does the Star Rating system work?', buyer: 'You have your own Trader rating, separate from any Market Maker rating. Everyone starts at 3 stars. Paying promptly and completing deals cleanly raises it; defaulting or late payment lowers it.', seller: 'You have your own Market Maker rating, entirely separate from your Trader rating. Accurate listings and fast handovers raise it; mismatched descriptions or delays lower it.' },
    { code: 'RT-02', q: 'Can my rating recover after a bad mark?', buyer: 'Yes. If your rating drops significantly, you enter Crawl-Back — temporarily limited to smaller-value purchases until a set number of clean transactions restores you.', seller: 'Yes, the same recovery path applies — a run of clean, accurate listings restores your standing over time.' },
    { code: 'RT-03', q: 'What happens if my rating gets very low?', buyer: 'Very low-rated accounts are shown less (Shadow Banning) rather than blocked outright. You can still use the platform, just with less visibility.', seller: 'The same applies to your listings — a very low rating means your items stop being actively promoted, though still technically listed.' },
  ]},
  { id: 'settlement', label: 'Settlement & Handover', items: [
    { code: 'ST-01', q: 'How do I actually pay or receive payment?', buyer: 'You pay the Market Maker directly — offline — for 100% of the sale value. The platform only ever holds your deposit.', seller: "You're paid directly by the Trader, in full, outside the platform. Once received, you confirm it to move the deal toward closure." },
    { code: 'ST-02', q: 'What is an NOC and why do both sides need to file one?', buyer: 'You confirm receipt of goods, and the Market Maker confirms receipt of payment. A deal only closes once both confirm.', seller: 'You confirm receipt of payment, and the Trader confirms receipt of goods. Both are required before the deal closes and any remaining deposit is released.' },
    { code: 'ST-03', q: "What if the other party won't confirm?", buyer: "If the Market Maker goes silent, you're sent a reminder, then a TSX Master steps in to review the facts and unstick the deal.", seller: 'The same reminder-then-admin-review process applies if a Trader goes silent on confirming or rating you.' },
    { code: 'ST-04', q: 'Do I get an invoice for fees paid?', buyer: 'Yes — once a deal closes, an invoice covering the Success Fee (plus tax) is generated automatically.', seller: "Yes — an invoice is generated for the TSX's commission share, accessible against the transaction record." },
    { code: 'ST-05', q: 'Why do I have to confirm something specific right before I pledge a deposit?', buyer: "That acknowledgment spells out exactly what happens if you don't follow through on this specific bid — so you know the real consequence before committing.", seller: "This doesn't apply to you directly since you never pledge a deposit — but the same idea protects you too." },
  ]},
  { id: 'disputes', label: 'Disputes', items: [
    { code: 'DP-01', q: "What if the item doesn't match the listing?", buyer: "For scheduled auctions, you're expected to inspect beforehand, so ordinary condition complaints after winning aren't valid. Genuine fraud or material misrepresentation can still be disputed.", seller: "Traders waive routine condition complaints once they've had an inspection opportunity — but genuine misrepresentation can still be disputed, so accurate listings matter." },
    { code: 'DP-02', q: 'How do I file a dispute?', buyer: 'Raise it against the specific Trading Session, choose the fitting category, and submit evidence within the filing window.', seller: 'Same process — file against the transaction, select a category, submit evidence. Both sides get an equal window to respond.' },
    { code: 'DP-03', q: 'Who decides the outcome of a dispute?', buyer: 'Most disputes are reviewed by the TSX Master; disputes about Trader conduct go to Custodian-level review. Every decision comes with a stated reason and one appeal.', seller: "Same structure applies — disputes about your conduct are typically reviewed by the TSX Master, with a documented reason and one appeal right." },
  ]},
  { id: 'listings', label: 'Listings & Shipping', items: [
    { code: 'LS-01', q: 'Can items be grouped and browsed together?', buyer: 'Yes — Lots sharing a common origin are tagged and shown together on one screen, even though each is still its own independent sale.', seller: 'You can tag multiple related Lots as a group so Traders see them together, while each still sells completely independently.' },
    { code: 'LS-02', q: 'What are the photo and video requirements for a Lot?', buyer: 'Every Lot needs real photos of the actual item — never stock images. Photos and video are automatically optimised for fast loading.', seller: 'You need at least 5 real photos (up to 50), with one as the main photo. Video is optional, up to 2 minutes, compressed automatically after upload.' },
    { code: 'LS-03', q: 'Does the Market Maker have to arrange shipping?', buyer: 'No — shipping is always optional. You can always self-collect at no extra cost.', seller: "You can offer shipping if you want, but it's never required — Traders can always self-collect instead." },
  ]},
  { id: 'safeguards', label: 'Platform Safeguards', items: [
    { code: 'PS-01', q: 'Is there a limit on how much a bid can jump?', buyer: 'Yes — no bid can be more than 150% of the current highest bid, catching typing mistakes before they cause real problems.', seller: 'The same limit protects your Trading Session from being disrupted by an obviously mistaken or malicious bid.' },
    { code: 'PS-02', q: 'How does the platform stop last-second sniping?', buyer: 'A bid landing in the final 10 minutes extends the Trading Session by 2 more minutes, giving everyone a fair chance to respond.', seller: "The same rule protects your sale from closing on an artificially timed last-second bid." },
    { code: 'PS-03', q: 'How does the platform prevent fake or misleading photos?', buyer: 'Photos are captured through the app itself at the moment of listing, with location and time data attached — not uploaded from an old gallery.', seller: 'This in-app capture requirement protects you too — clear evidence the photos are genuinely of your item.' },
  ]},
];

export default function FAQ() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [open, setOpen] = useState({});
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    return CATEGORIES
      .filter((c) => activeCategory === 'all' || activeCategory === c.id)
      .map((c) => ({ ...c, items: c.items.filter((it) => !q || (it.q + ' ' + it.buyer + ' ' + it.seller).toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [q, activeCategory]);
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="faq-page">
      <PublicMiniHeader />
      <main className="faq-main">
        <div className="legal-eyebrow">Trust &amp; Support</div>
        <h1 className="faq-title">Frequently Asked Questions</h1>
        <p className="faq-desc">Every topic is explained twice — once for Traders, once for Market Makers — so you only read the half that applies to you.</p>

        <input className="faq-search" placeholder="Search topics — deposits, ratings, disputes, shipping..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="faq-chips">
          {[{ id: 'all', label: 'All topics' }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.label }))].map((c) => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`faq-chip${activeCategory === c.id ? ' faq-chip--active' : ''}`}>{c.label}</button>
          ))}
        </div>

        <div className="faq-count">{total} {total === 1 ? 'entry indexed' : 'entries indexed'}</div>
        {groups.length === 0 && <div className="faq-empty">No topics match "{query}".</div>}

        {groups.map((grp) => (
          <section key={grp.id} className="faq-group">
            <h2><span className="faq-dot" />{grp.label}</h2>
            <div className="faq-list">
              {grp.items.map((item) => {
                const isOpen = !!open[item.code];
                return (
                  <div key={item.code} className="faq-item">
                    <button className="faq-item__q" onClick={() => setOpen({ ...open, [item.code]: !isOpen })}>
                      <span className="faq-item__code">{item.code}</span>
                      <span className="faq-item__text">{item.q}</span>
                      <span className="faq-item__icon">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="faq-split">
                        <div className="faq-split__buyer"><div>FOR TRADERS</div><p>{item.buyer}</p></div>
                        <div className="faq-split__seller"><div>FOR MARKET MAKERS</div><p>{item.seller}</p></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
      <footer className="faq-footer"><p>Can't find what you're looking for? Reach out through <a href="/trust-and-support">Contact Us</a>.</p></footer>
    </div>
  );
}
