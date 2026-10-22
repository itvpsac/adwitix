import './TenderStakeholderView.css';
import AppHeader from '../../components/AppHeader.jsx';

// GET /tender-view/:token exists but renders an HTML page, not JSON, and
// this route carries no token. No invented bid history is shown here.
export default function TenderStakeholderView() {
  return (
    <div className="tsv-page">
      <AppHeader variant="light" contextLabel="Stakeholder View — No Login" />
      <main className="tsv-main">
        <div className="legal-eyebrow">Tender · Stakeholder View</div>
        <h1 className="tsv-title">Tender Live View</h1>

        <div className="tsv-notice">This is a shared, read-only view for interested parties. In keeping with Tender confidentiality, <strong>no bidder identity is ever shown here</strong> — only bid amounts, in sequence.</div>

        <h2 className="tsv-h2">Bid History — Amounts Only</h2>
        <div className="tsv-card">
          <div className="tsv-table-row"><div className="tsv-cell-faint" style={{ gridColumn: '1 / -1' }}>The Tender stakeholder view is not available yet. Bid amounts will appear here once shared links are connected to the platform.</div></div>
        </div>
      </main>
    </div>
  );
}
