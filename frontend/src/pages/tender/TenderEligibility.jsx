import { useState } from 'react';
import './TenderEligibility.css';
import AppHeader from '../../components/AppHeader.jsx';

const LOT = { title: 'Repossessed Excavator, CAT 320D · TSN-2026-3381' };
const INITIAL_INTERESTED = [
  { name: 'Suresh Auto Traders', mobile: '+91 98xxxxxx31', registeredAt: '2026-08-02' },
  { name: 'Kavita Reddy', mobile: '+91 97xxxxxx88', registeredAt: '2026-08-04' },
];
const INITIAL_ELIGIBLE = [
  { name: 'Ramesh Agarwal', source: 'Registered Interest', sourceBg: '#E9EBF2', sourceColor: 'var(--color-text-muted)', grantedAt: '2026-07-30' },
  { name: 'Priyanka Suresh Holdings', source: 'Directly Added', sourceBg: '#F1EDE4', sourceColor: '#9C7430', grantedAt: '2026-07-31' },
];

export default function TenderEligibility() {
  const [interested, setInterested] = useState(INITIAL_INTERESTED);
  const [eligible, setEligible] = useState(INITIAL_ELIGIBLE);
  const [addMobile, setAddMobile] = useState('');

  const approve = (i) => {
    const p = interested[i];
    setInterested(interested.filter((_, idx) => idx !== i));
    setEligible([...eligible, { name: p.name, source: 'Registered Interest', sourceBg: '#E9EBF2', sourceColor: 'var(--color-text-muted)', grantedAt: new Date().toISOString().slice(0, 10) }]);
  };
  const grantDirect = () => {
    if (addMobile.length < 10) return;
    setEligible([...eligible, { name: addMobile, source: 'Directly Added', sourceBg: '#F1EDE4', sourceColor: '#9C7430', grantedAt: new Date().toISOString().slice(0, 10) }]);
    setAddMobile('');
  };

  return (
    <div className="teg-page">
      <AppHeader variant="dark" contextLabel="Tender" backTo="/tender-concierge-console" backLabel="Concierge Console" />
      <main className="teg-main">
        <div className="legal-eyebrow">TSX Master · Tender</div>
        <h1 className="teg-title">Manage Eligibility</h1>
        <p className="teg-sub">{LOT.title} is invitation-only — nobody can bid without being granted eligibility here first.</p>

        <section className="teg-section">
          <h2 className="teg-h2">Registered Interest, Not Yet Eligible</h2>
          <div className="teg-card">
            {interested.map((p, i) => (
              <div key={i} className="teg-row">
                <div><div className="teg-row__name">{p.name}</div><div className="teg-row__meta">{p.mobile} · registered {p.registeredAt}</div></div>
                <button onClick={() => approve(i)} className="teg-approve-btn">Approve</button>
              </div>
            ))}
            {interested.length === 0 && <div className="teg-empty">No pending interest right now.</div>}
          </div>
        </section>

        <section className="teg-section">
          <h2 className="teg-h2">Add a Trader Directly</h2>
          <div className="teg-add-card">
            <input placeholder="Mobile number (+91)" value={addMobile} onChange={(e) => setAddMobile(e.target.value)} className="teg-input" />
            <button onClick={grantDirect} disabled={addMobile.length < 10} className="teg-grant-btn" style={{ background: addMobile.length >= 10 ? 'var(--color-bg-dark)' : '#E9EBF2', color: addMobile.length >= 10 ? '#fff' : 'var(--color-text-faint)' }}>Grant Eligibility</button>
          </div>
          <p className="teg-add-note">Grants access without requiring the Trader to have registered interest first — the eligible list below tracks the difference.</p>
        </section>

        <section>
          <h2 className="teg-h2">Currently Eligible ({eligible.length})</h2>
          <div className="teg-card">
            <div className="teg-table-head"><div>Trader</div><div>Provenance</div><div>Granted</div></div>
            {eligible.map((e, i) => (
              <div key={i} className="teg-table-row">
                <div className="teg-cell-strong">{e.name}</div>
                <div><span className="teg-source-badge" style={{ background: e.sourceBg, color: e.sourceColor }}>{e.source}</span></div>
                <div className="teg-cell-faint">{e.grantedAt}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
