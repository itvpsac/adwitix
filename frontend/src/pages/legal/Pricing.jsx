import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PublicMiniHeader from '../../components/PublicMiniHeader.jsx';
import './Pricing.css';

const TIERS = [
  { name: 'CoCo Starter', price: 'Free', period: '', annualNote: 'For individual & one-time Market Makers', highlight: '#DDE0EA', badge: '', ctaLabel: 'Start Free', solid: false,
    features: ['Unlimited Lots & Trading Sessions', 'Standard auction engine', 'Buy-Now, Express, Easy Auction', 'Buyer-Pays only', 'No API access'] },
  { name: 'TSX Launch', price: '₹10,000', period: '/month', annualNote: '₹1,20,000/yr list', highlight: '#DDE0EA', badge: '', ctaLabel: 'Choose Launch', solid: false,
    features: ['Everything in CoCo Starter', 'Branded marketplace', 'One TSX Master (+ add-on)', 'Seller-Pays available', 'Read-only API access'] },
  { name: 'TSX Growth', price: '₹25,000', period: '/month', annualNote: '₹3,00,000/yr list', highlight: '#C9974C', badge: 'Most Popular', ctaLabel: 'Choose Growth', solid: true,
    features: ['Everything in TSX Launch', 'Basic RBAC (view/approve)', 'API read + push Lots', '400 GB storage', '7-year data retention'] },
  { name: 'TSX Enterprise', price: '₹60,000', period: '/month', annualNote: '₹7,20,000/yr list', highlight: '#DDE0EA', badge: '', ctaLabel: 'Talk to Sales', solid: false,
    features: ['Everything in TSX Growth', 'Full RBAC & workflow config', 'Full push/pull API, SSO', 'Audit logs', '1 TB storage, unlimited retention'] },
];
const BRACKETS = [
  { label: 'Up to ₹10L', rate: 2.00, max: 1000000 },
  { label: '₹10L – ₹50L', rate: 1.50, max: 5000000 },
  { label: '₹50L – ₹2Cr', rate: 1.00, max: 20000000 },
  { label: '₹2Cr – ₹10Cr', rate: 0.75, max: 100000000 },
  { label: 'Above ₹10Cr', rate: 0.50, max: Infinity },
];
const PRESETS = [['₹1L', 100000], ['₹10L', 1000000], ['₹50L', 5000000], ['₹2Cr', 20000000], ['₹15Cr', 150000000]];
const DISCOUNT_LADDER = [
  { commitment: 'Monthly (no lock-in)', discount: '0%', launch: '1,20,000', growth: '3,00,000', enterprise: '7,20,000' },
  { commitment: '1-year prepaid', discount: '20%', launch: '96,000', growth: '2,40,000', enterprise: '5,76,000' },
  { commitment: '2-year prepaid', discount: '30%', launch: '84,000', growth: '2,10,000', enterprise: '5,04,000' },
  { commitment: '3-year prepaid', discount: '40%', launch: '72,000', growth: '1,80,000', enterprise: '4,32,000' },
  { commitment: '5-year prepaid', discount: '50%', launch: '60,000', growth: '1,50,000', enterprise: '3,60,000' },
];
const STORAGE_ROWS = [
  { feature: 'Included storage', starter: '5 GB', launch: '100 GB', growth: '400 GB', enterprise: '1 TB' },
  { feature: 'Max file size', starter: '25 MB', launch: '100 MB', growth: '250 MB', enterprise: '500 MB' },
  { feature: 'Images per Lot', starter: '20', launch: '100', growth: '300', enterprise: 'Unlimited' },
  { feature: 'Videos per Lot', starter: '1', launch: '5', growth: '10', enterprise: 'Unlimited' },
  { feature: 'Data retention', starter: '1 Year', launch: '5 Years', growth: '7 Years', enterprise: '10 Yrs / Unlimited' },
  { feature: 'Deleted-data recovery', starter: '7 Days', launch: '30 Days', growth: '90 Days', enterprise: '180 Days' },
];
const OPTIONAL_SERVICES = [
  ['Marketplace Setup & Branding', '₹50,000+'], ['Data Migration', '₹25,000+'], ['API Integration Setup (one-time)', '₹1,00,000+'],
  ['Online Training', '₹10,000/day'], ['Custom Development', '₹2,500/hr'],
];
const ENTERPRISE_ADDONS = [
  ['Additional Administrator', '₹25,000/yr'], ['Additional Business Unit', '₹50,000/yr'], ['Dedicated Account Manager', '₹1,00,000/yr'],
  ['Premium SLA', '₹2,00,000/yr'], ['Private Cloud / On-Premise', 'On Quotation'],
];

const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const bracketFor = (v) => BRACKETS.find((b) => v <= b.max) || BRACKETS[BRACKETS.length - 1];

export default function Pricing() {
  const [saleValue, setSaleValue] = useState(850000);

  const calc = useMemo(() => {
    const { rate } = bracketFor(saleValue);
    const fee = Math.max((saleValue * rate) / 100, 500);
    const gst = fee * 0.18;
    const buyerTotal = saleValue + fee + gst;
    const activeIndex = BRACKETS.findIndex((b) => saleValue <= b.max);
    const ladderBars = BRACKETS.map((b, i) => {
      const isActive = i === activeIndex;
      return { ...b, isActive, height: Math.round(b.rate * 45) + 24 };
    });
    return { rate, fee, gst, buyerTotal, ladderBars };
  }, [saleValue]);

  return (
    <div className="pr-page">
      <PublicMiniHeader backTo={null} />
      <main className="pr-main">
        <div className="legal-eyebrow">Pricing</div>
        <h1 className="pr-h1">Marketplace growth should never be taxed.</h1>
        <p className="pr-lead">Every plan gets unlimited Lots, Trading Sessions, Market Makers and Traders — no cap on growth. ADWITIX earns only when a sale actually completes. All prices exclude GST unless stated.</p>

        <section className="pr-section">
          <div className="pr-tiers">
            {TIERS.map((t) => (
              <div key={t.name} className="pr-tier" style={{ borderColor: t.highlight }}>
                {t.badge && <span className="pr-tier__badge">{t.badge}</span>}
                <h3>{t.name}</h3>
                <div className="pr-tier__price"><span>{t.price}</span><span>{t.period}</span></div>
                <p className="pr-tier__note">{t.annualNote}</p>
                <ul>{t.features.map((f) => <li key={f}>{f}</li>)}</ul>
                <a href="#" className={`pr-tier__cta${t.solid ? ' pr-tier__cta--solid' : ''}`}>{t.ctaLabel}</a>
              </div>
            ))}
          </div>
          <p className="pr-footnote">Tender Auctions run through CoCo Concierge — a fully managed path exclusive to the platform's own Company Shop, billed per engagement plus the standard Success Fee.</p>
        </section>

        <section className="pr-section">
          <h2>Success Fee</h2>
          <p className="pr-section__lead">One schedule, the same for every TradeSphereX regardless of tier — it declines as the sale value goes up. Minimum ₹500 + GST.</p>

          <div className="pr-card">
            <div className="pr-ladder">
              {calc.ladderBars.map((b) => (
                <div key={b.label} className="pr-ladder__col">
                  <span style={{ fontSize: b.isActive ? 17 : 12, fontWeight: 800, color: b.isActive ? '#fff' : 'var(--color-text-faint)' }}>{b.rate.toFixed(2)}%</span>
                  <div className="pr-ladder__bar" style={{ height: b.height, background: b.isActive ? 'var(--color-accent)' : '#EEF0F5', border: b.isActive ? '2px solid var(--color-accent-dark)' : '1px solid var(--color-border)', boxShadow: b.isActive ? '0 4px 14px rgba(201,151,76,0.35)' : 'none' }} />
                </div>
              ))}
            </div>
            <div className="pr-ladder pr-ladder--labels">
              {calc.ladderBars.map((b) => (
                <div key={b.label} className="pr-ladder__col">
                  <span className="pr-ladder__chip" style={{ background: b.isActive ? 'var(--color-accent)' : 'transparent', color: b.isActive ? '#fff' : 'var(--color-text-faint)', fontWeight: b.isActive ? 800 : 500 }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pr-card">
            <h3>Success Fee Calculator</h3>
            <p className="pr-card__sub">Drag the slider or pick a value to see what a sale actually costs.</p>
            <div className="pr-slider-value">{fmt(saleValue)}</div>
            <input type="range" min={10000} max={20000000} step={10000} value={saleValue} onChange={(e) => setSaleValue(Number(e.target.value))} className="pr-slider" />
            <div className="pr-slider-range"><span>₹10,000</span><span>₹2,00,00,000+</span></div>

            <div className="pr-presets">
              {PRESETS.map(([label, val]) => (
                <button key={label} onClick={() => setSaleValue(val)}>{label}</button>
              ))}
            </div>

            <div className="pr-fee-payer">
              <div className="pr-highlight-box"><p>Applicable Rate</p><p>{calc.rate.toFixed(2)}%</p></div>
              <div className="pr-highlight-box"><p>Success Fee + GST</p><p>{fmt(calc.fee)}<span> + {fmt(calc.gst)} GST</span></p></div>
            </div>
            <div className="pr-fee-payer">
              <div className="pr-outline-box"><p className="pr-outline-box__label pr-outline-box__label--green">If Buyer-Pays</p><p>Trader pays <strong>{fmt(calc.buyerTotal)}</strong> total. Market Maker receives the full {fmt(saleValue)}.</p></div>
              <div className="pr-outline-box"><p className="pr-outline-box__label pr-outline-box__label--brown">If Seller-Pays</p><p>Trader pays only <strong>{fmt(saleValue)}</strong>. {fmt(calc.fee + calc.gst)} is billed to the TSX monthly instead.</p></div>
            </div>
            <p className="pr-footnote">Illustrative only — the minimum Success Fee of ₹500 + GST always applies regardless of sale value.</p>
          </div>

          <h3 className="pr-subhead">Fee Payer Election</h3>
          <div className="pr-fee-payer">
            <div className="pr-election-box"><span className="pr-tag pr-tag--green">Default — every tier</span><p className="pr-election-box__title">Buyer-Pays</p><p>The Trader's total = Trade Value + Success Fee + GST. Listing and selling stay free for the Market Maker.</p></div>
            <div className="pr-election-box"><span className="pr-tag pr-tag--brown">Paid tiers only</span><p className="pr-election-box__title">Seller-Pays</p><p>A 0%-visible-premium option — the Trader pays only the Trade Value. Set per Trading Session, locked once bidding opens.</p></div>
          </div>
        </section>

        <section className="pr-section">
          <h2>Prepay and save</h2>
          <p className="pr-section__lead">The same discount ladder applies across all three paid tiers.</p>
          <div className="pr-table-wrap">
            <div className="pr-table">
              <div className="pr-table__row pr-table__row--head pr-discount-cols">
                <div>Commitment</div><div>Discount</div><div>TSX Launch</div><div>TSX Growth</div><div>TSX Enterprise</div>
              </div>
              {DISCOUNT_LADDER.map((row) => (
                <div key={row.commitment} className="pr-table__row pr-discount-cols">
                  <div className="pr-cell-strong">{row.commitment}</div>
                  <div className="pr-cell-gold">{row.discount}</div>
                  <div>{row.launch}</div><div>{row.growth}</div><div>{row.enterprise}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="pr-footnote">Prices per year, ₹. Sales teams may quote below the ladder for negotiated deals, down to a 50% floor.</p>
        </section>

        <section className="pr-section">
          <h2>Storage &amp; data retention</h2>
          <div className="pr-table-wrap">
            <div className="pr-table pr-table--storage">
              <div className="pr-table__row pr-table__row--head pr-storage-cols">
                <div>Feature</div><div>CoCo Starter</div><div>TSX Launch</div><div>TSX Growth</div><div>TSX Enterprise</div>
              </div>
              {STORAGE_ROWS.map((row) => (
                <div key={row.feature} className="pr-table__row pr-storage-cols">
                  <div className="pr-cell-strong">{row.feature}</div>
                  <div>{row.starter}</div><div>{row.launch}</div><div>{row.growth}</div><div>{row.enterprise}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="pr-footnote">Additional storage beyond the included allowance: ₹2,000 per 100 GB/year + GST, the same rate across every tier.</p>
        </section>

        <section className="pr-services-section">
          <div className="pr-services">
            <div>
              <h3>Optional Marketplace Services</h3>
              <div className="pr-service-list">{OPTIONAL_SERVICES.map(([name, price]) => <div key={name}><span>{name}</span><span>{price}</span></div>)}</div>
            </div>
            <div>
              <h3>Enterprise Add-ons</h3>
              <div className="pr-service-list">{ENTERPRISE_ADDONS.map(([name, price]) => <div key={name}><span>{name}</span><span>{price}</span></div>)}</div>
            </div>
          </div>
        </section>
      </main>

      <section className="pr-cta">
        <div className="pr-cta__inner">
          <div><h3>Start free on CoCo Starter.</h3><p>Upgrade whenever Seller-Pays or API access matters to you.</p></div>
          <Link to="/onboarding" className="pr-cta__btn">Get Started</Link>
        </div>
      </section>
    </div>
  );
}
