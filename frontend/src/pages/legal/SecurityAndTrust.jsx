import PublicMiniHeader from '../../components/PublicMiniHeader.jsx';
import './SecurityAndTrust.css';

const BADGES = ['Segregated deposits', 'Anonymous bidding', 'Encrypted identity data', 'Tamper-checked timing', '150% bid ceiling', 'Independent audits'];

const PILLARS = [
  { emoji: '🏦', title: 'Your Money Is Never Pooled', intro: 'Every deposit you pledge is held separately, tied to the specific bid it secures — never mixed into one shared pot with other Traders\' money.', points: [
    'Each deposit is a distinct, ring-fenced holding, released or forfeited only based on that specific Trading Session\'s outcome.',
    'Your deposit is refunded automatically as soon as it\'s no longer needed — outbid, not selected, or deal closed — with no fixed delay.',
    'No interest is ever taken from money held on your behalf.',
    'Deposits are held through a licensed, RBI-regulated payment partner, not an unlicensed wallet.'] },
  { emoji: '🛡️', title: 'Your Data Is Protected', intro: 'Sensitive information is encrypted, minimised, and shared only with whoever genuinely needs it, only when they need it.', points: [
    'Aadhaar and other sensitive ID data are stored in masked, tokenised form — never in plain text.',
    'Banking details are encrypted and used solely to process refunds and settlements.',
    'Your identity stays hidden from a counterparty until a real commitment is made on both sides — not shared upfront.',
    'We never sell your data to anyone, for any reason.'] },
  { emoji: '📷', title: 'What You See Is Real', intro: 'Lots are built from genuine, verifiable evidence — not stock photos or recycled images.', points: [
    'Every photo is captured through the app itself, at the moment of listing — not uploaded from an old gallery.',
    'Location and timestamp data is captured automatically alongside each photo, making it far harder to pass off a fake or unrelated image.',
    'Stock photography and placeholder images are never allowed on a Lot.',
    'Even on Express Auctions, Market Makers must disclose any known defects upfront — not just what the photos happen to show.'] },
  { emoji: '⚖️', title: 'A Level Playing Field', intro: 'The bidding process is designed so no one — including us — gets an unfair edge.', points: [
    'During a live Trading Session, nobody can see who else is bidding — not other Traders, not the Market Maker.',
    'Even our Custodian has zero visibility into a Trading Session while it\'s actually happening — access opens only after it closes, same as everyone else.',
    'No single bid can jump more than 150% above the current price, catching costly typos and blocking deliberate price manipulation.',
    'Bidding activity is continuously monitored for patterns that suggest manipulation or bad-faith behaviour.'] },
  { emoji: '📋', title: 'Every Action Is Accountable', intro: 'Decisions that affect you always come with a stated reason and a permanent record — never a silent, unexplained outcome.', points: [
    'Every rejection, forfeiture, and dispute ruling is logged with the specific reason behind it.',
    'Records in our system can\'t be secretly altered — not by outside parties, and not by our own staff.',
    'Before you pledge a deposit, you\'re shown a clear, specific summary of what you\'re agreeing to for that exact bid.',
    'A rating can only drop significantly after a human review — never an automatic, unchecked penalty — and you always have the right to appeal.'] },
  { emoji: '✅', title: 'Independently Checked', intro: 'We don\'t just tell you the platform is secure — it\'s regularly verified by people outside our own team.', points: [
    'The platform undergoes independent security audits by outside specialists, not just our own developers.',
    'Our servers\' clocks are continuously synced and monitored, so Trading Session timing can\'t be secretly manipulated.',
    'Unusual money-movement patterns are actively monitored to guard against misuse of the platform.',
    'Our payment infrastructure runs through a licensed, RBI-authorised partner, not an in-house or unregulated system.'] },
];

export default function SecurityAndTrust() {
  return (
    <div className="sat-page">
      <PublicMiniHeader />
      <main className="sat-main">
        <div className="legal-eyebrow">Trust &amp; Support</div>
        <h1 className="sat-title">Security &amp; Trust</h1>
        <p className="sat-desc">A plain explanation of how your money, your data, and your Trading Sessions are protected on ADWITIX — and how we hold ourselves accountable.</p>

        <div className="sat-badges">
          {BADGES.map((b) => <span key={b}>🔒 {b}</span>)}
        </div>

        <div className="sat-grid">
          {PILLARS.map((p, i) => (
            <div key={p.title} className="sat-card">
              <div className="sat-card__head">
                <div className="sat-card__icon">{p.emoji}</div>
                <div>
                  <div className="sat-card__num">{String(i + 1).padStart(2, '0')}</div>
                  <h3>{p.title}</h3>
                </div>
              </div>
              <p className="sat-card__intro">{p.intro}</p>
              <div className="sat-card__points">
                {p.points.map((pt) => <div key={pt}><span>→</span><span>{pt}</span></div>)}
              </div>
            </div>
          ))}
        </div>
      </main>
      <footer className="sat-footer">
        <p>For the full legal detail behind these protections, see our <a href="/terms-of-usage">Terms of Usage</a> and <a href="/privacy-policy">Privacy Policy</a>.</p>
        <p>Have a specific concern? Reach out through <a href="/trust-and-support">Contact Us</a>.</p>
      </footer>
    </div>
  );
}
