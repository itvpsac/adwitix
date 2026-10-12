import LegalPage from '../../components/LegalPage.jsx';

export default function PrivacyPolicy() {
  const sections = [
    { id: 's1', title: '1. Introduction & Scope', body: (
      <>
        <p>1.1. This Privacy Policy describes how ADWITIX ("the Platform", "we", "us") collects, uses, discloses, and protects the personal data of registered Traders, Market Makers, and TSX Masters ("you") in connection with your use of the Platform.</p>
        <p>1.2. This Policy applies across all TradeSphereX storefronts operating on the Platform. Individual TSXs may not collect or process your personal data outside the mechanisms described here without your separate consent.</p>
        <p>1.3. By registering for or using the Platform, you consent to the collection and processing of your personal data as described in this Policy.</p>
      </>
    )},
    { id: 's2', title: '2. Data We Collect', body: (
      <>
        <p><strong>2.1 Identity &amp; Contact:</strong> Mobile number (verified via OTP, your unique identifier), full name, salutation, date of birth, email address (where provided).</p>
        <p><strong>2.2 KYC &amp; Verification:</strong> Individuals — PAN, Aadhaar (masked/tokenised), occupation. Businesses — CIN, GSTIN, company PAN, MSME/UDYAM registration, company type, industry, and optionally turnover/employee count. Supporting documents as applicable to your account type.</p>
        <p><strong>2.3 Address &amp; Banking:</strong> Up to four address records (Registered, Billing, Correspondence, Site/Yard) with optional GPS. Encrypted banking details for refunds and settlements.</p>
        <p><strong>2.4 Transactional:</strong> Lots, bids, offers, EMD pledges/refunds, settlement records, NOC confirmations, Star Rating history, and disclosed reasons for withdrawals, rejections, disputes, or rating downgrades.</p>
        <p><strong>2.5 Listing Media &amp; Location:</strong> Photographs, videos, and documents uploaded for a Lot, including GPS/timestamp data captured at the moment of upload for authenticity verification.</p>
        <p><strong>2.6 Device &amp; Usage:</strong> IP address, browser/device type, session activity, and login timestamps, collected automatically for security and audit purposes.</p>
      </>
    )},
    { id: 's3', title: '3. How We Use Your Data', body: (
      <ul>
        <li>To create and authenticate your account, and verify your identity (KYC).</li>
        <li>To operate the Platform's core functions: Lots, bidding, EMD management, settlement, and Star Ratings.</li>
        <li>To detect and prevent fraud, including phishing/circumvention monitoring, duplicate accounts, and bid manipulation.</li>
        <li>To personalise your experience, including CAT-LOC-VAL matching and notification delivery.</li>
        <li>To communicate with you regarding transactions, disputes, and account status.</li>
        <li>To comply with applicable legal, tax, and regulatory obligations, including audit and retention requirements.</li>
        <li>To generate aggregated, de-identified analytics that do not identify any individual user.</li>
      </ul>
    )},
    { id: 's4', title: '4. Data Sharing & Disclosure', body: (
      <>
        <p><strong>4.1 Within the Platform</strong></p>
        <table>
          <tr><th>Recipient</th><th>What They See</th></tr>
          <tr><td>TSX Master</td><td>Listings, bid/offer history, and identity details of users transacting on their own storefront, strictly as needed for approval, dispute, and compliance functions — bidder identity stays masked during live bidding.</td></tr>
          <tr><td>Market Maker (completed transaction)</td><td>The winning Trader's identity and contact details, revealed only upon acceptance of an offer or close of a Trading Session.</td></tr>
          <tr><td>Trader (completed transaction)</td><td>The Market Maker's identity, location, and inspection contact details, revealed upon EMD pledge or offer acceptance.</td></tr>
          <tr><td>Custodian</td><td>Full transaction records for audit purposes, accessible only after a Trading Session concludes — no visibility into live bidding.</td></tr>
        </table>
        <p><strong>4.2 Third-Party Service Providers:</strong> identity/authentication providers (Custodian multi-factor authentication), SMS/communication providers (OTP and alerts), payment gateway and bank verification providers (EMD processing), cloud infrastructure providers (hosting, media, backup), AI service providers (advisory listing-quality pre-checks, limited to listing content, excluding KYC data). These providers are contractually bound to process your data only for the purposes we specify.</p>
        <p><strong>4.3 Legal &amp; Regulatory:</strong> We may disclose your data where required by law, regulation, court order, or governmental authority, including tax, anti-money-laundering, or audit obligations.</p>
        <p><strong>4.4 What We Do Not Do:</strong> We do not sell your personal data to any third party. We do not share your KYC documents with any TSX or other user — TSX Masters see only your verification status, never the underlying documents.</p>
      </>
    )},
    { id: 's5', title: '5. Data Security & Retention', body: (
      <>
        <p>5.1. Sensitive identity data is encrypted and tokenised at rest. Banking details are encrypted and used solely for refunds and settlements.</p>
        <p>5.2. We retain your data for as long as your account is active, and thereafter for the period required by applicable tax, audit, and regulatory obligations.</p>
      </>
    )},
    { id: 's6', title: '6. Your Rights', body: <p>6.1. Subject to applicable law, you may request access to, correction of, or erasure of your personal data, by contacting the Data Protection contact above. Some data (e.g., transaction and audit records) may be retained despite an erasure request where required by law.</p> },
    { id: 's7', title: '7. Changes to This Policy', body: <p>7.1. We may update this Policy as our data practices change. Material changes will be reflected in the "Effective Date" above.</p> },
  ];
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" meta={<>Data Fiduciary: Adwiti Technocrats Pvt. Ltd · Effective Date: 15-September-2026 · Contact (Grievance/Data Protection): <a href="/trust-and-support">Contact Us</a></>}
      sections={sections} maxWidth={780}
      footerNote={<>See also our <a href="/cookie-policy">Cookie Policy</a> and <a href="/terms-of-usage">Terms of Usage</a>.</>} />
  );
}
