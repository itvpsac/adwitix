import './TenderEligibility.css';
import AppHeader from '../../components/AppHeader.jsx';

// GET /sale-events/:id/tender/eligibility and POST .../eligibility/grant
// exist but render HTML / redirect (form posts behind CSRF), so the React
// app cannot read or submit them. No invented traders are shown here.
export default function TenderEligibility() {
  return (
    <div className="teg-page">
      <AppHeader variant="dark" contextLabel="Tender" backTo="/tender-concierge-console" backLabel="Concierge Console" />
      <main className="teg-main">
        <div className="legal-eyebrow">TSX Master · Tender</div>
        <h1 className="teg-title">Manage Eligibility</h1>
        <p className="teg-sub">Tender is invitation-only — nobody can bid without being granted eligibility first.</p>

        <section className="teg-section">
          <div className="teg-card">
            <div className="teg-empty">Tender eligibility management is not available yet. Registered interest and eligible traders will appear here once this screen is connected to the platform.</div>
          </div>
        </section>
      </main>
    </div>
  );
}
