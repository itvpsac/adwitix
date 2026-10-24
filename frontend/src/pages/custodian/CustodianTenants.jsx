import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CustodianShell from '../../components/custodian/CustodianShell.jsx';
import { admin } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { formatCurrency } from '../../utils/format.js';
import { formatBytes, formatPlanValue } from '../../utils/plans.js';
import './CustodianTenants.css';

// TradeSphereX management: GET /admin/tenants (list), GET /admin/tenants/:id
// (tenant + stats + TSX Masters), POST /admin/tenants/:id/edit (name, plan,
// brand color, terms URL — the fields that endpoint accepts). Fees are shown
// read-only: no endpoint changes them yet. The CoCo tier is "Salvage
// Managers": only one TradeSphereX holds it, and it leads the list.
const SALVAGE = 'coco_starter';
const TIERS = [['coco_starter', 'Salvage Managers'], ['tsx_launch', 'TSX Launch'], ['tsx_growth', 'TSX Growth'], ['tsx_enterprise', 'TSX Enterprise']];
const tierLabel = (t) => (TIERS.find(([k]) => k === t) || [null, t || '—'])[1];
const humanize = (v) => (v ? String(v).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—');

export default function CustodianTenants() {
  const [params, setParams] = useSearchParams();
  const [tenants, setTenants] = useState(null);
  const [find, setFind] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    admin.tenants()
      .then((r) => setTenants((unwrap(r) || {}).tenants || []))
      .catch((e) => setError(e.description || e.message || 'Could not load TradeSphereX.'));
  }, []);

  const salvageFirst = (a, b) => (b.subscription_tier === SALVAGE) - (a.subscription_tier === SALVAGE) || String(a.name).localeCompare(String(b.name));
  const list = [...(tenants || [])].sort(salvageFirst).filter((t) => !find.trim() || `${t.name} ${t.subdomain}`.toLowerCase().includes(find.trim().toLowerCase()));
  const selectedId = params.get('id') || (list[0] && list[0].id);
  const salvageHolder = (tenants || []).find((t) => t.subscription_tier === SALVAGE && t.id !== selectedId);

  return (
    <CustodianShell>
      <div className="cc-wrap">
        {error && <p className="cc-error">{error}</p>}
        <div className="tx-layout">
          <aside className="cc-card tx-list" aria-label="All TradeSphereX">
            <div className="tx-list__head">
              <h1 className="cc-h2">TradeSphereX <span className="cc-lbl cc-mono">{tenants ? tenants.length : '…'}</span></h1>
              <Link to="/whitelist-tenant" className="cc-link">+ New</Link>
            </div>
            <input type="search" className="tx-find" placeholder="Find…" aria-label="Find a TradeSphereX" value={find} onChange={(e) => setFind(e.target.value)} />
            {list.map((t) => (
              <button key={t.id} type="button" className={`tx-item${t.id === selectedId ? ' tx-item--on' : ''}`} onClick={() => setParams({ id: t.id })} aria-pressed={t.id === selectedId}>
                <b>{t.name}</b>
                <span className="cc-lbl" style={{ fontSize: 12 }}>{humanize(t.tenant_class)} · {tierLabel(t.subscription_tier)}{t.suspended_at ? ' · Suspended' : ''}</span>
              </button>
            ))}
            {tenants && list.length === 0 && <p className="cc-lbl" style={{ padding: '8px 6px' }}>None found.</p>}
          </aside>
          <div className="tx-main">
            {selectedId ? <TenantDetail key={selectedId} id={selectedId} salvageHolder={salvageHolder} onDeleted={(id) => { setTenants((ts) => (ts || []).filter((x) => x.id !== id)); setParams({}); }} onSaved={(t) => setTenants((ts) => (ts || []).map((x) => (x.id === t.id ? t : x)))} />
              : <p className="cc-lbl">{tenants ? 'No TradeSphereX whitelisted yet.' : 'Loading…'}</p>}
          </div>
        </div>
      </div>
    </CustodianShell>
  );
}

function TenantDetail({ id, salvageHolder, onSaved, onDeleted }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  const load = useCallback(() => {
    admin.tenant(id)
      .then((r) => {
        const d = unwrap(r) || {};
        setData(d);
        const t = d.tenant || {};
        setForm({ name: t.name || '', subscription_tier: t.subscription_tier || 'coco_starter', branding_primary_color: t.branding_primary_color || '', terms_url: t.terms_url || '', extra_storage_gb: String(t.extra_storage_gb ?? 0) });
      })
      .catch((e) => setError(e.description || e.message || 'Could not load this TradeSphereX.'));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (error && !data) return <p className="cc-error">{error}</p>;
  if (!data || !form) return <p className="cc-lbl">Loading…</p>;
  const t = data.tenant || {};
  const s = data.stats || {};
  const admins = data.admins || [];
  const dirty = form.name !== (t.name || '') || form.subscription_tier !== t.subscription_tier
    || form.branding_primary_color !== (t.branding_primary_color || '') || form.terms_url !== (t.terms_url || '')
    || form.extra_storage_gb !== String(t.extra_storage_gb ?? 0);
  const usage = data.planUsage || {};
  const plan = usage.plan || {};
  const st = usage.storage || {};
  const big = usage.largest_lot || {};
  const pct = st.percent ?? 0;

  const save = async () => {
    setSaving(true); setSaved(''); setError('');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
    try {
      const res = unwrap(await admin.editTenant(id, fd)) || {};
      setSaved(res.message || 'Saved.');
      if (res.tenant) onSaved(res.tenant);
      load();
    } catch (e) {
      setError(e.description || e.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  // Only an empty TSX can go; the server re-checks every table that points
  // at it and says what's still there. Salvage Managers can never be deleted.
  const isSalvage = t.subscription_tier === SALVAGE;
  const empty = !admins.length && !s.liveLots && !s.pendingLots && !s.upcomingLots && !s.approvedSellers && !s.pendingSellers && !s.openDisputes;
  const remove = async () => {
    if (!window.confirm(`Delete "${t.name}" permanently? This can't be undone.`)) return;
    setSaving(true); setSaved(''); setError('');
    try {
      unwrap(await admin.deleteTenant(id));
      onDeleted(id);
    } catch (e) {
      setError(e.description || e.message || 'Could not delete.');
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="cc-head">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span className="tx-mark" style={{ background: t.branding_primary_color || 'var(--color-navy-deep)' }}>{(t.name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
          <div>
            <h2 className="cc-h1" style={{ fontSize: 28 }}>{t.name}</h2>
            <p className="cc-sub" style={{ marginTop: 4 }}>
              <span className="cc-mono">{t.custom_domain || t.subdomain || '—'}</span> · {humanize(t.tenant_class)}
              {' · '}<span className={`cc-pill cc-pill--${t.suspended_at ? 'bad' : 'ok'}`}>{t.suspended_at ? 'Suspended' : 'Active'}</span>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isSalvage && <button type="button" className="cc-btn cc-btn--bad" disabled={!empty || saving} onClick={remove} title={empty ? 'Delete this TradeSphereX' : 'Only a TradeSphereX with no lots, sellers, TSX Master or disputes can be deleted'}>Delete</button>}
          <button type="button" className="cc-btn cc-btn--gold" disabled={!dirty || saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
      {saved && <p className="dq-notice" role="status" style={{ display: 'block' }}>{saved}</p>}
      {error && <p className="cc-error" role="alert">{error}</p>}

      <div className="cc-card tx-stats">
        <div><span className="cc-lbl">Live lots</span><b>{s.liveLots ?? 0}</b></div>
        <div><span className="cc-lbl">Pending approval</span><b style={{ color: s.pendingLots ? 'var(--color-warning)' : undefined }}>{s.pendingLots ?? 0}</b></div>
        <div><span className="cc-lbl">Approved sellers</span><b>{s.approvedSellers ?? 0}</b></div>
        <div><span className="cc-lbl">Settled · 30 days</span><b>{formatCurrency(s.settled30d)}</b></div>
        <div><span className="cc-lbl">Open disputes</span><b>{s.openDisputes ?? 0}</b></div>
      </div>

      <div className="cc-split">
        <section className="cc-card cc-card--pad cc-narrow tx-form" aria-labelledby="pf">
          <h3 id="pf" className="cc-h2" style={{ fontSize: 17 }}>Plan &amp; details</h3>
          <label className="dq-field">Name<input type="text" value={form.name} onChange={set('name')} /></label>
          <label className="dq-field">Plan
            <select value={form.subscription_tier} onChange={set('subscription_tier')}>{TIERS.map(([k, l]) => <option key={k} value={k} disabled={k === SALVAGE && !!salvageHolder}>{k === SALVAGE && salvageHolder ? `${l} (held by ${salvageHolder.name})` : l}</option>)}</select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <label className="dq-field">Brand color<input type="text" value={form.branding_primary_color} onChange={set('branding_primary_color')} placeholder="#0F6E4E" /></label>
            <label className="dq-field">Terms URL<input type="url" value={form.terms_url} onChange={set('terms_url')} placeholder="https://…" /></label>
          </div>
          <div className="cc-row"><span>SaaS fee</span><span className="cc-mono">{t.saas_fee_percent != null ? `${t.saas_fee_percent}%` : '—'}</span></div>
          <div className="cc-row"><span>Buyer fee</span><span className="cc-mono">{t.buyer_fee_percent != null ? `${t.buyer_fee_percent}%` : '—'}</span></div>
          <p className="cc-lbl" style={{ margin: 0, fontSize: 12 }}>Fees are read-only here for now.</p>
        </section>

        <div className="cc-narrow" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <section className="cc-card cc-card--pad tx-form" aria-labelledby="su">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 id="su" className="cc-h2" style={{ fontSize: 17 }}>Storage &amp; plan limits</h3>
              <Link to="/custodian/plans" className="cc-link">Compare plans →</Link>
            </div>
            <div>
              <div className="cc-row" style={{ borderTop: 'none', paddingTop: 0 }}>
                <span>Storage used</span>
                <span className="cc-mono">{formatBytes(st.used_bytes)} of {st.limit_bytes == null ? 'Unlimited' : formatBytes(st.limit_bytes)}</span>
              </div>
              {st.limit_bytes != null && (
                <div className="tx-meter" role="meter" aria-label="Storage used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                  <span style={{ width: `${Math.min(100, Math.max(pct, pct > 0 ? 1 : 0))}%`, background: pct >= 90 ? 'var(--color-danger)' : pct >= 75 ? 'var(--color-warning)' : 'var(--color-success)' }} />
                </div>
              )}
              {st.limit_bytes != null && <span className="cc-lbl" style={{ fontSize: 12 }}>{pct}% · {plan.name} includes {formatPlanValue('gb', plan.storage_gb)}{st.extra_gb ? ` + ${st.extra_gb} GB bought` : ''}</span>}
            </div>
            <label className="dq-field">Extra storage bought (GB)
              <input type="number" min="0" step="100" value={form.extra_storage_gb} onChange={set('extra_storage_gb')} />
            </label>
            <div className="cc-row"><span>Photos per Lot</span><span className="cc-mono">largest {big.photos ?? 0} · limit {formatPlanValue('limit', plan.images_per_lot)}</span></div>
            <div className="cc-row"><span>Videos per Lot</span><span className="cc-mono">largest {big.videos ?? 0} · limit {formatPlanValue('limit', plan.videos_per_lot)}</span></div>
            <div className="cc-row"><span>Documents per Lot</span><span className="cc-mono">largest {big.documents ?? 0} · limit {formatPlanValue('limit', plan.documents_per_lot)}</span></div>
            <div className="cc-row"><span>Largest file</span><span className="cc-mono">{formatPlanValue('mb', plan.max_file_mb)}</span></div>
          </section>

          <section className="cc-card cc-card--pad" aria-labelledby="ad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 id="ad" className="cc-h2" style={{ fontSize: 17 }}>TSX Master</h3>
              <Link to="/user-directory" className="cc-link">Promote a user →</Link>
            </div>
            {admins.map((a) => (
              <Link key={a.id} to={`/user-detail?id=${a.id}`} className="cc-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><b style={{ fontWeight: 600 }}>{a.full_name || a.mobile_number}</b><span className="cc-lbl cc-mono" style={{ fontSize: 11.5 }}>{a.mobile_number}</span></span>
                <span className="cc-pill cc-pill--ok">Active</span>
              </Link>
            ))}
            {admins.length === 0 && <div className="cc-row"><span className="cc-lbl">No TSX Master yet — lots and sellers here can&apos;t be approved until one is promoted.</span></div>}
          </section>

          <section className="cc-card cc-card--pad" aria-labelledby="bl">
            <h3 id="bl" className="cc-h2" style={{ fontSize: 17 }}>Backlog</h3>
            <div className="cc-row"><span>Lots waiting for approval</span><span className="cc-mono" style={{ fontWeight: 600 }}>{s.pendingLots ?? 0}</span></div>
            <div className="cc-row"><span>Seller applications</span><span className="cc-mono" style={{ fontWeight: 600 }}>{s.pendingSellers ?? 0}</span></div>
            <div className="cc-row"><span>Stalled settlements</span><span className="cc-mono" style={{ fontWeight: 600, color: s.stalledSettlements ? 'var(--color-danger)' : undefined }}>{s.stalledSettlements ?? 0}</span></div>
            <div className="cc-row"><span>Upcoming lots</span><span className="cc-mono" style={{ fontWeight: 600 }}>{s.upcomingLots ?? 0}</span></div>
            <Link to="/custodian/decisions" className="cc-link" style={{ display: 'block', paddingTop: 10 }}>Decision Queue →</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
