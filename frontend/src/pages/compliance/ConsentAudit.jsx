import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import '../compliance/CustodianShared.css';
import './ConsentAudit.css';

const ENTRIES = [
  { at: '2026-08-01 08:02', user: 'Priya Rao', role: 'Trader', type: 'Terms of Usage', version: 'v3.2' },
  { at: '2026-08-01 08:02', user: 'Priya Rao', role: 'Trader', type: 'Privacy Policy', version: 'v2.4' },
  { at: '2026-07-31 15:40', user: 'Northline Salvage Co.', role: 'Market Maker', type: 'KYC Data Consent', version: 'v1.1' },
  { at: '2026-07-30 12:10', user: 'Arjun Verma', role: 'Trader', type: 'Cookie Policy', version: 'v1.0' },
  { at: '2026-07-29 09:22', user: 'Ravindra Auto Traders', role: 'Market Maker', type: 'Terms of Usage', version: 'v3.2' },
  { at: '2026-07-28 17:05', user: 'Coastal Scrap Metals', role: 'Market Maker', type: 'KYC Data Consent', version: 'v1.1' },
];
const TYPES = ['all', 'Terms of Usage', 'Privacy Policy', 'Cookie Policy', 'KYC Data Consent'];

export default function ConsentAudit() {
  const [showInfo, setShowInfo] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');

  let all = ENTRIES;
  if (type !== 'all') all = all.filter((e) => e.type === type);
  const q = query.trim().toLowerCase();
  if (q) all = all.filter((e) => [e.user, e.role].join(' ').toLowerCase().includes(q));

  return (
    <div className="custodian-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Consent Audit', to: '/consent-audit', active: true }]} />
      <main className="custodian-main custodian-main--wide">
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">Consent Audit</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="custodian-info-btn">i</button>
        </div>
        <p className="custodian-sub">Append-only log of every consent a user has given — Terms of Usage, Privacy Policy, Cookie Policy, KYC data-sharing — with the document version and timestamp on record.</p>
        {showInfo && (
          <div className="custodian-info-box">
            <strong>Why this screen exists:</strong> Every acceptance of Terms of Usage, Privacy Policy, Cookie Policy, or KYC data consent is recorded with the document version and timestamp, forming an append-only compliance record.
            <button onClick={() => setShowInfo(false)} className="custodian-info-close">Close</button>
          </div>
        )}

        <div className="custodian-search">
          <input placeholder="Search — user name, mobile…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <span className="custodian-search__icon">⌕</span>
        </div>
        <div className="custodian-filters">
          {TYPES.map((v) => (
            <button key={v} onClick={() => setType(v)} className={`custodian-filter-pill${type === v ? ' custodian-filter-pill--active' : ''}`}>{v === 'all' ? 'All' : v}</button>
          ))}
        </div>

        <div className="ca-table">
          <div className="ca-row ca-row--head"><span>Timestamp</span><span>User</span><span>Consent</span><span>Version</span></div>
          {all.map((e, i) => (
            <div key={i} className="ca-row">
              <span className="ca-cell-time">{e.at}</span>
              <span>{e.user} <span className="ca-cell-role">({e.role})</span></span>
              <span>{e.type}</span>
              <span className="ca-cell-version">{e.version}</span>
            </div>
          ))}
        </div>
        {all.length === 0 && <div className="custodian-empty">No consent records match your search/filter.</div>}
      </main>
    </div>
  );
}
