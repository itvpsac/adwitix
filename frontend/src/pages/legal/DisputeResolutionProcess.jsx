import LegalPage from '../../components/LegalPage.jsx';

export default function DisputeResolutionProcess() {
  const sections = [
    { id: 's1', title: '1. What This Covers', body: <p>This document explains, in plain language, how a disagreement about a specific Trading Session gets reviewed and resolved on ADWITIX. It applies to Buy-Now, Express, and Easy Auctions. Tender Auctions are excluded, since they run entirely on terms set directly by the Market Maker.</p> },
    { id: 's2', title: '2. What Can Be Disputed', body: (
      <>
        <ul>
          <li><strong>Payment Dispute:</strong> one side says money was paid or received when the other side disagrees.</li>
          <li><strong>Condition/Delivery Dispute:</strong> the item received doesn't genuinely match what was described or shown.</li>
          <li><strong>Non-Lifting/Collection Dispute:</strong> a Trader won't collect an item, or a Market Maker is blocking collection.</li>
          <li><strong>Auction Rejection Dispute:</strong> a Market Maker rejected a winning result and you believe the reason given doesn't hold up.</li>
          <li><strong>Trader Non-Response Dispute:</strong> a Trader has gone silent on confirming or rating, holding up a Market Maker's settlement.</li>
        </ul>
        <p>A sixth, internal process — Standing Review — looks at a Market Maker's overall pattern of conduct over time. This isn't something you file; it happens automatically based on accumulated history, and is explained in our governance documentation rather than here.</p>
      </>
    )},
    { id: 's3', title: '3. How to File', body: (
      <>
        <p>3.1. Open the transaction in question and select "Raise a Dispute." Choose the category that best matches your situation and provide a clear description.</p>
        <p>3.2. Disputes must be filed within 7 days of the event that triggered them (for example, within 7 days of the expected delivery date, or of a rejected result).</p>
      </>
    )},
    { id: 's4', title: '4. Evidence', body: (
      <>
        <p>4.1. Once filed, both sides have a window to upload supporting evidence — photographs, messages, delivery records, payment proof, or anything else relevant.</p>
        <p>4.2. A ruling is based only on the evidence submitted within this window, so it's worth submitting everything relevant promptly rather than waiting.</p>
      </>
    )},
    { id: 's5', title: '5. Who Decides', body: (
      <>
        <p>5.1. Most disputes are reviewed and ruled on by your TradeSphereX's own TSX Master, since they're closest to that TSX's transactions.</p>
        <p>5.2. Disputes specifically about Trader non-response are reviewed directly by the Custodian.</p>
        <p>5.3. Every ruling comes with a stated reason — you'll always know why a decision was made, not just what the decision was.</p>
      </>
    )},
    { id: 's6', title: '6. Timelines', body: <p>6.1. We aim to resolve every dispute as quickly as the evidence allows, rather than holding it for a fixed period even once a decision is clear.</p> },
    { id: 's7', title: '7. What Happens While a Dispute Is Open', body: <p>7.1. A previously approved forfeiture or refund is not automatically paused just because a dispute has been filed against it — it proceeds on schedule. If the dispute is later decided in your favour, the outcome is corrected retroactively.</p> },
    { id: 's8', title: '8. Appeal', body: (
      <>
        <p>8.1. If your dispute was decided by a TSX Master, you may appeal once, directly to the Custodian, whose decision is final.</p>
        <p>8.2. Disputes decided directly by the Custodian are final and not open to further appeal within this process — though your right to seek external recourse (see our <a href="/grievance-redressal-policy">Grievance Redressal Policy</a>) is unaffected.</p>
      </>
    )},
    { id: 's9', title: '9. Filing in Bad Faith', body: <p>9.1. A pattern of repeated, unsubstantiated disputes is tracked and may itself lead to a consequence for the account filing them.</p> },
  ];
  return (
    <LegalPage eyebrow="Legal" title="Dispute Resolution Process" meta={<>A plain-language guide · Adwiti Technocrats Pvt. Ltd · Effective Date: 15-September-2026 · Contact: <a href="/trust-and-support">Contact Us</a></>}
      sections={sections} maxWidth={780}
      footerNote={<>See also our <a href="/grievance-redressal-policy">Grievance Redressal Policy</a> and <a href="/star-ratings">Star Ratings</a>.</>} />
  );
}
