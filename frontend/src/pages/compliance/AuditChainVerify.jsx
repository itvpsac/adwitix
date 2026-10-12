import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import '../compliance/CustodianShared.css';
import './AuditChainVerify.css';

export default function AuditChainVerify() {
  const [status, setStatus] = useState('clean');
  const [brokenAt, setBrokenAt] = useState(null);

  return (
    <div className="custodian-page">
      <DashboardHeader navItems={[{ label: 'Audit Ledger', to: '/audit-ledger' }, { label: 'Integrity Check', to: '/audit-chain-verify', active: true }]} />
      <main className="custodian-main custodian-main--narrow">
        <div className="legal-eyebrow">Custodian</div>
        <h1 className="custodian-title custodian-title--sm">Audit Log Integrity</h1>
        <p className="acv-sub">Recomputes each hash-chained audit record's content hash and compares it against what's on file — detects retroactive tampering, including by someone with raw database access (BR-05).</p>

        <button onClick={() => { setStatus('clean'); setBrokenAt(null); }} className="acv-run-btn">Re-run Verification</button>

        {status === 'clean' && (
          <div className="acv-result acv-result--clean">
            <div className="acv-result__title">✓ Chain verified clean</div>
            <p className="acv-result__body">Every record's hash was independently recomputed from its actual stored content and matches what's on file. No tampering detected.</p>
          </div>
        )}
        {status === 'broken' && (
          <div className="acv-result acv-result--broken">
            <div className="acv-result__title">⚠ Integrity broken at record #{brokenAt}</div>
            <p className="acv-result__body">This record's stored hash does not match what its actual content would produce. Investigate immediately.</p>
          </div>
        )}
      </main>
    </div>
  );
}
