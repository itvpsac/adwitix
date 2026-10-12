import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import { me } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import './RatingHistory.css';

const TYPE_META = {
  upgrade: { label: 'Upgrade', color: 'var(--color-success)' },
  downgrade: { label: 'Downgrade', color: 'var(--color-danger)' },
  forced_neutral: { label: 'Forced Neutral', color: 'var(--color-text-faint)' },
};
const STATUS_META = { applied: 'Applied', pending_dual_approval: 'Pending Dual Approval', pending_tenant_admin_approval: 'Pending Tenant Admin' };

export default function RatingHistory() {
  const { data: apiData, loading: apiLoading } = useApiQuery(() => me.ratingHistory(), []);
  const apiEvents = (apiData && apiData.events) || [];
  const source = apiEvents.map((e) => ({
    date: (e.created_at || '').slice(0, 10),
    role: e.role === 'seller_star_rating' ? 'seller_star_rating' : 'star_rating',
    type: e.event_type === 'downgrade' ? 'downgrade' : e.event_type === 'forced_neutral' ? 'forced_neutral' : 'upgrade',
    previousValue: Number(e.previous_value ?? 3),
    newValue: Number(e.new_value ?? 3),
    reason: e.reason || '—',
    status: e.status || 'applied',
    appealed: !!e.appealed_at,
    appealOutcome: e.appeal_outcome || null,
  }));

  const events = source.map((e) => ({
    ...e,
    roleLabel: e.role === 'star_rating' ? 'Trader' : 'Market Maker',
    typeLabel: TYPE_META[e.type].label,
    typeColor: TYPE_META[e.type].color,
    statusLabel: STATUS_META[e.status] || e.status,
    appealSuffix: e.appealOutcome ? `: ${e.appealOutcome}` : '',
  }));

  return (
    <div className="rh-page">
      <LightDashboardHeader ctas={[{ label: '← Back to Star Ratings', to: '/star-ratings' }]} />
      <main className="rh-main">
        <h1 className="rh-title">Rating History</h1>
        <p className="rh-sub">Every rating change on your account, in both roles — real, permanent, audit-trail data.</p>

        <div className="rh-table">
          <div className="rh-row rh-row--head"><div>Date</div><div>Role</div><div>Type</div><div>Change</div><div>Reason</div><div>Status</div></div>
          {events.map((e, i) => (
            <div key={i} className="rh-row">
              <div className="rh-cell-date">{e.date}</div>
              <div className="rh-cell-role">{e.roleLabel}</div>
              <div className="rh-cell-type" style={{ color: e.typeColor }}>{e.typeLabel}</div>
              <div className="rh-cell-change">★{e.previousValue.toFixed(1)}→★{e.newValue.toFixed(1)}</div>
              <div className="rh-cell-reason">{e.reason}</div>
              <div className="rh-cell-status">{e.statusLabel}{e.appealed && <div className="rh-appealed">Appealed{e.appealSuffix}</div>}</div>
            </div>
          ))}
        </div>
        {!apiLoading && events.length === 0 && <p className="rh-empty">No rating events yet — every transaction starts at a neutral 3.0★.</p>}
      </main>
    </div>
  );
}
