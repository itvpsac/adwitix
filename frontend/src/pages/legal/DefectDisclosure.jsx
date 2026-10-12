import { useState } from 'react';
import { Link } from 'react-router-dom';
import './DefectDisclosure.css';
import AppHeader from '../../components/AppHeader.jsx';

export default function DefectDisclosure() {
  const [form, setForm] = useState({ knownDamage: '', missingComponents: '', nonfunctional: '' });
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="ddis-page">
      <AppHeader variant="light" backTo="/create-lot" backLabel="Create a Lot" />
      <main className="ddis-main">
        {!submitted ? (
          <>
            <h1 className="ddis-title">Defect Disclosure — Express Auction</h1>
            <p className="ddis-desc">Express Auctions have no inspection window, so this checklist is your only way to give Traders accurate information before they bid sight-unseen. Answer honestly — a false disclosure here can be filed as a Condition/Delivery Dispute even though Express is otherwise buyer-beware.</p>

            <div className="ddis-fields">
              <div>
                <label>Known Damage</label>
                <textarea placeholder="e.g. Minor dent on rear panel, none if not applicable" rows={3} value={form.knownDamage} onChange={(e) => setForm({ ...form, knownDamage: e.target.value })} />
              </div>
              <div>
                <label>Missing Components</label>
                <textarea placeholder="e.g. Missing original charger, none if not applicable" rows={3} value={form.missingComponents} onChange={(e) => setForm({ ...form, missingComponents: e.target.value })} />
              </div>
              <div>
                <label>Non-Functional Aspects</label>
                <textarea placeholder="e.g. AC not working, none if not applicable" rows={3} value={form.nonfunctional} onChange={(e) => setForm({ ...form, nonfunctional: e.target.value })} />
              </div>
            </div>
            <button className="ddis-submit" onClick={() => setSubmitted(true)}>Complete Disclosure</button>
          </>
        ) : (
          <div className="ddis-success">
            <div className="ddis-success__title">Disclosure Complete</div>
            <p>Your defect disclosure is attached to this listing and will be shown to every bidder before Express bidding opens.</p>
            <Link to="/create-lot" className="ddis-success__link">Back to Listing →</Link>
          </div>
        )}
      </main>
    </div>
  );
}
