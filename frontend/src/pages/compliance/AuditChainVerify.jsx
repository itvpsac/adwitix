import DashboardHeader from '../../components/DashboardHeader.jsx';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import '../compliance/CustodianShared.css';
import './AuditChainVerify.css';

export default function AuditChainVerify() {
  // GET /admin/audit-log/verify → { brokenAt: null | sequence number }
  const { data, loading, error, reload } = useApiQuery(() => admin.auditLogVerify(), []);
  const brokenAt = data && data.brokenAt;
  const status = loading ? 'running' : error ? 'error' : brokenAt == null ? 'clean' : 'broken';

  return (
    <div className="custodian-page">
      <DashboardHeader navItems={[{ label: 'Audit Ledger', to: '/audit-ledger' }, { label: 'Integrity Check', to: '/audit-chain-verify', active: true }]} />
      <main className="custodian-main custodian-main--narrow">
        <div className="legal-eyebrow">Custodian</div>
        <h1 className="custodian-title custodian-title--sm">Audit Log Integrity</h1>
        <p className="acv-sub">Recomputes each hash-chained audit record's content hash and compares it against what's on file — detects retroactive tampering, including by someone with raw database access (BR-05).</p>

        <button onClick={reload} disabled={loading} className="acv-run-btn">{loading ? 'Verifying…' : 'Re-run Verification'}</button>

        {status === 'error' && (
          <div className="acv-result acv-result--broken">
            <div className="acv-result__title">Verification could not run</div>
            <p className="acv-result__body">{error.message || 'The integrity check failed to complete.'}</p>
          </div>
        )}
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
