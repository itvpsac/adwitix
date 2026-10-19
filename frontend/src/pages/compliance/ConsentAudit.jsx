import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import '../compliance/CustodianShared.css';
import './ConsentAudit.css';

const TYPE_LABEL = { registration_terms: 'Registration Terms', emd_pledge: 'EMD Pledge' };
const TYPES = ['all', ...Object.keys(TYPE_LABEL)];

export default function ConsentAudit() {
  const [showInfo, setShowInfo] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');

  // GET /admin/consent-audit?consent_type= → { entries: [...] } (latest 200)
  const { data, loading } = useApiQuery(() => admin.consentAudit(type === 'all' ? {} : { consent_type: type }), [type]);
  let all = ((data && data.entries) || []).map((e) => ({
    at: (e.created_at || '').slice(0, 16).replace('T', ' '),
    user: e.mobile_number,
    type: TYPE_LABEL[e.consent_type] || e.consent_type,
    version: e.terms_version,
    ip: e.ip_address,
  }));
  const q = query.trim().toLowerCase();
  if (q) all = all.filter((e) => [e.user, e.ip].join(' ').toLowerCase().includes(q));

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
          <input placeholder="Search — mobile, IP address…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <span className="custodian-search__icon">⌕</span>
        </div>
        <div className="custodian-filters">
          {TYPES.map((v) => (
            <button key={v} onClick={() => setType(v)} className={`custodian-filter-pill${type === v ? ' custodian-filter-pill--active' : ''}`}>{v === 'all' ? 'All' : TYPE_LABEL[v]}</button>
          ))}
        </div>

        <div className="ca-table">
          <div className="ca-row ca-row--head"><span>Timestamp</span><span>User</span><span>Consent</span><span>Version</span></div>
          {all.map((e, i) => (
            <div key={i} className="ca-row">
              <span className="ca-cell-time">{e.at}</span>
              <span>{e.user}{e.ip && <span className="ca-cell-role"> ({e.ip})</span>}</span>
              <span>{e.type}</span>
              <span className="ca-cell-version">{e.version}</span>
            </div>
          ))}
        </div>
        {loading && <div className="custodian-empty">Loading consent records…</div>}
        {!loading && all.length === 0 && <div className="custodian-empty">No consent records match your search/filter.</div>}
      </main>
    </div>
  );
}
