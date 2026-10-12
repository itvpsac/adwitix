import LegalPage from '../../components/LegalPage.jsx';

export default function RefundAndCancellationPolicy() {
  const sections = [
    { id: 's1', title: '1. Scope', body: <p>1.1. This Policy explains when an EMD is refunded, when it is forfeited, and how Lot or Trading Session cancellations are handled on ADWITIX. It should be read together with our Fee &amp; Charges Schedule and Terms of Usage.</p> },
    { id: 's2', title: '2. EMD Refunds', body: (
      <>
        <p>2.1. An EMD pledged on a bid or offer is refunded in full, automatically, the moment it is no longer required — for example, when a Trader is outbid, not selected, or a transaction formally closes with a balance remaining.</p>
        <p>2.2. Refunds are processed as soon as operationally possible. No fixed turnaround time is guaranteed, though refunds are not intentionally delayed.</p>
        <p>2.3. Any Payment Gateway collection charge added at the time of deposit is not itself refunded, as it is a pass-through charge for processing the original transaction, not a platform fee.</p>
      </>
    )},
    { id: 's3', title: '3. Forfeiture (When a Deposit Is Not Refunded)', body: (
      <>
        <p>3.1. If a winning Trader fails to complete payment within the applicable window, their EMD is forfeited in full — this is not a refundable event.</p>
        <p>3.2. In a standard default, the forfeited amount is applied first to platform/TSX commission, with the remainder passed to the Market Maker as compensation.</p>
        <p>3.3. In a full cascade failure on Express or Easy Auctions (the winning bidder and up to two subsequent bidders all default in sequence), all forfeited amounts are retained by the Platform; none is passed to the Market Maker. Full detail and worked examples appear in the Fee &amp; Charges Schedule.</p>
      </>
    )},
    { id: 's4', title: '4. Withdrawing an Offer or Bid', body: (
      <>
        <p>4.1. Buy-Now: an offer may be withdrawn before the Market Maker accepts it, provided the Trader states a reason from the list provided in-app. No reason is required if the offer simply lapses unactioned after 3 days.</p>
        <p>4.2. Easy and Express Auctions: once a bid is placed and the required EMD is pledged, it stands for the remainder of that Trading Session. There is no separate mid-auction bid withdrawal mechanism distinct from being outbid.</p>
        <p>4.3. Tender Auction: withdrawal and its consequences are entirely as set by the Market Maker for that specific auction.</p>
      </>
    )},
    { id: 's5', title: '5. Listing & Trading Session Cancellation', body: (
      <>
        <p>5.1. A Market Maker may request a change to an approved Lot at any time; if an active Trading Session is attached, that session is cancelled and all active bids/deposits are refunded in full, with bidders notified. The Lot is then archived and a new version re-enters approval.</p>
        <p>5.2. Once a Trading Session is live, it cannot be cancelled by the Market Maker directly (Express Auctions cannot be cancelled by the Market Maker at all). The TSX Master or Custodian may terminate any live session via an Emergency Stop, with a mandatory, logged reason, in which case all active bids/deposits are refunded in full.</p>
      </>
    )},
    { id: 's6', title: '6. Verified Lot Inspection Fee', body: <p>6.1. The inspection fee for a Verified Lot is payable before inspection is scheduled.</p> },
    { id: 's7', title: '7. How Refunds Are Paid', body: <p>7.1. Refunds are paid to the account originally used to fund the deposit. A different payout account may only be used if it has been formally verified and any required cooling-off period has elapsed, per the Terms of Usage.</p> },
    { id: 's8', title: '8. Contact', body: <p>Questions about a specific refund or forfeiture should be raised through our <a href="/dispute-resolution-process">Dispute Resolution Process</a> or directly with your TradeSphereX's support channel.</p> },
  ];
  return (
    <LegalPage eyebrow="Legal" title="Refund & Cancellation Policy" meta={<>Adwiti Technocrats Pvt. Ltd · Effective Date: 15-September-2026 · Contact: <a href="/trust-and-support">Contact Us</a></>}
      sections={sections} maxWidth={760}
      footerNote={<>See also our <a href="/pricing">Fee &amp; Charges Schedule</a> and <a href="/terms-of-usage">Terms of Usage</a>.</>} />
  );
}
