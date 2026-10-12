import { Link } from 'react-router-dom';
import SiteHeader from '../../components/SiteHeader.jsx';
import SiteFooter from '../../components/SiteFooter.jsx';
import { useAuth } from '../../utils/auth.js';
import './LandingPage.css';

const LISTINGS = [
  { format: 'BUY-NOW', lot: '4488', title: 'Repossessed Sedan — Fleet Lot', price: '₹2,10,000' },
  { format: 'EASY AUCTION', lot: '4501', title: 'Warehouse Racking, 40 Units', price: '₹95,000' },
  { format: 'EXPRESS', lot: '4512', title: 'Salvaged Transformer Bank', price: '₹5,60,000' },
];

export default function LandingPage({ isLoggedIn = true, userName = 'Ravi Kumar', kycStatus = 'verified' }) {
  return (
    <div className="landing">
      <SiteHeader isLoggedIn={isLoggedIn} userName={userName} kycStatus={kycStatus} />

      <main className="landing__main">
        <Hero />
        <ProblemSolution />
        <StatsBar />
        <LiveListings listings={LISTINGS} />
        <HowItWorks />
        <SaleFormats />
        <TrustSystem />
        <Testimonials />
        <BottomCta />
      </main>

      <SiteFooter />
    </div>
  );
}

function Hero() {
  const { isLoggedIn } = useAuth();
  return (
    <section className="landing-hero">
      <div>
        <div className="landing-hero__tags">
          {['Repossessed', 'Salvaged Claims', 'Industrial Surplus'].map((tag) => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>
        <h1 className="landing-hero__h1">You list the asset. <span className="text-accent">We settle the sale.</span></h1>
        <p className="landing-hero__desc">
          Disposing of salvage and surplus the old way means chasing scrap dealers for weeks, guessing at fair value, and hoping the buyer actually pays. AdwitiX runs the whole thing: verified bidders, escrowed deposits, and a rating system that keeps every deal honest.
        </p>
        <div className="landing-hero__ctas">
          <Link to="/marketplace#live-listings" className="btn btn--solid">Browse Live Auctions</Link>
          {isLoggedIn && <Link to="/apply-to-sell" className="btn btn--outline">List an Asset →</Link>}
        </div>
        <div className="landing-hero__stats">
          {[['128', 'Live Right Now'], ['3', 'Sale Formats'], ['10%', 'Flat EMD Entry'], ['100%', 'Direct Settlement']].map(([val, label]) => (
            <div key={label}><b>{val}</b><span>{label}</span></div>
          ))}
        </div>
      </div>

      <div className="landing-hero__card">
        <div className="landing-hero__card-photo">
          <span className="tag-pill tag-pill--strong">EASY AUCTION</span>
          <span className="landing-hero__card-placeholder">photo placeholder</span>
        </div>
        <div className="landing-hero__card-body">
          <div className="landing-hero__card-lot">LOT #4471 · PIN 201301</div>
          <h3>Industrial — CNC Lathe (Surplus)</h3>
          <div className="landing-hero__card-row"><span>Current Price</span><span className="landing-hero__card-price">₹3,42,000</span></div>
          <div className="landing-hero__card-row"><span>Condition</span><span className="landing-hero__card-condition">Working, Minor Wear</span></div>
          <span className="btn btn--solid btn--block">View Listing</span>
        </div>
      </div>
    </section>
  );
}

function ProblemSolution() {
  const without = [
    'Call scrap dealers one by one, no competing bids',
    'No proof the price offered was fair',
    'Trader pays late, or not at all, with no recourse',
    'No record of Trader/Market Maker reliability',
    'Disputes settled by whoever shouts louder',
  ];
  const withIt = [
    'Verified bidders compete in the open',
    'Winning price is set by the market, not a phone call',
    'EMD held in escrow before bidding even opens',
    'Every account carries a real, earned rating',
    'A dispute framework — not a shouting match',
  ];
  return (
    <section className="section-block">
      <div className="section-eyebrow">The Real Bottleneck</div>
      <h2 className="section-title">Selling salvage the old way costs you weeks and certainty.</h2>
      <p className="section-desc">Cold-calling scrap dealers gets you one lowball number and no proof anyone else would&apos;ve paid more. AdwitiX replaces that with a transparent auction, an escrowed deposit, and a settlement that only completes once both sides confirm.</p>
      <div className="landing-cmp">
        <div className="card landing-cmp__col">
          <div className="landing-cmp__label">Without AdwitiX</div>
          <ul className="landing-cmp__list">{without.map((t) => <li key={t}>— {t}</li>)}</ul>
        </div>
        <div className="card landing-cmp__col landing-cmp__col--highlight">
          <div className="landing-cmp__label landing-cmp__label--accent">With AdwitiX</div>
          <ul className="landing-cmp__list landing-cmp__list--strong">{withIt.map((t) => <li key={t}>— {t}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [['10%', 'Flat EMD, Any Format'], ['4', 'Trust Scores Tracked'], ['1hr', 'Fastest Auction Format'], ['0', 'Lot Fees, Ever']];
  return (
    <section className="landing-stats section-block">
      {stats.map(([val, label]) => (
        <div key={label}><b>{val}</b><span>{label}</span></div>
      ))}
    </section>
  );
}

function LiveListings({ listings }) {
  return (
    <section id="live-listings" className="section-block">
      <div className="section-eyebrow">Live Right Now</div>
      <h2 className="section-title">What&apos;s actually on the yard.</h2>
      <p className="section-desc">Every Lot here is a real, active Trading Session — not a demo.</p>
      <div className="landing-listings">
        {listings.map((item) => (
          <div key={item.lot} className="card landing-listing-card">
            <div className="landing-listing-card__photo">
              <span className="tag-pill tag-pill--strong">{item.format}</span>
            </div>
            <div className="landing-listing-card__body">
              <div className="landing-listing-card__lot">LOT #{item.lot}</div>
              <h3>{item.title}</h3>
              <div className="landing-listing-card__row"><span>Price</span><span className="text-accent-strong">{item.price}</span></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ['01', 'List the asset', 'Photos, condition, location, expected value.'],
    ['02', 'Get approved', 'Your TSX Master reviews before it goes live.'],
    ['03', 'Pick a format', 'Buy-Now, Easy, or Express Auction.'],
    ['04', 'Bidding closes', 'Highest verified bid wins, EMD already held.'],
    ['05', 'Settle & rate', 'Both sides confirm NOC, then rate each other.'],
  ];
  return (
    <section className="section-block">
      <div className="section-eyebrow">How Selling Works</div>
      <h2 className="section-title">Five steps, one settled sale.</h2>
      <p className="section-desc">From listing an asset to money in your account — every step is tracked, and nothing closes until both sides confirm.</p>
      <div className="landing-steps">
        {steps.map(([num, title, desc]) => (
          <div key={num}>
            <div className="landing-steps__num">{num}</div>
            <h4>{title}</h4>
            <p>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SaleFormats() {
  const formats = [
    ['BN', 'Buy-Now', 'Judgment-based offers. Market Makers weigh price against Trader rating, not just the highest number.', '3-day offer validity', false],
    ['EA', 'Easy Auction', 'Scheduled open bidding with Dynamic Time extensions — a late bid pushes the deadline back.', 'Market Maker sets the schedule', false],
    ['EX', 'Express Auction', 'No inspection, no waiting — launches the instant 3 Traders pledge EMD. Fully automatic result.', '1-hour run time', false],
    ['TD', 'Tender', 'Fully curated, invitation-only concierge sales — Company Shop exclusive.', 'Coming soon', true],
  ];
  return (
    <section className="section-block">
      <div className="section-eyebrow">Sale Formats</div>
      <h2 className="section-title">Three ways to sell today. One winner, always.</h2>
      <p className="section-desc">Every listing is matched to the disposal mechanism that fits it — Tender is coming soon, Company Shop exclusive.</p>
      <div className="landing-formats">
        {formats.map(([abbr, title, desc, note, faded]) => (
          <div key={abbr} className="card landing-format-card" style={faded ? { opacity: 0.55 } : undefined}>
            <div className="landing-format-card__badge">{abbr}</div>
            <h4>{title}</h4>
            <p>{desc}</p>
            <span className="landing-format-card__note">{note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrustSystem() {
  const points = [
    ['Every profile starts at 3★', 'No advantage for age of account — rating reflects behaviour, never frequency.'],
    ['Downgrades are human-reviewed', 'No rating drops silently. Tenant Admin — and Super Admin below 2★ — must approve it.'],
    ['Recovery is real', 'Crawl-Back lets a buyer rebuild trust through clean transactions.'],
  ];
  const ratings = [['Buyer Rating', '★★★☆☆ 3.0'], ['Seller Rating', '★★★☆☆ 3.0'], ['Every account starts here', 'Neutral baseline']];
  return (
    <section id="trust" className="section-block">
      <div className="landing-trust">
        <div>
          <div className="landing-trust__eyebrow-row">
            <img src="/adwitix-icon.svg" alt="" className="landing-trust__icon" />
            <span className="section-eyebrow" style={{ margin: 0 }}>Trust System</span>
          </div>
          <h2 className="section-title">Four scores, one honest track record.</h2>
          <ul className="landing-trust__list">
            {points.map(([title, desc], i) => (
              <li key={title}>
                <span className="landing-trust__num">{i + 1}</span>
                <div><b>{title}</b><span>{desc}</span></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card landing-trust__card">
          {ratings.map(([label, val]) => (
            <div key={label} className="landing-trust__card-row"><span>{label}</span><span className="text-accent-strong">{val}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    ['"First time I actually got competing bids on scrap machinery instead of one lowball number over the phone."', 'Ramesh Yadav', 'Plant Manager, Surplus Market Maker'],
    ["\"The EMD escrow means I don't chase payment anymore. Settlement happens automatically once both sides confirm.\"", 'Neha Kapoor', 'Insurance Salvage Coordinator'],
    ['"Express Auction cleared a repossessed fleet in under an hour. No inspection delays, no back-and-forth."', 'Arvind Mehta', 'Recovery Agent, Regional Bank'],
  ];
  return (
    <section className="section-block">
      <div className="section-eyebrow">Trusted On The Yard</div>
      <h2 className="section-title" style={{ marginBottom: 30 }}>What Market Makers and Traders say.</h2>
      <div className="landing-testimonials">
        {quotes.map(([quote, name, role]) => (
          <div key={name} className="card landing-testimonial-card">
            <p>{quote}</p>
            <b>{name}</b><span>{role}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BottomCta() {
  return (
    <div className="landing-cta">
      <div>
        <h3>Ready to clear the yard?</h3>
        <p>List your first asset in minutes — no listing fee, ever.</p>
      </div>
      <Link to="/onboarding" className="btn btn--gold">Get Started</Link>
    </div>
  );
}
