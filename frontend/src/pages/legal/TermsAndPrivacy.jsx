import LegalPage from '../../components/LegalPage.jsx';

export default function TermsAndPrivacy() {
  const sections = [
    { id: 'accounts', title: '1. Accounts & Roles', body: <p>You may hold multiple roles on ADWITIX — Trader, Market Maker, or both — under a single verified identity. Custodians are structurally barred from holding any participant role. A suspension or revoked compliance flag on your master KYC status cascades automatically to every role you hold.</p> },
    { id: 'kyc', title: '2. Identity Verification (KYC)', body: <p>You must complete KYC before bidding or listing: document upload to an encrypted vault, Aadhaar tokenization, and PAN/GSTIN registry checks. Buyers are verified by the platform Custodian; Market Makers are verified by their TSX Master. Submitted KYC dossiers lock until a Verified or Suspended decision is issued.</p> },
    { id: 'listings', title: '3. Listings & Trading Sessions', body: <p>Every listing requires authentic, unedited media of the actual item — stock, catalogue, or generated imagery is never permitted absent an approved Tenant Media Waiver. Approved listings enter a limited post-approval edit window before parameters freeze for the live Trading Session.</p> },
    { id: 'bidding', title: '4. Bidding, EMD & Settlement', body: <p>Bids constitute a binding commitment backed by an escrowed Earnest Money Deposit. Winning bidders and Market Makers must each submit a No Objection Certificate and a mandatory settlement rating before a deal is considered closed; unresponsive parties are subject to stall resolution and rating consequences.</p> },
    { id: 'fees', title: '5. Fees & Payment', body: <p>A Success Fee applies only on completed sales, on a declining schedule by final sale value, subject to a minimum of ₹500 + GST. Buyer-Pays is the default fee allocation; Seller-Pays is available on paid subscription tiers and, once selected for a Trading Session, is locked at bidding open.</p> },
    { id: 'ratings', title: '6. Ratings, Standing & Rehabilitation', body: <p>Every account holds separate Trader and Market Maker star ratings, starting at 3★. A rating below 2★ triggers Crawl-Back — a temporary restriction to your tenant's Low value bracket. Persistently poor standing triggers Shadow Banning, a graduated reduction in platform-driven visibility rather than an outright block.</p> },
    { id: 'disputes', title: '7. Disputes & Standing Review', body: <p>Disputes are filed against a specific transaction within a defined window, resolved with evidence from both sides and a stated rationale. Tenant Admin rulings may be appealed once, to the Custodian, whose decision is final. Market Makers are additionally subject to periodic Standing Review, opened annually or once complaints exceed a set threshold.</p> },
    { id: 'payouts', title: '8. Payout Accounts', body: <p>Any change to your registered payout bank account requires OTP re-verification of the account holder and a mandatory 24-hour cooling-off period before the new account becomes active for settlements or refunds.</p> },
    { id: 'privacy', title: '9. Data Handling & Privacy', body: <p>KYC documents are encrypted end-to-end; Aadhaar numbers are tokenized and never stored in plain text. Every material action is logged to a tamper-evident audit trail, retained for the statutory period applicable to your subscription tier. Consent is captured and logged individually at registration, KYC, and each EMD pledge.</p> },
  ];
  return (
    <LegalPage eyebrow="" title="Terms of Use & Privacy Policy" meta="Adwiti Technocrats Pvt. Ltd · Effective Date: 15-September-2026 · Applies to every TradeSphereX operating on ADWITIX"
      sections={sections} toc maxWidth={1060} backTo="/trust-and-support" />
  );
}
