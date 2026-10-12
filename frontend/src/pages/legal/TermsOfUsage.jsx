import LegalPage from '../../components/LegalPage.jsx';

export default function TermsOfUsage() {
  const sections = [
    { id: 'def', title: '1. Definitions', body: (
      <ul>
        <li><strong>Custodian:</strong> The sovereign administrator of the Platform, who does not participate as a Trader, Market Maker, or TSX Master in any transaction.</li>
        <li><strong>TradeSphereX / TSX:</strong> A whitelisted storefront on the Platform under its own branding, administered by a TSX Master.</li>
        <li><strong>TSX Master:</strong> A person authorised by a TSX's company, under formal agreement with ADWITIX, to administer that TSX's storefront.</li>
        <li><strong>Trader:</strong> A registered user who bids on, offers for, or purchases a Lot.</li>
        <li><strong>Market Maker:</strong> A registered user approved by a specific TSX to list items for sale on that TSX's storefront.</li>
        <li><strong>Lot:</strong> A cataloged item and its associated description, media, and condition information.</li>
        <li><strong>Sale System:</strong> The transactional format under which a Lot is offered — Buy-Now, Express Auction, Easy Auction, or Tender Auction.</li>
        <li><strong>EMD:</strong> A refundable security deposit pledged by a Trader to participate in a bid or offer, calculated as 10% of the applicable value.</li>
        <li><strong>PC / Money Points:</strong> The Platform's internal representation of a Trader's deposited funds, held at 1:1 parity, maintained as segregated per-pledge escrow holdings rather than a pooled or freely spendable balance. PC is never used to pay for goods directly.</li>
        <li><strong>RV / EV:</strong> Reserve Value and Expected Value — the floor and target prices set by a Market Maker for a Lot.</li>
        <li><strong>NOC:</strong> A digital No Objection Certificate confirming, respectively, receipt of funds (Market Maker) or receipt of goods (Trader).</li>
        <li><strong>Star Rating:</strong> The Platform's dual, independent reputation scores — Trader★ and Market Maker★ — reflecting a user's transaction history.</li>
      </ul>
    )},
    { id: 's2', title: '2. Eligibility & Registration', body: (
      <>
        <p>2.1. You must be at least 18 years of age and capable of entering into a legally binding contract under Indian law to register for or use the Platform.</p>
        <p>2.2. Registration requires a valid 10-digit Indian mobile number, verified by OTP. You are responsible for the confidentiality of your account credentials, including your 4-digit mPIN.</p>
        <p>2.3. Each user may hold only one account, uniquely tied to their verified mobile number. Creating multiple accounts, or registering on behalf of another person without authorisation, is prohibited.</p>
        <p>2.4. You agree to provide accurate, current, and complete information during registration and KYC verification, and to promptly update it if it changes.</p>
        <p>2.5. Business/organisational users must additionally provide corporate verification details (CIN, GSTIN, company PAN) as prescribed by KYC requirements.</p>
      </>
    )},
    { id: 's3', title: '3. Account Security', body: (
      <>
        <p>3.1. You are solely responsible for all activity under your account, whether or not authorised by you, except where it results from the Platform's own security failure.</p>
        <p>3.2. You must notify the Platform immediately if you suspect unauthorised access to your account.</p>
        <p>3.3. Three consecutive failed mPIN attempts trigger a mandatory OTP verification step before further access is permitted.</p>
      </>
    )},
    { id: 's4', title: '4. Nature of the Platform', body: (
      <>
        <p>4.1. ADWITIX is a marketplace facilitator only. We are not a party to, and assume no responsibility for, the underlying sale contract between a Trader and a Market Maker. Title to any item transfers directly between them, not through the Platform.</p>
        <p>4.2. The Platform does not take custody of, inspect, or guarantee the condition, legality, or authenticity of any Lot, except as expressly stated in these Terms (e.g., mandatory listing media requirements).</p>
        <p>4.3. 100% of the sale value for any completed transaction is settled directly and offline between Trader and Market Maker. The Platform never holds, transmits, or has custody of the full sale value — only the EMD (where applicable) is held via the Platform's payment mechanisms.</p>
        <p>4.4. The Custodian does not participate as a Trader, Market Maker, or TSX Master in any transaction, and has no visibility into live bidding activity while it is in progress.</p>
      </>
    )},
    { id: 's5', title: '5. Bidding, EMD & Settlement', body: (
      <>
        <p>5.1. A Trader must pledge an EMD of 10% of the applicable value before placing a bid or offer. The EMD is refunded automatically once no longer required (outbid, not selected, or deal closed with balance remaining).</p>
        <p>5.2. A winning Trader who fails to complete payment within the applicable window forfeits their EMD. The win passes to the next-highest bidder (Baton-Pass), up to three times, before the Trading Session is cancelled.</p>
        <p>5.3. Both parties must file an NOC before a deal is considered closed — the Market Maker confirming receipt of funds, the Trader confirming receipt of goods.</p>
      </>
    )},
    { id: 's6', title: '6. Star Ratings, Crawl-Back & Shadow Banning', body: (
      <>
        <p>6.1. Every user holds two independent Star Ratings — Trader★ and Market Maker★ — starting at 3.0 of 5.0, rising with clean conduct and falling with defaults or disputes.</p>
        <p>6.2. A rating below 2★ enters Crawl-Back (restricted to smaller-value transactions); a persistently low rating may result in Shadow Banning (reduced visibility, not a block).</p>
      </>
    )},
    { id: 's7', title: '7. Disputes & Termination', body: (
      <>
        <p>7.1. Disputes are handled under our separate Dispute Resolution Process. A TSX Master ruling may be appealed once, to the Custodian, whose decision is final.</p>
        <p>7.2. We may suspend or terminate your account for breach of these Terms, fraud, repeated non-payment, or as required by law, with a stated reason.</p>
      </>
    )},
    { id: 's8', title: '8. Governing Law', body: <p>8.1. These Terms are governed by the laws of India. Disputes not resolved through our internal process are subject to the exclusive jurisdiction of the courts at [city — TODO].</p> },
    { id: 's9', title: '9. Changes to These Terms', body: <p>9.1. We may update these Terms from time to time. Material changes will be reflected in the "Effective Date" above and, where required, notified to you directly.</p> },
  ];
  return (
    <LegalPage eyebrow="Legal" title="Terms of Usage" meta={<>Operator: Adwiti Technocrats Pvt. Ltd · Effective Date: 15-September-2026 · Contact: <a href="/trust-and-support">Contact Us</a></>}
      sections={sections} maxWidth={760}
      footerNote={<>See also our <a href="/privacy-policy">Privacy Policy</a> and <a href="/trust-and-support">Trust &amp; Support</a>.</>} />
  );
}
