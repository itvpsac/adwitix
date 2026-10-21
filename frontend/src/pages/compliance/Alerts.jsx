import { useState } from 'react';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { pushLedger, loadJSON, saveJSON } from '../../utils/auditLedger.js';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import '../compliance/CustodianShared.css';
import './Alerts.css';

const SEV_META = {
  Critical: { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', stripe: 'var(--color-danger)' },
  Warning: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', stripe: 'var(--color-accent)' },
  Info: { color: '#2B5C8A', bg: '#E6EEF5', stripe: '#6F91B5' },
};
const SEVS = ['all', 'Critical', 'Warning', 'Info'];

export default function Alerts() {
  const [showInfo, setShowInfo] = useState(false);
  const [sev, setSev] = useState('all');
  const [dismissed, setDismissed] = useState(loadJSON('adwitix_alerts_dismissed', []));
  const [actionError, setActionError] = useState('');

  const { data: apiData, loading: apiLoading, error: apiError, reload } = useApiQuery(() => admin.alerts(), []);
  // GET /admin/alerts returns one list per condition; flatten them into
  // the feed this screen renders.
  const d = apiData || {};
  const at = (v) => (v || '').slice(0, 16).replace('T', ' ');
  const source = [
    ...(d.amlFlags || []).map((f) => ({
      id: `aml-${f.id}`, severity: 'Critical', category: 'AML', at: at(f.created_at),
      title: `AML flag — ${f.mobile_number || f.party_id}`, detail: `${(f.flag_type || 'aml_flag').replace(/_/g, ' ')} — open AML flag awaiting review.`, href: '/aml-monitoring',
    })),
    ...(d.stalledSettlements || []).map((x) => ({
      id: `stl-${x.id}`, severity: 'Critical', category: 'Settlement', at: at(x.created_at),
      title: 'Settlement stalled', detail: `Settlement ${x.id} has passed its SLA without both NOCs.`, href: `/settlement?id=${x.id}`,
    })),
    ...(d.openDisputes || []).map((x) => ({
      id: `dsp-${x.id}`, severity: 'Warning', category: 'Dispute', at: at(x.created_at),
      title: `Dispute ${x.status === 'appealed' ? 'appealed' : 'open'}`, detail: x.description || `Dispute ${x.id} (${x.status}).`, href: `/dispute-center?id=${x.id}`,
    })),
    ...(d.pendingPayoutReviews || []).map((x) => ({
      id: `pay-${x.id}`, severity: 'Warning', category: 'Payout', at: at(x.created_at),
      title: 'Payout release awaiting review', detail: `₹${Number(x.amount || 0).toLocaleString('en-IN')} ${(x.release_type || '').replace(/_/g, ' ')} awaiting review.`, href: '/payout-reviews',
    })),
    ...(d.pendingRatingReviews || []).map((x) => ({
      id: `rat-${x.id}`, severity: 'Info', category: 'Rating', at: at(x.created_at),
      title: `Rating change pending — ${x.mobile_number || x.party_id}`, detail: x.reason || 'Downgrade awaiting approval.', href: '/rating-reviews',
    })),
    ...(d.driftAlerts || []).map((x) => ({
      id: `drift-${x.id}`, severity: 'Critical', category: 'Server time', at: at(x.checked_at),
      title: 'Server clock drift', detail: Number(x.ntp_reachable) === 0 || x.drift_seconds == null ? `NTP host ${x.ntp_host || ''} was unreachable at the last check.` : `Drift of ${x.drift_seconds}s is outside the ${x.tolerance_seconds}s tolerance.`, href: '/alerts', driftId: x.id,
    })),
  ];
  let all = source.filter((a) => !dismissed.includes(a.id));
  if (sev !== 'all') all = all.filter((a) => a.severity === sev);

  const dismiss = async (a) => {
    setActionError('');
    if (a.driftId) {
      // Drift alerts are acknowledged server-side; the API drops them from
      // the list, so no local dismiss is needed.
      try {
        await admin.acknowledgeServerTimeDrift(a.driftId);
        pushLedger('Acknowledged Alert', a.title, a.detail);
        reload();
      } catch (e) {
        setActionError(e.message || 'Could not acknowledge the drift alert.');
      }
      return;
    }
    const next = [...dismissed, a.id];
    saveJSON('adwitix_alerts_dismissed', next);
    pushLedger('Dismissed Alert', a.title, a.detail);
    setDismissed(next);
  };

  return (
    <ConsoleFrame header={<DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Alerts', to: '/alerts', active: true }]} />}>
    <div className="custodian-page">
      <main className="custodian-main">
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">Alerts</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="custodian-info-btn">i</button>
        </div>
        <p className="custodian-sub">Platform-wide conditions that need Custodian attention — compliance flags, stalled processes, and pending reviews aging past their SLA.</p>
        {showInfo && (
          <div className="custodian-info-box">
            <strong>Why this screen exists:</strong> This feed surfaces conditions flagged by the platform's compliance rules — AML monitoring, settlement SLAs, KYC review windows, payout cooling-off, and media/rating disputes — so nothing ages silently.
            <button onClick={() => setShowInfo(false)} className="custodian-info-close">Close</button>
          </div>
        )}

        <div className="custodian-filters">
          {SEVS.map((v) => (
            <button key={v} onClick={() => setSev(v)} className={`custodian-filter-pill${sev === v ? ' custodian-filter-pill--active' : ''}`}>{v === 'all' ? 'All' : v}</button>
          ))}
        </div>

        <div className="alert-list">
          {all.map((a) => {
            const meta = SEV_META[a.severity];
            return (
              <div key={a.id} className="alert-row" style={{ borderLeftColor: meta.stripe }}>
                <div className="alert-row__body">
                  <div className="alert-row__head">
                    <span className="alert-sev" style={{ color: meta.color, background: meta.bg }}>{a.severity}</span>
                    <span className="alert-category">{a.category}</span>
                    <span className="alert-time">{a.at}</span>
                  </div>
                  <div className="alert-title">{a.title}</div>
                  <div className="alert-detail">{a.detail}</div>
                </div>
                <div className="alert-actions">
                  <a href={a.href} className="alert-review-btn">Review →</a>
                  <button onClick={() => dismiss(a)} className="alert-dismiss-btn" title={a.driftId ? 'Acknowledge on the server' : 'Hide in this browser only — the underlying condition stays open'}>{a.driftId ? 'Acknowledge' : 'Dismiss'}</button>
                </div>
              </div>
            );
          })}
        </div>
        {actionError && <div className="custodian-empty" style={{ color: 'var(--color-danger)' }}>{actionError}</div>}
        {apiLoading && <div className="custodian-empty">Loading alerts…</div>}
        {!apiLoading && apiError && <div className="custodian-empty" style={{ color: 'var(--color-danger)' }}>Could not load alerts: {apiError.message || 'request failed'}.</div>}
        {!apiLoading && !apiError && all.length === 0 && <div className="custodian-empty">No alerts right now.</div>}
      </main>
    </div>
    </ConsoleFrame>
  );
}
