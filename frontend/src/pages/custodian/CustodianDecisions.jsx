import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CustodianShell from '../../components/custodian/CustodianShell.jsx';
import { admin } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { QUEUE_TYPES, ageLabel } from './decisionTypes.js';
import './CustodianDecisions.css';

// Decision Queue: every pending item (GET /admin/decision-queue), oldest
// first. KYC, AML, payout releases and rating changes are decided here with
// the same endpoints their own pages use; other types open their page.
// Lot and seller approvals belong to the tenant's TSX Master (BR-09).
export default function CustodianDecisions() {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') || 'all';
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [filter, setFilter] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    setError('');
    admin.decisionQueue()
      .then((res) => setQueue(unwrap(res) || { items: [], counts: {}, total: 0 }))
      .catch((err) => setError(err.description || err.message || 'Could not load the queue.'));
  }, []);
  useEffect(() => { load(); }, [load]);

  const all = queue?.items || [];
  const q = filter.trim().toLowerCase();
  const items = all
    .filter((it) => type === 'all' || it.type === type)
    .filter((it) => !q || `${it.title} ${it.detail}`.toLowerCase().includes(q));
  const keyOf = (it) => `${it.type}:${it.id}`;
  const selected = items.find((it) => keyOf(it) === selectedKey) || items[0] || null;

  // J/K move through the list.
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || !items.length) return;
      const i = selected ? items.findIndex((it) => keyOf(it) === keyOf(selected)) : -1;
      if (e.key === 'j') setSelectedKey(keyOf(items[Math.min(items.length - 1, i + 1)]));
      if (e.key === 'k') setSelectedKey(keyOf(items[Math.max(0, i - 1)]));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const setType = (t) => { setSelectedKey(null); setParams(t === 'all' ? {} : { type: t }); };
  const onDecided = (message) => { setNotice(message); setSelectedKey(null); load(); };
  const counts = queue?.counts || {};

  return (
    <CustodianShell>
      <div className="cc-wrap">
        <div className="cc-head">
          <div>
            <h1 className="cc-h1">Decision Queue</h1>
            <p className="cc-sub">Every approval in one inbox. Oldest first; overdue items are marked.</p>
          </div>
          <p className="cc-lbl" style={{ margin: 0 }}>Keyboard: <span className="cc-mono">J</span>/<span className="cc-mono">K</span> move · <span className="cc-mono">/</span> search users</p>
        </div>
        {error && <p className="cc-error">{error}</p>}
        {notice && <p className="dq-notice" role="status">{notice} <button type="button" onClick={() => setNotice('')} aria-label="Dismiss">×</button></p>}

        <div className="dq-layout">
          <div className="cc-card dq-filters" role="group" aria-label="Filter by type">
            <button type="button" className={`dq-filter${type === 'all' ? ' dq-filter--on' : ''}`} onClick={() => setType('all')}>All <span className="cc-mono">{queue ? queue.total : '…'}</span></button>
            {Object.entries(QUEUE_TYPES).filter(([t]) => counts[t]).map(([t, meta]) => (
              <button key={t} type="button" className={`dq-filter${type === t ? ' dq-filter--on' : ''}`} onClick={() => setType(t)}>
                {meta.label} <span className="cc-mono">{counts[t]}</span>
              </button>
            ))}
          </div>

          <section className="cc-card dq-list" aria-label="Items">
            <div style={{ padding: '12px 14px' }}>
              <input type="search" className="dq-input" placeholder="Filter by name, mobile, amount…" aria-label="Filter items" value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
            {items.map((it) => {
              const on = selected && keyOf(it) === keyOf(selected);
              return (
                <button key={keyOf(it)} type="button" className={`dq-item${on ? ' dq-item--on' : ''}`} onClick={() => setSelectedKey(keyOf(it))} aria-pressed={on}>
                  <span className="dq-item__top">
                    <span className={`cc-pill cc-pill--${it.overdue ? 'bad' : it.owner === 'tsx_master' ? 'muted' : 'warn'}`}>{(QUEUE_TYPES[it.type] || {}).label || it.type}{it.overdue ? ' · overdue' : ''}</span>
                    <span className="cc-lbl cc-mono" style={{ fontSize: 11.5 }}>{ageLabel(it.since)}</span>
                  </span>
                  <b className="dq-item__title">{it.title}</b>
                  <span className="cc-lbl">{it.detail}</span>
                </button>
              );
            })}
            {queue && items.length === 0 && <div className="cc-empty">{all.length ? 'Nothing matches this filter.' : 'Nothing is waiting on you.'}</div>}
          </section>

          <section className="cc-card dq-detail" aria-label="Selected item">
            {selected ? <Detail key={keyOf(selected)} item={selected} onDecided={onDecided} /> : <p className="cc-lbl" style={{ margin: 0 }}>{queue ? 'Select an item.' : 'Loading…'}</p>}
          </section>
        </div>
      </div>
    </CustodianShell>
  );
}

function Detail({ item, onDecided }) {
  const meta = QUEUE_TYPES[item.type] || { label: item.type, page: '/custodian/dashboard' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <span className={`cc-pill cc-pill--${item.overdue ? 'bad' : 'warn'}`}>{meta.label} · waiting {ageLabel(item.since)}</span>
        <h2 className="dq-title">{item.title}</h2>
        <p className="cc-lbl" style={{ margin: '4px 0 0' }}>{item.detail}</p>
      </div>
      {item.owner === 'tsx_master' ? (
        <>
          <p className="dq-info">Only this TradeSphereX&apos;s own TSX Master can approve this (BR-09). It&apos;s listed here so you can see the backlog and follow up with them.</p>
          <Link to={meta.page} className="cc-btn" style={{ alignSelf: 'flex-start' }}>Open {meta.label.toLowerCase()} →</Link>
        </>
      ) : item.type === 'kyc' ? (
        <div className="dq-info">KYC is reviewed inside the person's User file, next to everything else about them.{' '}
          <Link to={`/user-detail?id=${item.id}#id`} className="cc-link">Review KYC in the User file →</Link></div>
      )
        : item.type === 'aml' ? <AmlDecision item={item} onDecided={onDecided} />
          : item.type === 'payout' ? <PayoutDecision item={item} onDecided={onDecided} />
            : item.type === 'rating' ? <RatingDecision item={item} onDecided={onDecided} />
              : (
                <>
                  <p className="dq-info">This needs the full case view — evidence, history and ruling options are on its own page.</p>
                  <Link to={meta.page} className="cc-btn cc-btn--gold" style={{ alignSelf: 'flex-start' }}>Open in {meta.label} →</Link>
                </>
              )}
    </div>
  );
}

// Shared submit wrapper: busy state + error text.
function useSubmit(onDecided) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async (fn, message) => {
    setBusy(true); setErr('');
    try { await fn(); onDecided(message); } catch (e) { setErr(e.description || e.message || 'That did not go through.'); } finally { setBusy(false); }
  };
  return { busy, err, run };
}

function AmlDecision({ item, onDecided }) {
  const [notes, setNotes] = useState('');
  const [str, setStr] = useState('');
  const { busy, err, run } = useSubmit(onDecided);
  return (
    <>
      <label className="dq-field">Review notes (required)
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What you checked and why" />
      </label>
      <label className="dq-field">STR reference (only if you filed a Suspicious Transaction Report)
        <input type="text" value={str} onChange={(e) => setStr(e.target.value)} />
      </label>
      <div className="dq-actions">
        <button type="button" className="cc-btn cc-btn--ok" disabled={busy || !notes.trim()} onClick={() => run(() => admin.amlReview(item.id, { decision: 'no_action', notes }), 'AML flag closed — no action.')}>Close — no action</button>
        <button type="button" className="cc-btn cc-btn--bad" disabled={busy || !notes.trim() || !str.trim()} onClick={() => run(() => admin.amlReview(item.id, { decision: 'str_filed', str_reference: str, notes }), 'AML flag closed — STR filed.')}>STR filed</button>
      </div>
      {err && <p className="cc-error">{err}</p>}
    </>
  );
}

function PayoutDecision({ item, onDecided }) {
  const [rationale, setRationale] = useState('');
  const { busy, err, run } = useSubmit(onDecided);
  return (
    <>
      <label className="dq-field">Rationale (required)
        <textarea rows={3} value={rationale} onChange={(e) => setRationale(e.target.value)} />
      </label>
      <div className="dq-actions">
        <button type="button" className="cc-btn cc-btn--ok" disabled={busy || !rationale.trim()} onClick={() => run(() => admin.decidePayoutReview(item.id, { decision: 'approve', rationale }), 'Payout release approved.')}>Approve release</button>
        <button type="button" className="cc-btn cc-btn--bad" disabled={busy || !rationale.trim()} onClick={() => run(() => admin.decidePayoutReview(item.id, { decision: 'reject', rationale }), 'Payout release declined.')}>Decline</button>
      </div>
      {err && <p className="cc-error">{err}</p>}
    </>
  );
}

function RatingDecision({ item, onDecided }) {
  const { busy, err, run } = useSubmit(onDecided);
  return (
    <>
      <p className="dq-info">Approving applies this rating change. To contest it instead, use Rating Reviews.</p>
      <div className="dq-actions">
        <button type="button" className="cc-btn cc-btn--ok" disabled={busy} onClick={() => run(() => admin.approveRatingReview(item.id, {}), 'Rating change approved.')}>Approve change</button>
        <Link to="/rating-reviews" className="cc-btn">Rating Reviews →</Link>
      </div>
      {err && <p className="cc-error">{err}</p>}
    </>
  );
}
