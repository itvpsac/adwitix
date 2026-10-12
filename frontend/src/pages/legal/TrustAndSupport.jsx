import { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicMiniHeader from '../../components/PublicMiniHeader.jsx';
import './TrustAndSupport.css';

const PLATFORM_CARDS = [
  { emoji: '❓', title: 'FAQ', desc: 'Searchable answers to common questions, shown separately for Traders and Market Makers.', href: '/faq' },
  { emoji: '✅', title: "Dos & Don'ts", desc: 'A quick, practical guide to what to do — and avoid — at every stage of a transaction.', href: '/dos-and-donts' },
  { emoji: '📖', title: 'Terminology', desc: 'Plain-language definitions for every ADWITIX-specific term.', href: '/terminology' },
];
const TRUST_CARDS = [
  { emoji: '⭐', title: 'Star Ratings', desc: 'How your reputation is built, what raises and lowers it, and how to recover.', href: '/star-ratings' },
  { emoji: '🛡️', title: 'Security & Trust', desc: 'How deposits are held, how Lots are verified, and how the platform is audited.', href: '/security-and-trust' },
];
const LEGAL_CARDS = [
  { emoji: '📄', title: 'Terms of Usage', desc: 'The binding agreement covering listings, bidding, settlement, and account conduct.', href: '/terms-of-usage' },
  { emoji: '🔒', title: 'Privacy Policy', desc: "What data we collect, how it's used, and how it's protected.", href: '/privacy-policy' },
  { emoji: '🍪', title: 'Cookie Policy', desc: 'What cookies we use, and what we never use them for.', href: '/cookie-policy' },
  { emoji: '↩️', title: 'Refund & Cancellation Policy', desc: "When a deposit is refunded, when it's forfeited, and how long each takes.", href: '/refund-and-cancellation-policy' },
];
const SUPPORT_CARDS = [
  { emoji: '🗂️', title: 'Dispute Center', desc: 'File a dispute against a transaction, upload evidence, and track the ruling.', href: '/dispute-center' },
  { emoji: '⚖️', title: 'Dispute Resolution Process', desc: 'A plain-language walkthrough of how a disagreement gets reviewed and resolved.', href: '/dispute-resolution-process' },
  { emoji: '📢', title: 'Grievance Redressal', desc: 'How to escalate a complaint, and what response time to expect.', href: '/grievance-redressal-policy' },
];

function CardGrid({ cards, iconBg }) {
  return (
    <div className="tas-grid">
      {cards.map((c) => (
        <Link key={c.title} to={c.href} className="tas-card">
          <div className="tas-card__icon" style={{ background: iconBg }}>{c.emoji}</div>
          <div><h3>{c.title}</h3><p>{c.desc}</p></div>
        </Link>
      ))}
    </div>
  );
}

export default function TrustAndSupport() {
  const [form, setForm] = useState({ name: '', contact: '', topic: 'general', message: '' });
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const submit = () => {
    if (!form.name || !form.contact || !form.message) {
      setError('Please fill in your name, contact, and message.');
      return;
    }
    setTicketNumber('TS-' + Math.floor(100000 + Math.random() * 900000));
    setSubmitted(true);
  };

  return (
    <div className="tas-page">
      <PublicMiniHeader backTo="/profile" backLabel="My Profile" />
      <main className="tas-main">
        <div className="legal-eyebrow">ADWITIX</div>
        <h1 className="tas-title">Trust &amp; Support</h1>
        <p className="tas-desc">Everything you need to trade with confidence — how the platform works, what protects you, and where to get help — in one place.</p>

        <Link to="/pricing" className="tas-pricing-banner">
          <div><h2>Pricing</h2><p>The full Fee &amp; Charges Schedule — what it costs to list, bid, and settle on AdwitiX.</p></div>
          <span>View Pricing →</span>
        </Link>

        <section className="tas-section">
          <h2>Using the Platform</h2>
          <p className="tas-section__sub">Practical answers for day-to-day trading and selling.</p>
          <CardGrid cards={PLATFORM_CARDS} iconBg="#F3E3D6" />
        </section>

        <section className="tas-section">
          <h2>Trust &amp; Reputation</h2>
          <p className="tas-section__sub">How ratings work, and how your money and data are protected.</p>
          <CardGrid cards={TRUST_CARDS} iconBg="#F3E3D6" />
        </section>

        <section className="tas-section">
          <h2>Legal Documents</h2>
          <p className="tas-section__sub">The formal terms governing your use of ADWITIX.</p>
          <CardGrid cards={LEGAL_CARDS} iconBg="#E7E9F2" />
        </section>

        <section className="tas-section">
          <h2>Support</h2>
          <p className="tas-section__sub">How to escalate a problem, and how to reach us.</p>
          <CardGrid cards={SUPPORT_CARDS} iconBg="#F3E3D6" />
        </section>

        <section className="tas-contact">
          <h2>Contact Us</h2>
          <p className="tas-contact__sub">Send us a message — we typically respond within one business day.</p>

          {submitted ? (
            <div className="tas-contact__success">
              <div className="tas-contact__check">✓</div>
              <p className="tas-contact__ticket">Ticket #{ticketNumber} submitted</p>
              <p className="tas-contact__followup">We'll follow up at the contact details you provided.</p>
            </div>
          ) : (
            <div>
              <div className="tas-form-grid">
                <input placeholder="Your name" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(''); }} />
                <input placeholder="Mobile or email" value={form.contact} onChange={(e) => { setForm({ ...form, contact: e.target.value }); setError(''); }} />
              </div>
              <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="tas-select">
                <option value="general">General question</option>
                <option value="dispute">Dispute help</option>
                <option value="kyc">KYC / verification</option>
                <option value="payout">Payout / settlement</option>
                <option value="technical">Technical issue</option>
              </select>
              <textarea placeholder="Describe your issue" value={form.message} onChange={(e) => { setForm({ ...form, message: e.target.value }); setError(''); }} rows={4} className="tas-textarea" />
              {error && <p className="tas-error">{error}</p>}
              <button onClick={submit} className="tas-submit">Submit Ticket</button>
            </div>
          )}
        </section>
      </main>
      <footer className="tas-footer"><p>Can't find what you need? Reach out above, or check back soon — this page is actively growing.</p></footer>
    </div>
  );
}
