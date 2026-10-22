import './TenderAuctionReport.css';
import AppHeader from '../../components/AppHeader.jsx';

// GET /sale-events/:id/tender/report exists but renders an HTML view
// (TenderReviewService::generateAuctionReport → tender/auction_report),
// not JSON, and this route carries no sale event id. No invented report
// is shown here.
export default function TenderAuctionReport() {
  return (
    <div className="tar-page">
      <AppHeader variant="dark" contextLabel="Tender" backTo="/tender-concierge-console" backLabel="Concierge Console" />
      <main className="tar-main">
        <div className="legal-eyebrow">Tender Auction Report</div>
        <h1 className="tar-title">Auction Report</h1>
        <p className="tar-sub">Eligible participants, bid history, EMD log and review rounds for a closed Tender.</p>

        <section className="tar-section">
          <div className="tar-card">
            <div className="tar-simple-row"><span className="tar-simple-row__name">The Tender auction report is not available yet. It will appear here once this screen is connected to the platform.</span></div>
          </div>
        </section>
      </main>
    </div>
  );
}
