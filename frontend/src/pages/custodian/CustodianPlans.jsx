import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CustodianShell from '../../components/custodian/CustodianShell.jsx';
import { admin } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { PLAN_GROUPS, API_LABELS, formatPlanValue } from '../../utils/plans.js';
import './CustodianPlans.css';

// The Custodian's Plans sheet (D-138): every TSX plan side by side, which
// limits the platform enforces on its own, and an edit mode — a saved
// change applies at once to every TradeSphereX on that plan.
const UNLIMITED_TYPES = new Set(['limit', 'gb', 'mb', 'years', 'days']);
const errText = (e, fallback) => e.description || e.message || fallback;
const day = (v) => (v ? String(v).slice(0, 10) : null);

function CellInput({ row, value, onChange }) {
  const { type, label } = row;
  if (type === 'bool') return <input type="checkbox" aria-label={label} checked={!!Number(value)} onChange={(e) => onChange(e.target.checked ? 1 : 0)} />;
  if (type === 'api') return <select aria-label={label} value={value || 'none'} onChange={(e) => onChange(e.target.value)}>{Object.entries(API_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>;
  if (type === 'text') return <input type="text" aria-label={label} value={value ?? ''} maxLength={200} onChange={(e) => onChange(e.target.value)} />;
  const unlimited = UNLIMITED_TYPES.has(type);
  return (
    <input type="number" min="0" aria-label={label} value={value ?? ''} placeholder={unlimited ? 'Unlimited' : '0'}
      onChange={(e) => onChange(e.target.value === '' ? (unlimited ? null : 0) : Number(e.target.value))} />
  );
}

export default function CustodianPlans() {
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => admin.plans().then((r) => setData(unwrap(r) || {})).catch((e) => setError(errText(e, 'Could not load plans.')));
  useEffect(() => { load(); }, []);

  const plans = data?.plans || [];
  const enforced = new Set(data?.enforced || []);
  const changed = (p) => {
    const d = draft?.[p.plan_key] || {};
    return Object.keys(d).filter((k) => String(d[k] ?? '') !== String(p[k] ?? ''));
  };
  const dirtyPlans = draft ? plans.filter((p) => changed(p).length) : [];

  const set = (key, field, v) => setDraft({ ...draft, [key]: { ...draft[key], [field]: v } });
  const startEdit = () => { setNotice(''); setError(''); setDraft(Object.fromEntries(plans.map((p) => [p.plan_key, { ...p }]))); };

  const save = async () => {
    const affected = dirtyPlans.reduce((n, p) => n + (p.tenant_count || 0), 0);
    const names = dirtyPlans.map((p) => p.name).join(', ');
    if (!window.confirm(`Save changes to ${names}? They apply at once to ${affected} TradeSphereX on ${dirtyPlans.length === 1 ? 'this plan' : 'these plans'}.`)) return;
    setSaving(true); setError('');
    try {
      for (const p of dirtyPlans) {
        const payload = Object.fromEntries(changed(p).map((k) => [k, draft[p.plan_key][k]]));
        unwrap(await admin.savePlan(p.plan_key, payload));
      }
      setNotice(`Saved ${names}.`);
      setDraft(null);
      await load();
    } catch (e) {
      setError(errText(e, 'Could not save.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustodianShell>
      <div className="cc-wrap pl">
        <div className="cc-head">
          <div>
            <h1 className="cc-h1">Plans</h1>
            <p className="cc-sub">What each TradeSphereX plan includes, side by side. <b>Enforced</b> limits are applied by the platform on its own; <b>Policy</b> rows are commitments the team honours.</p>
          </div>
          <div className="pl-actions">
            {!draft && <button type="button" className="cc-btn" onClick={() => window.print()}>Print</button>}
            {!draft && <button type="button" className="cc-btn cc-btn--gold" disabled={!plans.length} onClick={startEdit}>Edit plans</button>}
            {draft && <button type="button" className="cc-btn" disabled={saving} onClick={() => setDraft(null)}>Cancel</button>}
            {draft && <button type="button" className="cc-btn cc-btn--gold" disabled={saving || !dirtyPlans.length} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>}
          </div>
        </div>
        {notice && <p className="dq-notice" role="status" style={{ display: 'block' }}>{notice}</p>}
        {error && <p className="cc-error" role="alert">{error}</p>}
        {!data && !error && <p className="cc-lbl">Loading…</p>}

        {plans.length > 0 && (
          <section className="cc-card pl-card">
            <div className="cc-table">
              <table className="pl-table">
                <thead>
                  <tr>
                    <th scope="col" className="pl-feature">Plan</th>
                    {plans.map((p) => (
                      <th key={p.plan_key} scope="col" className={changed(p).length ? 'pl-col--dirty' : ''}>
                        {draft ? <input type="text" aria-label={`Name of ${p.plan_key}`} value={draft[p.plan_key].name} onChange={(e) => set(p.plan_key, 'name', e.target.value)} /> : <span className="pl-name">{p.name}</span>}
                        <span className="pl-tag">{p.tagline}</span>
                        <Link to="/custodian/tenants" className="pl-count">{p.tenant_count} TradeSphereX</Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                {PLAN_GROUPS.map((g) => (
                  <tbody key={g.title}>
                    <tr className="pl-group"><th scope="rowgroup" colSpan={plans.length + 1}>{g.title}</th></tr>
                    {g.rows.map((row) => (
                      <tr key={row.key}>
                        <th scope="row" className="pl-feature">
                          <span className="pl-label">{row.label}</span>
                          <span className={`cc-pill ${enforced.has(row.key) ? 'cc-pill--ok' : 'cc-pill--muted'}`}>{enforced.has(row.key) ? 'Enforced' : 'Policy'}</span>
                          {row.help && <span className="pl-help">{row.help}</span>}
                        </th>
                        {plans.map((p) => {
                          const dirty = draft && String(draft[p.plan_key][row.key] ?? '') !== String(p[row.key] ?? '');
                          return (
                            <td key={p.plan_key} className={dirty ? 'pl-cell--dirty' : ''}>
                              {draft ? <CellInput row={row} value={draft[p.plan_key][row.key]} onChange={(v) => set(p.plan_key, row.key, v)} /> : formatPlanValue(row.type, p[row.key])}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                ))}
                <tbody>
                  <tr className="pl-meta">
                    <th scope="row" className="pl-feature"><span className="pl-label">Last changed</span></th>
                    {plans.map((p) => <td key={p.plan_key}>{day(p.updated_at) || 'Original'}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {draft && <p className="cc-lbl pl-hint">Leave a limit empty for Unlimited. A saved change applies at once and is written to the audit log.</p>}

        <section className="cc-card cc-card--pad pl-notes" aria-labelledby="how">
          <h2 id="how" className="cc-h2" style={{ fontSize: 17 }}>How the limits are applied</h2>
          <ul>
            <li><b>Photos, videos and documents per Lot</b> — checked on every upload, counting what the Lot already has and what is still being processed. A refused upload says which limit it hit.</li>
            <li><b>Largest file</b> — the plan&apos;s limit, never above the platform caps (8 MB a photo, 20 MB a PDF, 500 MB a video).</li>
            <li><b>Storage</b> — all of a TradeSphereX&apos;s Lot media together. Uploads stop when it is full; extra storage bought for a TSX (set on its page under TradeSphereX) adds to the plan&apos;s allowance. ₹2,000 per 100 GB a year + GST.</li>
            <li><b>API access and Seller-Pays</b> — checked whenever an API key is used or a Trading Session is set to Seller-Pays.</li>
            <li><b>Retention, backups and support</b> — stated policy, shown on the public Pricing page; not yet automated.</li>
            <li>Lowering a limit never removes media already uploaded — it only stops new uploads above it.</li>
          </ul>
        </section>
      </div>
    </CustodianShell>
  );
}
