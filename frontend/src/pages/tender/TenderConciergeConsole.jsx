import { useState } from 'react';
import './TenderConciergeConsole.css';
import AppHeader from '../../components/AppHeader.jsx';

// The backend's Tender routes (TenderController, /sale-events/:id/tender/*)
// are server-rendered HTML pages and form POSTs that answer with redirects;
// none returns JSON, the POSTs sit behind CSRF, and there is no endpoint to
// list Tenders, invitees, documents, the EMD log or sealed offers, nor to
// revoke eligibility or unpublish a document. Until JSON counterparts exist
// under /api/v1/app, this console shows no data rather than invented data.
const TAB_DEFS = [
  { key: 'eligibility', label: 'Eligibility & Invitations' },
  { key: 'documents', label: 'Documents' },
  { key: 'emd', label: 'EMD Log' },
  { key: 'closing', label: 'Closing' },
];

export default function TenderConciergeConsole() {
  const [tab, setTab] = useState('eligibility');
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="tcc-page">
      <AppHeader variant="dark" contextLabel="CoCo Concierge" contextNav={[{ label: "Console", to: "/tender-concierge-console", active: true }, { label: "Eligibility", to: "/tender-eligibility" }, { label: "Report", to: "/tender-auction-report" }, { label: "Stakeholder View", to: "/tender-stakeholder-view" }]} />

      <main className="tcc-main">
        <div className="legal-eyebrow">CoCo Concierge</div>
        <div className="tcc-title-row">
          <h1 className="tcc-title">Tender Auction Back Office</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="tcc-info-btn">i</button>
        </div>
        <p className="tcc-sub">Tender is fully private and invite-only, run exclusively through the Concierge team — no self-service seller tools apply here.</p>

        {showInfo && (
          <div className="tcc-info-box">
            <strong>Why this screen exists:</strong> Tender Auctions carry no fixed edit-hold window, no gateway EMD routing, and no automatic close — every step is Concierge-operated by hand, per BR-12/BR-26. This console covers the four operational pieces that self-service Lot flows don't need: who's invited, what's published to them, manually-logged EMD, and the manual close itself.
            <button onClick={() => setShowInfo(false)} className="tcc-info-close">Close</button>
          </div>
        )}

        <div className="tcc-tabs">
          {TAB_DEFS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`tcc-tab${tab === t.key ? ' tcc-tab--active' : ''}`}>{t.label}</button>
          ))}
        </div>

        <div className="tcc-card">
          <div className="tcc-card__title">Tender concierge is not available yet</div>
          <p className="tcc-card__note">
            {tab === 'eligibility' && 'Inviting stakeholders, listing invitees and revoking eligibility are not yet connected to the platform.'}
            {tab === 'documents' && 'Publishing and listing Tender documents is not yet connected to the platform.'}
            {tab === 'emd' && 'Logging and listing manual EMD transfers is not yet connected to the platform.'}
            {tab === 'closing' && 'Closing bidding, revealing sealed offers and awarding a Tender are not yet connected to the platform.'}
            {' '}No Tender data is shown here until it can be loaded from the platform.
          </p>
        </div>
      </main>
    </div>
  );
}
