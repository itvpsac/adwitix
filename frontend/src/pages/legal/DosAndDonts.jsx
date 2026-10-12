import PublicMiniHeader from '../../components/PublicMiniHeader.jsx';
import './DosAndDonts.css';

const CHIPS = [
  ['getting-started', 'Getting Started'], ['bidding', 'Bidding & EMD'], ['buying', 'Buying'], ['selling', 'Selling'],
  ['settlement', 'Payments & Settlement'], ['ratings', 'Star Ratings'], ['disputes', 'Disputes'], ['security', 'Account Security'], ['shipping', 'Shipping'],
];

const SECTIONS = [
  { id: 'getting-started', title: '1. Getting Started', rows: [
    ['Register with your own genuine mobile number and complete KYC honestly and fully.', "Create multiple accounts, or register using someone else's details."],
    ['Keep your 4-digit mPIN private, and treat it like a banking PIN.', 'Share your mPIN or OTP with anyone — not even someone claiming to be ADWITIX support.'],
    ['Apply to a specific TradeSphereX if you want to sell, and wait for approval.', 'Assume selling approval on one TSX lets you sell on another.'],
    ['Read the terms shown before you accept them, especially around a specific bid or deposit.', 'Click through consent screens without reading — they describe real, binding commitments.'],
  ]},
  { id: 'bidding', title: '2. Bidding & Deposits (EMD)', rows: [
    ['Only bid or offer on items you genuinely intend to buy if you win.', 'Bid casually or "just to see" — every bid pledges real money and carries real consequences.'],
    ["Check your available balance before bidding, so you're not caught short on a required top-up.", 'Assume you can back out painlessly after winning — a default forfeits your deposit.'],
    ['Read the specific forfeiture terms shown before you pledge a deposit.', "Ignore the acknowledgment shown before each pledge — it states exactly what you're agreeing to for that bid."],
    ['Use bank transfer or UPI where possible for depositing funds.', 'Rely on a card payment if a bank-transfer option is available and convenient.'],
  ]},
  { id: 'buying', title: '3. Buying', rows: [
    ['Inspect the item during the window provided, for formats that offer one (Easy Auctions, Buy-Now).', 'Expect an inspection window on Express Auctions — that format is sight-unseen by design.'],
    ["Review a Market Maker's rating and listing details carefully before committing.", 'Assume the highest bid always wins in Buy-Now — the Market Maker can choose based on reliability, not just price.'],
    ['Raise a genuine concern about fraud or major misrepresentation promptly.', "Dispute an item's general condition after winning if you had a fair chance to inspect it first."],
    ['Complete payment within the required window if you win.', 'Delay payment or go silent after winning — non-payment forfeits your deposit and damages your rating.'],
  ]},
  { id: 'selling', title: '4. Selling', rows: [
    ['Upload real, current photographs of the actual item, taken through the app.', 'Use stock photos, old images, or photos of a different (even similar) item.'],
    ['Describe the item\'s condition accurately, including known flaws.', 'Overstate condition or omit known defects — this can trigger a dispute and a rating penalty, even sight-unseen on Express.'],
    ['Set your Reserve Value at a realistic, defensible level.', 'Set an unrealistically low Reserve Value hoping to profit from bidder defaults — full-cascade failures pay Market Makers nothing.'],
    ["Respond promptly to Trader questions and to your TSX's review process.", 'Ignore listing rejection feedback — check the stated reason and correct it before resubmitting.'],
  ]},
  { id: 'settlement', title: '5. Payments & Settlement', rows: [
    ['Pay/collect the full sale amount directly and promptly once a deal is won.', 'Try to negotiate a different amount or route the payment outside what was agreed on the listing.'],
    ['Confirm receipt (goods or funds) as soon as it genuinely happens.', "Delay confirming receipt — this holds up the other party's refund and can trigger an admin review of you."],
    ['Rate the other party honestly and promptly once the deal is done.', 'Skip or ignore the rating step — both sides rating each other is required to close the deal.'],
  ]},
  { id: 'ratings', title: '6. Star Ratings & Reputation', rows: [
    ['Build your rating through consistent, honest, on-time transactions.', 'Expect a single good transaction to erase a pattern of poor ones.'],
    ['Take a rating drop seriously and use the Crawl-Back path available to you.', 'Assume a low rating is permanent — a defined run of clean transactions restores standing over time.'],
    ['Remember your Trader★ and Market Maker★ are separate — build both deliberately if you do both.', 'Assume being a great Market Maker automatically makes you look trustworthy as a Trader, or vice versa.'],
  ]},
  { id: 'disputes', title: '7. Disputes & Problems', rows: [
    ['File a dispute promptly, within the stated window, with real supporting evidence.', 'Wait past the filing window and then expect a dispute to still be accepted.'],
    ['Choose the dispute category that genuinely matches your situation.', 'File repeated, weak, or baseless disputes — this pattern is tracked and can itself count against you.'],
    ["Accept a ruling's stated reasoning, or use the appeal path if you genuinely disagree.", 'Assume every ruling can be appealed indefinitely — most rulings allow exactly one appeal.'],
  ]},
  { id: 'security', title: '8. Account & Payment Security', rows: [
    ['Verify your identity again if asked, especially before a payout bank change.', "Be surprised by a short waiting period after changing your payout account — it's a fraud-prevention step."],
    ['Report any suspicious account activity immediately.', 'Reuse your ADWITIX mPIN as a password anywhere else.'],
    ['Expect a payment-method charge to be shown clearly before you pay, if one applies.', 'Assume every payment method costs the same — bank transfer/UPI is usually cheaper and faster.'],
  ]},
  { id: 'shipping', title: '9. Shipping & Handover', rows: [
    ['Agree on collection or shipping terms clearly before the deal proceeds.', 'Assume shipping is included by default — self-collection is the baseline unless otherwise agreed.'],
    ['Keep records (photos, messages, receipts) of the handover.', 'Rely on memory alone if a dispute becomes possible — evidence submitted within the window is what a ruling is based on.'],
  ]},
];

export default function DosAndDonts() {
  return (
    <div className="dd-page">
      <PublicMiniHeader />
      <main className="dd-main">
        <div className="legal-eyebrow">Trust &amp; Support</div>
        <h1 className="dd-title">Dos &amp; Don'ts</h1>
        <p className="dd-desc">A practical guide for Traders and Market Makers. Everything here reflects ADWITIX's actual rules — when in doubt, the safer choice is almost always the one on the left.</p>

        <div className="dd-chips">
          {CHIPS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </div>

        {SECTIONS.map((sec) => (
          <section key={sec.id} id={sec.id} className="dd-section">
            <h2>{sec.title}</h2>
            <div className="dd-table">
              <div className="dd-row dd-row--head"><div className="dd-do">✓ DO</div><div className="dd-dont">✗ DON'T</div></div>
              {sec.rows.map(([doText, dontText], i) => (
                <div key={i} className="dd-row">
                  <div className="dd-cell dd-cell--do"><span className="dd-icon">✓</span><span>{doText}</span></div>
                  <div className="dd-cell dd-cell--dont"><span className="dd-icon">✗</span><span>{dontText}</span></div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
      <footer className="dd-footer"><p>See also our <a href="/faq">FAQ</a> and <a href="/terms-of-usage">Terms of Usage</a>.</p></footer>
    </div>
  );
}
