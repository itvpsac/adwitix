import { useState } from 'react';
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

  const { data: apiData, loading: apiLoading } = useApiQuery(() => admin.alerts(), []);
  const apiAlerts = (apiData && (apiData.alerts || apiData.rows)) || [];
  const source = apiAlerts.map((a, i) => ({
    id: a.id || `API-${i}`,
    severity: a.severity === 'critical' ? 'Critical' : a.severity === 'warning' ? 'Warning' : 'Info',
    category: a.category || a.type || 'Platform',
    at: (a.created_at || a.at || '').slice(0, 16).replace('T', ' '),
    title: a.title || a.message || 'Alert',
    detail: a.detail || a.description || '',
    href: a.href || '/custodian/dashboard',
  }));
  let all = source.filter((a) => !dismissed.includes(a.id));
  if (sev !== 'all') all = all.filter((a) => a.severity === sev);

  const dismiss = (a) => {
    const next = [...dismissed, a.id];
    saveJSON('adwitix_alerts_dismissed', next);
    pushLedger('Dismissed Alert', a.title, a.detail);
    setDismissed(next);
  };

  return (
    <div className="custodian-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Alerts', to: '/alerts', active: true }]} />
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
                  <button onClick={() => dismiss(a)} className="alert-dismiss-btn">Dismiss</button>
                </div>
              </div>
            );
          })}
        </div>
        {!apiLoading && all.length === 0 && <div className="custodian-empty">No alerts right now.</div>}
      </main>
    </div>
  );
}
