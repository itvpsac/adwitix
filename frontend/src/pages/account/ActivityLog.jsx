import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import './ActivityLog.css';

// No backend endpoint returns the caller's own session/activity history
// yet (the audit_log is readable only via the Super Admin /admin/audit-log),
// so this page shows an honest empty state instead of sample rows.
export default function ActivityLog() {
  return (
    <div className="alog-page">
      <LightDashboardHeader ctas={[{ label: 'Back to Profile', to: '/profile' }]} />
      <main className="alog-main">
        <h1 className="alog-title">Activity Log</h1>
        <p className="alog-sub">A record of sessions on your account — page visited, date &amp; time, approximate location, and device.</p>
        <div className="alog-notice"><p><strong>Not available yet.</strong> Your account activity history is not yet provided by the server, so there is nothing to show here.</p></div>

        <div className="alog-table">
          <div className="alog-row alog-row--head"><div>Date &amp; Time</div><div>Page</div><div>Location</div><div>Device</div><div>IP</div></div>
        </div>
      </main>
    </div>
  );
}
