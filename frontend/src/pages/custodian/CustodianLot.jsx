import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CustodianShell from '../../components/custodian/CustodianShell.jsx';
import StopAction from '../../components/custodian/StopAction.jsx';
import { admin } from '../../api/endpoints.js';
import { unwrap, mediaUrl } from '../../api/client.js';
import { Fields, Table, label, show } from '../../components/custodian/DossierParts.jsx';
import './CustodianLot.css';

// The Custodian's full file on one Lot (D-133): GET /admin/listings/:id/dossier.
// Nothing is withheld — the Lot, its media, every Trading Session with its
// bids, offers, deposits, settlement and disputes, the seller and the TSX,
// and the audit trail — arranged in tabs (?tab=) behind a summary of the
// facts that matter most. Approving stays with the TSX Master (D-132); the
// Custodian can stop the Lot or any live session.
const LIVE_LOT = ['inventory', 'pending_approval', 'upcoming', 'active'];
const LIVE_SESSION = ['pending_approval', 'grace_period', 'active'];
const STATUS_TONE = { active: 'ok', upcoming: 'ok', pending_approval: 'warn', inventory: 'muted', sold: 'ok', suspended: 'bad', archived: 'muted' };
const day = (v) => (v ? String(v).slice(0, 16).replace('T', ' ') : '—');

// What is being sold, grouped the way a reviewer reads a Lot.
const GROUPS = [
  ['Item', ['category', 'subcategory', 'micro_category', 'make_model', 'physical_condition', 'quantity', 'quantity_basis']],
  ['Location & shipping', ['yard_location_address', 'city', 'state', 'yard_location_pin', 'shipping_enabled', 'shipping_cost_type', 'shipping_fixed_cost', 'shipping_variable_rate_per_km']],
  ['Media standard', ['media_tier', 'media_count', 'media_is_representative_under_waiver']],
  ['Record', ['status', 'rejection_reason', 'created_at', 'updated_at', 'archived_at', 'superseded_by_listing_id', 'related_group_label']],
];
const YES_NO = new Set(['shipping_enabled', 'media_is_representative_under_waiver']);
const WORDS = new Set(['status', 'physical_condition', 'quantity_basis', 'media_tier', 'shipping_cost_type']);
const fmt = (k, v) => (YES_NO.has(k) && v !== null && v !== undefined ? (Number(v) ? 'Yes' : 'No') : WORDS.has(k) && v ? label(String(v)) : show(k, v));
const PEOPLE = [['seller_party_id', 'Seller'], ['inspector_party_id', 'Yard Inspector'], ['surveyor_party_id', 'Surveyor'], ['custodian_party_id', 'Physical custodian']];

export default function CustodianLot() {
  const [params, setParams] = useSearchParams();
  const id = params.get('id');
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!id) return;
    admin.lotDossier(id).then((r) => setD(unwrap(r))).catch((e) => setError(e.description || e.message || 'Could not load this Lot.'));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  // Old links point at a session with #se-<id>: open the Sessions tab there.
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const tab = params.get('tab') || (hash.startsWith('#se-') ? 'sessions' : 'overview');
  const setTab = (t) => { const next = new URLSearchParams(params); next.set('tab', t); setParams(next, { replace: true }); };
  useEffect(() => {
    if (d && hash.startsWith('#se-')) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [d, hash]);

  const parties = (d && d.parties) || {};
  const party = (pid) => {
    const p = parties[pid];
    return p ? <Link to={`/user-detail?id=${pid}`} className="cc-link">{p.full_name || p.mobile_number} <span className="cc-mono cc-lbl">{p.mobile_number}</span></Link> : <span className="cc-mono">{pid}</span>;
  };

  if (!id) return <CustodianShell><p className="cc-lbl">No Lot selected. Open one from the <Link to="/lot-directory" className="cc-link">Lot Directory</Link>.</p></CustodianShell>;
  if (error) return <CustodianShell><p className="cc-error">{error}</p></CustodianShell>;
  if (!d) return <CustodianShell><p className="cc-lbl">Loading…</p></CustodianShell>;

  const l = d.listing;
  const s = d.seller;
  const liveSessions = d.sessions.filter((se) => LIVE_SESSION.includes(se.status));
  const disputes = d.sessions.reduce((n, se) => n + (se.disputes || []).length, 0);
  const photos = d.media.filter((m) => m.media_type === 'photo');
  const TABS = [
    ['overview', 'Overview'],
    ['media', `Media · ${d.media.length}`],
    ['sessions', `Trading Sessions · ${d.sessions.length}`],
    ['people', 'Seller & TSX'],
    ['activity', 'Activity'],
    ['audit', `Audit trail · ${d.audit.length}`],
  ];

  return (
    <CustodianShell>
      <div className="cc-wrap">
        <div className="cc-head">
          <div style={{ minWidth: 0 }}>
            <p className="cc-lbl" style={{ margin: 0 }}><Link to="/lot-directory" className="cc-link">Lots</Link> / Lot file</p>
            <h1 className="cc-h1" style={{ marginTop: 6 }}>{l.title || l.make_model || l.category}</h1>
            <p className="cc-sub">
              <span className={`cc-pill cc-pill--${STATUS_TONE[l.status] || 'muted'}`}>{label(l.status)}</span>{' '}
              on <Link to={`/custodian/tenants?id=${l.tenant_id}`} className="cc-link">{d.tenant ? d.tenant.name : l.tenant_id}</Link>
              {' · '}<span className="cc-mono">{l.id}</span>
              {' · '}<Link to={`/lot-detail?id=${l.id}`} className="cc-link">Public page →</Link>
            </p>
          </div>
          {LIVE_LOT.includes(l.status) && <StopAction label="Stop Lot" what={`the Lot "${l.title || l.category}"`} onStop={(reason) => admin.stopLot(l.id, reason)} onDone={load} />}
        </div>

        {l.rejection_reason && <p className="cl-banner cl-banner--info">Last rejection: {l.rejection_reason}</p>}
        {disputes > 0 && <p className="cl-banner cl-banner--bad">{disputes} dispute{disputes === 1 ? '' : 's'} on this Lot — see Trading Sessions.</p>}

        <div className="cc-card lf-facts">
          <div><span className="cc-lbl">Category</span><b>{l.category || '—'}</b><small>{[l.subcategory, l.micro_category].filter(Boolean).join(' › ') || ' '}</small></div>
          <div><span className="cc-lbl">Quantity</span><b>{show('quantity', l.quantity)}</b><small>{l.quantity_basis ? label(l.quantity_basis) : ' '}</small></div>
          <div><span className="cc-lbl">Seller</span><b>{s ? (s.full_name || s.mobile_number) : '—'}</b><small>{s ? `${Number(s.seller_star_rating ?? 3).toFixed(1)}★ Market Maker` : ' '}</small></div>
          <div><span className="cc-lbl">TSX Master</span><b>{d.tsxMasters[0] ? (d.tsxMasters[0].full_name || d.tsxMasters[0].mobile_number) : 'None'}</b><small>{d.tenant ? d.tenant.name : ' '}</small></div>
          <div><span className="cc-lbl">Media</span><b>{photos.length} photo{photos.length === 1 ? '' : 's'}</b><small>{label(l.media_tier || 'not set')}</small></div>
          <div><span className="cc-lbl">Sessions</span><b>{d.sessions.length}</b><small>{liveSessions.length ? `${liveSessions.length} live` : 'none live'}</small></div>
          <div><span className="cc-lbl">Interest</span><b>{d.engagement.views} views</b><small>{d.engagement.favorites} favourites</small></div>
        </div>

        <div className="lf-tabs" role="tablist" aria-label="Lot file">
          {TABS.map(([k, t]) => (
            <button key={k} type="button" role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="lf-panel">
          {tab === 'overview' && (
            <>
              <section className="cc-card cc-card--pad">
                <h2 className="cc-h2">Description</h2>
                <p className="lf-desc">{l.description || <span className="cl-empty">The seller wrote no description.</span>}</p>
              </section>
              <div className="lf-grid">
                {GROUPS.map(([title, keys]) => (
                  <section key={title} className="cc-card cc-card--pad">
                    <h2 className="cc-h2" style={{ fontSize: 16 }}>{title}</h2>
                    <dl className="cl-kv lf-kv">
                      {keys.filter((k) => k in l).map((k) => <div key={k}><dt>{label(k)}</dt><dd>{k === 'superseded_by_listing_id' && l[k] ? <Link to={`/custodian/lot?id=${l[k]}`} className="cc-link cc-mono">{l[k]}</Link> : fmt(k, l[k])}</dd></div>)}
                    </dl>
                  </section>
                ))}
                <section className="cc-card cc-card--pad">
                  <h2 className="cc-h2" style={{ fontSize: 16 }}>People on this Lot</h2>
                  <dl className="cl-kv lf-kv">
                    {PEOPLE.map(([k, t]) => <div key={k}><dt>{t}</dt><dd>{l[k] ? party(l[k]) : '—'}</dd></div>)}
                    {l.inspector_contact_note && <div><dt>Inspector contact note</dt><dd>{l.inspector_contact_note}</dd></div>}
                  </dl>
                </section>
              </div>
              <details className="cc-card cc-card--pad lf-all">
                <summary>Every stored field</summary>
                <Fields row={l} />
              </details>
            </>
          )}

          {tab === 'media' && (
            <section className="cc-card cc-card--pad">
              {d.media.length === 0 ? <p className="cl-empty">No media.</p> : (
                <>
                  <div className="cl-media lf-media">
                    {photos.map((m) => (
                      <a key={m.id} href={mediaUrl(m.file_path)} target="_blank" rel="noreferrer" title={m.original_filename || m.file_path}>
                        <img src={mediaUrl(m.file_path)} alt={m.original_filename || 'Lot photo'} loading="lazy" />
                        {Number(m.is_primary) ? <em>Main photo</em> : null}
                      </a>
                    ))}
                  </div>
                  {d.media.some((m) => m.media_type !== 'photo') && (
                    <ul className="lf-files">
                      {d.media.filter((m) => m.media_type !== 'photo').map((m) => (
                        <li key={m.id}><a href={mediaUrl(m.file_path)} target="_blank" rel="noreferrer" className="cc-link">{label(m.media_type)}: {m.original_filename || m.file_path}</a></li>
                      ))}
                    </ul>
                  )}
                  <Table title="Capture details" rows={d.media.map((m) => ({ id: m.id, type: m.media_type, file: m.original_filename, main: !!Number(m.is_primary), captured_at: m.captured_at, gps: m.gps_lat ? `${m.gps_lat}, ${m.gps_lng}` : null, uploaded_by_party_id: m.uploaded_by_party_id, uploaded: m.created_at }))} party={party} />
                </>
              )}
            </section>
          )}

          {tab === 'sessions' && (
            <>
              {d.sessions.length === 0 && <section className="cc-card cc-card--pad"><p className="cl-empty">No Trading Session yet.</p></section>}
              {d.sessions.map((se) => (
                <details key={se.id} id={`se-${se.id}`} className="cc-card lf-session" open={LIVE_SESSION.includes(se.status) || d.sessions.length === 1 || hash === `#se-${se.id}`}>
                  <summary>
                    <span className="cc-mono">{se.ern}</span>
                    <span>{label(se.sale_format)}</span>
                    <span className={`cc-pill cc-pill--${STATUS_TONE[se.status] || (LIVE_SESSION.includes(se.status) ? 'ok' : 'muted')}`}>{label(se.status)}</span>
                    <span className="cc-lbl">{(se.bids || []).length} bids · {(se.offers || []).length} offers · {(se.disputes || []).length} disputes</span>
                  </summary>
                  <div className="lf-session__body">
                    {LIVE_SESSION.includes(se.status) && <div style={{ display: 'flex', justifyContent: 'flex-end' }}><StopAction label="Stop session" what={`Trading Session ${se.ern}`} onStop={(reason) => admin.stopSession(se.id, reason)} onDone={load} /></div>}
                    <Fields row={se} />
                    {(() => {
                      const parts = [['Disputes', se.disputes], ['Settlement', se.settlements], ['Bids', se.bids], ['Offers', se.offers], ['EMD deposits', se.emdHolds],
                        ...(se.sale_format === 'tender' ? [['Tender interest', se.tenderInterest]] : []), ['Chronicle', se.chronicles]];
                      const empty = parts.filter(([, r]) => !r || r.length === 0).map(([t]) => t.toLowerCase());
                      return (
                        <>
                          {parts.filter(([, r]) => r && r.length).map(([t, r]) => <Table key={t} title={t} rows={r} party={party} />)}
                          {empty.length > 0 && <p className="cl-empty" style={{ marginTop: 14 }}>No {empty.join(', ')}.</p>}
                        </>
                      );
                    })()}
                  </div>
                </details>
              ))}
            </>
          )}

          {tab === 'people' && (
            <div className="lf-grid">
              <section className="cc-card cc-card--pad">
                <h2 className="cc-h2">Seller {s && party(s.id)}</h2>
                <Fields row={s} />
              </section>
              <section className="cc-card cc-card--pad">
                <h2 className="cc-h2">TradeSphereX {d.tenant && <Link to={`/custodian/tenants?id=${d.tenant.id}`} className="cc-link">{d.tenant.name}</Link>}</h2>
                <h4 className="cl-h4">TSX Master</h4>
                {d.tsxMasters.length ? d.tsxMasters.map((m) => <div key={m.id}><Link to={`/user-detail?id=${m.id}`} className="cc-link">{m.full_name || m.mobile_number}</Link> <span className="cc-mono cc-lbl">{m.mobile_number}</span></div>) : <p className="cl-empty">None — nobody can approve Lots here.</p>}
                <Fields row={d.tenant} />
              </section>
            </div>
          )}

          {tab === 'activity' && (
            <section className="cc-card cc-card--pad">
              <dl className="cl-kv">
                <div><dt>Views</dt><dd>{d.engagement.views}</dd></div>
                <div><dt>Unique viewers</dt><dd>{d.engagement.uniqueViewers}</dd></div>
                <div><dt>Favourites</dt><dd>{d.engagement.favorites}</dd></div>
                <div><dt>Seller messages</dt><dd>{d.engagement.sellerMessages.length}</dd></div>
              </dl>
              <Table title="Seller messages" rows={d.engagement.sellerMessages} party={party} />
              <Table title="Other versions of this Lot" rows={d.versions} party={party} />
            </section>
          )}

          {tab === 'audit' && (
            <section className="cc-card cc-card--pad">
              {d.audit.length === 0 ? <p className="cl-empty">No entries.</p> : (
                <ol className="cl-audit">
                  {d.audit.map((a) => (
                    <li key={a.sequence_number}>
                      <span className="cc-mono cc-lbl">#{a.sequence_number} · {day(a.occurred_at)}</span>
                      <b>{label(a.event_type.replace(/\./g, ' · '))}</b>
                      <span className="cc-lbl">{a.actor_party_id ? `${a.actor_name || ''} ${a.actor_mobile || ''}`.trim() || a.actor_party_id : 'System'}{a.ip_address ? ` · ${a.ip_address}` : ''}</span>
                      <details><summary className="cc-lbl">Details</summary><code>{a.payload}</code></details>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
        </div>
      </div>
    </CustodianShell>
  );
}
