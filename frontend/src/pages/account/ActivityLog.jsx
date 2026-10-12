import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import './ActivityLog.css';

const LOG_ENTRIES = [
  { datetime: '2026-08-02 12:41', page: 'KYC — Identity Verification', location: 'Noida, UP, IN', device: 'Chrome · Android', ip: '103.21.x.x' },
  { datetime: '2026-08-02 09:15', page: 'Buyer Dashboard', location: 'Noida, UP, IN', device: 'Chrome · Android', ip: '103.21.x.x' },
  { datetime: '2026-08-01 21:03', page: 'Payout Bank', location: 'Noida, UP, IN', device: 'Safari · iPhone', ip: '49.36.x.x' },
  { datetime: '2026-08-01 18:47', page: 'Lot #4501 — Warehouse Racking', location: 'Noida, UP, IN', device: 'Chrome · Windows', ip: '117.98.x.x' },
  { datetime: '2026-07-30 08:22', page: 'Profile', location: 'Gurugram, HR, IN', device: 'Chrome · Android', ip: '106.51.x.x' },
  { datetime: '2026-07-28 14:10', page: 'My Purchases', location: 'Noida, UP, IN', device: 'Chrome · Windows', ip: '117.98.x.x' },
  { datetime: '2026-07-25 20:36', page: 'Trust & Support — FAQ', location: 'Noida, UP, IN', device: 'Safari · iPhone', ip: '49.36.x.x' },
  { datetime: '2026-07-20 10:05', page: 'Login', location: 'Noida, UP, IN', device: 'Chrome · Android', ip: '103.21.x.x' },
];

export default function ActivityLog() {
  return (
    <div className="alog-page">
      <LightDashboardHeader ctas={[{ label: 'Back to Profile', to: '/profile' }]} />
      <main className="alog-main">
        <h1 className="alog-title">Activity Log</h1>
        <p className="alog-sub">A record of sessions on your account — page visited, date &amp; time, approximate location, and device.</p>
        <div className="alog-notice"><p><strong>Illustrative mockup.</strong> This table shows sample data to demonstrate the layout — live location/device capture requires backend telemetry not wired up in this design.</p></div>

        <div className="alog-table">
          <div className="alog-row alog-row--head"><div>Date &amp; Time</div><div>Page</div><div>Location</div><div>Device</div><div>IP</div></div>
          {LOG_ENTRIES.map((l, i) => (
            <div key={i} className="alog-row">
              <div className="alog-cell-time">{l.datetime}</div>
              <div className="alog-cell-page">{l.page}</div>
              <div className="alog-cell-loc">{l.location}</div>
              <div className="alog-cell-device">{l.device}</div>
              <div className="alog-cell-ip">{l.ip}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
