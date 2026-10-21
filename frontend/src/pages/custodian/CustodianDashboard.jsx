import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CustodianShell from '../../components/custodian/CustodianShell.jsx';
import { admin } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { formatCurrency } from '../../utils/format.js';
import { QUEUE_TYPES, ageLabel } from './decisionTypes.js';
import './CustodianDashboard.css';

// Command Center: the Custodian's landing page. Data:
// GET /admin (counts, tenants, stalled aging, disposals, newest users),
// GET /admin/decision-queue (what is waiting) and GET /admin/system-health.
const humanize = (v) => (v ? String(v).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—');
const TIER_LABEL = { coco_starter: 'CoCo Starter', tsx_launch: 'Launch', tsx_growth: 'Growth', tsx_enterprise: 'Enterprise' };
const plural = (n, word) => `${n} ${word}${Number(n) === 1 ? '' : 's'}`;
const day = (d) => (d ? String(d).slice(0, 10) : '—');
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const signedCurrency = (v) => (Number(v) > 0 ? '+' : Number(v) < 0 ? '−' : '') + formatCurrency(Math.abs(Number(v) || 0));
const KYC_CLASS = { Verified: 'ok', Approved: 'ok', Pending: 'warn', Submitted: 'warn', Suspended: 'bad', Rejected: 'bad' };
const STATUS_CLASS = { Active: 'ok', 'Shadow-banned': 'warn', Delisted: 'bad' };

function toView(raw) {
  return {
    openDisputes: raw.openDisputes ?? 0,
    stalledSettlements: raw.stalledSettlements ?? 0,
    openAmlFlags: raw.openAmlFlags ?? 0,
    bidsPlacedToday: raw.bidsPlacedToday ?? 0,
    salesClosedToday: raw.salesClosedToday ?? 0,
    disputesFiledToday: raw.disputesFiledToday ?? 0,
    newByFormat: (raw.listingsByFormatToday || []).map((r) => ({ format: String(r.sale_format || '').toUpperCase().replace('_', '-'), count: Number(r.cnt) || 0 })),
    tenants: (raw.tenants || []).map((t) => ({
      id: t.id, name: t.name, tenantClass: humanize(t.tenant_class), subdomain: t.subdomain || '—',
      tier: TIER_LABEL[t.subscription_tier] || humanize(t.subscription_tier), suspended: !!t.suspended_at,
    })),
    stalledAging: (raw.stalledAging || []).map((r) => ({ id: r.id, amount: formatCurrency(r.final_price), since: day(r.stalled_since || r.created_at), daysStalled: r.days_stalled })),
    highValueDisposals: (raw.highValueDisposals || []).map((r) => ({
      id: r.id, tenantName: r.tenant_name, format: String(r.sale_format || '').toUpperCase(),
      finalValue: formatCurrency(r.final_sale_value), variance: signedCurrency(r.variance), date: day(r.created_at),
    })),
    users: (raw.recentUsers || []).map((u) => ({
      id: u.id,
      mobile: u.mobile_number || '—',
      name: u.full_name || u.mobile_number || '—',
      type: (u.entity_type || 'individual').toLowerCase() === 'organization' ? 'Business' : 'Individual',
      kyc: u.kyc_status ? u.kyc_status.charAt(0).toUpperCase() + u.kyc_status.slice(1) : 'Pending',
      traderRating: Number(u.star_rating ?? 0).toFixed(1),
      mmRating: Number(u.seller_star_rating ?? 0).toFixed(1),
      status: u.seller_delisted_at ? 'Delisted' : (u.shadow_banned_at_buyer || u.shadow_banned_at_seller) ? 'Shadow-banned' : 'Active',
    })),
  };
}

// Queue items grouped by type: count, oldest wait, any overdue.
function summarizeQueue(items) {
  const byType = {};
  items.forEach((it) => {
    const g = byType[it.type] || (byType[it.type] = { type: it.type, count: 0, oldest: null, overdue: false, owner: it.owner });
    g.count += 1;
    g.overdue = g.overdue || it.overdue;
    if (it.since && (!g.oldest || it.since < g.oldest)) g.oldest = it.since;
  });
  return Object.values(byType).sort((a, b) => (b.overdue - a.overdue) || String(a.oldest).localeCompare(String(b.oldest)));
}

export default function CustodianDashboard() {
  const [data, setData] = useState(null);
  const [queue, setQueue] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [loadedAt, setLoadedAt] = useState(null);

  const load = useCallback(() => {
    setError('');
    Promise.all([admin.dashboard(), admin.decisionQueue(), admin.systemHealth().catch(() => null)])
      .then(([d, q, h]) => {
        setData(toView(unwrap(d) || {}));
        setQueue(unwrap(q) || { items: [], total: 0 });
        setHealth(h ? unwrap(h) : null);
        setLoadedAt(new Date());
      })
      .catch((err) => setError(err.description || err.message || 'Could not load the Command Center.'));
  }, []);
  useEffect(() => { load(); }, [load]);

  const d = data || toView({});
  const items = queue?.items || [];
  const groups = summarizeQueue(items);
  const overdueCount = items.filter((i) => i.overdue).length;
  const oldest = items.length ? items[0].since : null;
  const v = (n) => (data ? n : '…');
  const media = health?.media;

  return (
    <CustodianShell>
      <div className="cc-wrap">
        <div className="cc-head">
          <div>
            <h1 className="cc-h1">Command Center</h1>
            <p className="cc-sub">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · everything that needs you, in one place.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {loadedAt && <span className="cc-lbl">Updated {loadedAt.toLocaleTimeString('en-IN', { timeStyle: 'short' })}</span>}
            <button type="button" className="cc-btn" onClick={load}>Refresh</button>
            <Link to="/whitelist-tenant" className="cc-btn cc-btn--gold">+ Whitelist TradeSphereX</Link>
          </div>
        </div>
        {error && <p className="cc-error">{error}</p>}

        <div className="cc-stats">
          <Link to="/custodian/decisions" className="cc-card cc-stat cd-stat--gold">
            <span className="cc-lbl" style={{ fontWeight: 600, color: 'var(--color-accent-dark)' }}>Awaiting a decision</span>
            <span className="cc-stat__num">{queue ? queue.total : '…'}</span>
            <span className="cc-lbl">{overdueCount ? <><b style={{ color: 'var(--color-danger)' }}>{overdueCount} overdue</b> · oldest {ageLabel(oldest)}</> : items.length ? `oldest ${ageLabel(oldest)}` : 'nothing waiting'}</span>
          </Link>
          <Link to="/trading-session-directory" className="cc-card cc-stat">
            <span className="cc-lbl" style={{ fontWeight: 600 }}>Bids today</span>
            <span className="cc-stat__num">{v(d.bidsPlacedToday)}</span>
            <span className="cc-lbl">{data ? `${plural(d.salesClosedToday, 'session')} closed · ${plural(d.disputesFiledToday, 'dispute')} filed` : '…'}</span>
          </Link>
          <Link to="/alerts" className="cc-card cc-stat">
            <span className="cc-lbl" style={{ fontWeight: 600 }}>Stalled settlements</span>
            <span className="cc-stat__num" style={{ color: d.stalledSettlements ? 'var(--color-danger)' : undefined }}>{v(d.stalledSettlements)}</span>
            <span className="cc-lbl">{data ? `${plural(d.openDisputes, 'open dispute')} · ${plural(d.openAmlFlags, 'AML flag')}` : '…'}</span>
          </Link>
          <Link to="/custodian/tenants" className="cc-card cc-stat">
            <span className="cc-lbl" style={{ fontWeight: 600 }}>Whitelisted TradeSphereX</span>
            <span className="cc-stat__num">{v(d.tenants.length)}</span>
            <span className="cc-lbl">{d.newByFormat.length ? d.newByFormat.map((f) => `${f.count} new ${f.format}`).join(' · ') + ' today' : 'no new sessions today'}</span>
          </Link>
        </div>

        <div className="cc-split">
          <section className="cc-card cc-wide" aria-labelledby="q-title">
            <div className="cc-card__head">
              <div>
                <h2 id="q-title" className="cc-h2">Needs your decision</h2>
                <p className="cc-lbl" style={{ margin: '4px 0 0' }}>Overdue first, then by how long it has waited.</p>
              </div>
              <Link to="/custodian/decisions" className="cc-link">Open queue →</Link>
            </div>
            <div className="cc-trow cc-trow--head cd-q-cols"><span>Item</span><span>Count</span><span>Oldest</span><span /></div>
            {groups.map((g) => {
              const meta = QUEUE_TYPES[g.type] || { label: g.type, hint: '' };
              return (
                <Link key={g.type} to={`/custodian/decisions?type=${g.type}`} className="cc-trow cd-q-cols">
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <b style={{ fontWeight: 600, fontSize: 14 }}>{meta.label}</b>
                    <span className="cc-lbl" style={{ fontSize: 12 }}>{g.owner === 'tsx_master' ? 'Waiting on the TSX Master' : meta.hint}</span>
                  </span>
                  <span className="cc-mono" style={{ fontWeight: 600 }}>{g.count}</span>
                  <span><span className={`cc-pill cc-pill--${g.overdue ? 'bad' : 'muted'}`}>{ageLabel(g.oldest)}</span></span>
                  <span className="cc-link">{g.owner === 'tsx_master' ? 'View →' : 'Review →'}</span>
                </Link>
              );
            })}
            {queue && groups.length === 0 && <div className="cc-empty">Nothing is waiting on you.</div>}
          </section>

          <section className="cc-card cc-card--pad cc-narrow" aria-labelledby="h-title">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
              <h2 id="h-title" className="cc-h2">Platform health</h2>
              {health && <span className={`cc-pill cc-pill--${media?.missing || health.clockDriftAlerts ? 'warn' : 'ok'}`}>{media?.missing || health.clockDriftAlerts ? 'Needs attention' : 'All normal'}</span>}
            </div>
            <div className="cc-row"><span>API &amp; website</span><span style={{ color: data ? 'var(--color-success)' : undefined, fontWeight: 600 }}>{data ? 'Up' : '…'}</span></div>
            <div className="cc-row"><span>Live release</span><span className="cc-mono" style={{ fontSize: 12.5 }}>{health?.release?.deployedAt ? `${when(health.release.deployedAt)} · ${health.release.commit}` : (health?.release?.name || '—')}</span></div>
            <div className="cc-row"><span>Last database backup</span><span className="cc-mono" style={{ fontSize: 12.5 }}>{health?.backups?.database ? when(health.backups.database.at) : <span style={{ color: 'var(--color-warning)' }}>none found</span>}</span></div>
            <div className="cc-row"><span>Last files backup</span><span className="cc-mono" style={{ fontSize: 12.5 }}>{health?.backups?.files ? when(health.backups.files.at) : <span style={{ color: 'var(--color-warning)' }}>none found</span>}</span></div>
            <div className="cc-row"><span>Lot photos on disk</span><span style={{ fontWeight: 600, color: media?.missing ? 'var(--color-warning)' : 'var(--color-success)' }}>{media ? `${media.available} of ${media.total}` : '—'}</span></div>
            {media?.missing > 0 && <div className="cc-lbl" style={{ fontSize: 12, marginTop: -6, paddingBottom: 8 }}>{media.missing} files missing across {media.lotsWithMissing} lots — sellers can re-add them on each lot page.</div>}
            <div className="cc-row"><span>Clock drift alerts</span><span style={{ fontWeight: 600, color: health?.clockDriftAlerts ? 'var(--color-danger)' : 'var(--color-success)' }}>{health ? health.clockDriftAlerts : '—'}</span></div>
            <Link to="/audit-ledger" className="cc-link" style={{ display: 'block', paddingTop: 12, borderTop: '1px solid var(--color-border-soft)' }}>Audit log →</Link>
          </section>
        </div>

        <section className="cc-card" aria-labelledby="t-title">
          <div className="cc-card__head">
            <div>
              <h2 id="t-title" className="cc-h2">TradeSphereX</h2>
              <p className="cc-lbl" style={{ margin: '4px 0 0' }}>Every whitelisted marketplace. Open one for its numbers, plan and admins.</p>
            </div>
            <Link to="/custodian/tenants" className="cc-link">Manage all →</Link>
          </div>
          <div className="cc-table"><div style={{ minWidth: 640 }}>
            <div className="cc-trow cc-trow--head cd-t-cols"><span>Name</span><span>Class</span><span>Subdomain</span><span>Plan</span><span>Status</span></div>
            {d.tenants.map((t) => (
              <Link key={t.id} to={`/custodian/tenants?id=${t.id}`} className="cc-trow cd-t-cols">
                <span style={{ fontWeight: 600 }}>{t.name}</span><span>{t.tenantClass}</span><span className="cc-mono">{t.subdomain}</span><span>{t.tier}</span>
                <span><span className={`cc-pill cc-pill--${t.suspended ? 'bad' : 'ok'}`}>{t.suspended ? 'Suspended' : 'Active'}</span></span>
              </Link>
            ))}
            {data && d.tenants.length === 0 && <div className="cc-empty">No TradeSphereX whitelisted yet.</div>}
          </div></div>
        </section>

        <div className="cc-split">
          <section className="cc-card cc-narrow" aria-labelledby="s-title">
            <div className="cc-card__head"><h2 id="s-title" className="cc-h2">Stalled settlements — aging</h2><Link to="/alerts" className="cc-link">Alerts →</Link></div>
            {d.stalledAging.map((st) => (
              <Link key={st.id} to="/alerts" className="cc-trow" style={{ gridTemplateColumns: '1fr auto' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-accent-dark)' }}>{st.amount}</span>
                <span className="cc-lbl">since {st.since} · {st.daysStalled} day{st.daysStalled === 1 ? '' : 's'}</span>
              </Link>
            ))}
            {data && d.stalledAging.length === 0 && <div className="cc-empty">No stalled settlements.</div>}
          </section>

          <section className="cc-card cc-wide" aria-labelledby="hv-title">
            <div className="cc-card__head"><h2 id="hv-title" className="cc-h2">High-value disposals (&gt;₹10L)</h2><Link to="/lot-directory" className="cc-link">Lot directory →</Link></div>
            <div className="cc-table"><div style={{ minWidth: 560 }}>
              <div className="cc-trow cc-trow--head cd-hv-cols"><span>TradeSphereX</span><span>Format</span><span>Final value</span><span>Variance</span><span>Date</span></div>
              {d.highValueDisposals.map((x) => (
                <div key={x.id} className="cc-trow cd-hv-cols"><span style={{ fontWeight: 600 }}>{x.tenantName}</span><span>{x.format}</span><span style={{ fontWeight: 600 }}>{x.finalValue}</span><span>{x.variance}</span><span className="cc-lbl">{x.date}</span></div>
              ))}
              {data && d.highValueDisposals.length === 0 && <div className="cc-empty">No disposals above ₹10L yet.</div>}
            </div></div>
          </section>
        </div>

        <section className="cc-card" aria-labelledby="u-title">
          <div className="cc-card__head"><h2 id="u-title" className="cc-h2">Newest users</h2><Link to="/user-directory" className="cc-link">User directory →</Link></div>
          <div className="cc-table"><div style={{ minWidth: 720 }}>
            <div className="cc-trow cc-trow--head cd-u-cols"><span>Mobile</span><span>Name</span><span>Type</span><span>KYC</span><span>Trader★</span><span>MM★</span><span>Status</span></div>
            {d.users.map((u) => (
              <Link key={u.id} to={`/user-detail?id=${u.id}`} className="cc-trow cd-u-cols">
                <span className="cc-mono">{u.mobile}</span><span style={{ fontWeight: 600 }}>{u.name}</span><span>{u.type}</span>
                <span><span className={`cc-pill cc-pill--${KYC_CLASS[u.kyc] || 'muted'}`}>{u.kyc}</span></span>
                <span>{u.traderRating}★</span><span>{u.mmRating}★</span>
                <span><span className={`cc-pill cc-pill--${STATUS_CLASS[u.status]}`}>{u.status}</span></span>
              </Link>
            ))}
            {data && d.users.length === 0 && <div className="cc-empty">No users yet.</div>}
          </div></div>
        </section>
      </div>
    </CustodianShell>
  );
}
