import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CustodianShell from '../../components/custodian/CustodianShell.jsx';
import StopAction from '../../components/custodian/StopAction.jsx';
import { admin } from '../../api/endpoints.js';
import { unwrap, mediaUrl } from '../../api/client.js';
import { formatCurrency } from '../../utils/format.js';
import './CustodianLot.css';

// The Custodian's full file on one Lot (D-133): GET /admin/listings/:id/dossier.
// Nothing is withheld — every field of the Lot, its seller, every Trading
// Session with its bids, offers, deposits, settlement and disputes, and the
// audit trail. Every stored field is listed, not a curated subset, so new
// columns show up here without a code change. Approving stays with the TSX
// Master (D-132); the Custodian can stop the Lot or any live session.
const LIVE_LOT = ['inventory', 'pending_approval', 'upcoming', 'active'];
const LIVE_SESSION = ['pending_approval', 'grace_period', 'active'];
const MONEY = /(amount|price|value|_fee|tds_amount|forfeited_to)/;
const HIDDEN = new Set(['bids', 'offers', 'emdHolds', 'tenderInterest', 'settlements', 'disputes', 'chronicles']);

const label = (k) => k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
function show(k, v) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  if (MONEY.test(k) && !Number.isNaN(Number(v))) return formatCurrency(v);
  return String(v);
}

function Fields({ row, skip = HIDDEN }) {
  const [all, setAll] = useState(false);
  if (!row) return <p className="cl-empty">—</p>;
  const entries = Object.entries(row).filter(([k]) => !skip.has(k));
  const shown = all ? entries : entries.filter(([, v]) => v !== null && v !== '' && v !== undefined);
  return (
    <>
      <dl className="cl-kv">
        {shown.map(([k, v]) => <div key={k}><dt>{label(k)}</dt><dd>{show(k, v)}</dd></div>)}
      </dl>
      {shown.length < entries.length && <button type="button" className="cl-more" onClick={() => setAll(true)}>Show {entries.length - shown.length} empty fields</button>}
    </>
  );
}

function Table({ title, rows, party }) {
  if (!rows || rows.length === 0) return <div className="cl-sub"><h4>{title}</h4><p className="cl-empty">None.</p></div>;
  const cols = Object.keys(rows[0]).filter((c) => c !== 'sale_event_id');
  return (
    <div className="cl-sub">
      <h4>{title} <span className="cc-lbl">{rows.length}</span></h4>
      <div className="cl-table">
        <table>
          <thead><tr>{cols.map((c) => <th key={c}>{label(c)}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id || JSON.stringify(r)}>
                {cols.map((c) => <td key={c}>{/party_id$/.test(c) && r[c] ? party(r[c]) : show(c, r[c])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CustodianLot() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!id) return;
    admin.lotDossier(id).then((r) => setD(unwrap(r))).catch((e) => setError(e.description || e.message || 'Could not load this Lot.'));
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (d && window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, [d]);

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
  return (
    <CustodianShell>
      <div className="cc-wrap">
        <div className="cc-head">
          <div>
            <p className="cc-lbl" style={{ margin: 0 }}><Link to="/lot-directory" className="cc-link">Lots</Link> / Lot file</p>
            <h1 className="cc-h1" style={{ marginTop: 6 }}>{l.title || l.make_model || l.category}</h1>
            <p className="cc-sub">
              <span className="cc-pill cc-pill--muted">{label(l.status)}</span>{' '}
              on <Link to={`/custodian/tenants?id=${l.tenant_id}`} className="cc-link">{d.tenant ? d.tenant.name : l.tenant_id}</Link>
              {' · '}<span className="cc-mono">{l.id}</span>
              {' · '}<Link to={`/lot-detail?id=${l.id}`} className="cc-link">Public page →</Link>
            </p>
          </div>
          {LIVE_LOT.includes(l.status) && <StopAction label="Stop Lot" what={`the Lot "${l.title || l.category}"`} onStop={(reason) => admin.stopLot(l.id, reason)} onDone={load} />}
        </div>

        <div className="cc-split">
          <section className="cc-card cc-card--pad cc-wide" aria-labelledby="lf">
            <h2 id="lf" className="cc-h2">Lot</h2>
            <Fields row={l} />
          </section>
          <div className="cc-narrow" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <section className="cc-card cc-card--pad" aria-labelledby="sf">
              <h2 id="sf" className="cc-h2">Seller {s && party(s.id)}</h2>
              <Fields row={s} />
            </section>
            <section className="cc-card cc-card--pad" aria-labelledby="tf">
              <h2 id="tf" className="cc-h2">TradeSphereX</h2>
              <Fields row={d.tenant} />
              <h4 className="cl-h4">TSX Master</h4>
              {d.tsxMasters.length ? d.tsxMasters.map((m) => <div key={m.id}><Link to={`/user-detail?id=${m.id}`} className="cc-link">{m.full_name || m.mobile_number}</Link> <span className="cc-mono cc-lbl">{m.mobile_number}</span></div>) : <p className="cl-empty">None — nobody can approve Lots here.</p>}
            </section>
            <section className="cc-card cc-card--pad" aria-labelledby="ef">
              <h2 id="ef" className="cc-h2">Engagement</h2>
              <dl className="cl-kv">
                <div><dt>Views</dt><dd>{d.engagement.views}</dd></div>
                <div><dt>Unique viewers</dt><dd>{d.engagement.uniqueViewers}</dd></div>
                <div><dt>Favorites</dt><dd>{d.engagement.favorites}</dd></div>
                <div><dt>Seller messages</dt><dd>{d.engagement.sellerMessages.length}</dd></div>
              </dl>
            </section>
          </div>
        </div>

        <section className="cc-card cc-card--pad" aria-labelledby="mf">
          <h2 id="mf" className="cc-h2">Media <span className="cc-lbl">{d.media.length}</span></h2>
          {d.media.length === 0 ? <p className="cl-empty">No media.</p> : (
            <div className="cl-media">
              {d.media.map((m) => (
                <a key={m.id} href={mediaUrl(m.file_path)} target="_blank" rel="noreferrer" title={m.file_path}>
                  {m.media_type === 'image' ? <img src={mediaUrl(m.file_path)} alt={m.original_filename || 'Lot photo'} loading="lazy" /> : <span>{m.media_type}: {m.original_filename || m.file_path}</span>}
                </a>
              ))}
            </div>
          )}
        </section>

        <h2 className="cc-h2">Trading Sessions <span className="cc-lbl">{d.sessions.length}</span></h2>
        {d.sessions.length === 0 && <p className="cl-empty">No Trading Session yet.</p>}
        {d.sessions.map((se) => (
          <section key={se.id} id={`se-${se.id}`} className="cc-card cc-card--pad" aria-label={`Trading Session ${se.ern}`}>
            <div className="cc-head" style={{ alignItems: 'center' }}>
              <h3 className="cc-h2" style={{ fontSize: 17 }}><span className="cc-mono">{se.ern}</span> · {label(se.sale_format)} · <span className="cc-pill cc-pill--muted">{label(se.status)}</span></h3>
              {LIVE_SESSION.includes(se.status) && <StopAction label="Stop session" what={`Trading Session ${se.ern}`} onStop={(reason) => admin.stopSession(se.id, reason)} onDone={load} />}
            </div>
            <Fields row={se} />
            <Table title="Bids" rows={se.bids} party={party} />
            <Table title="Offers" rows={se.offers} party={party} />
            <Table title="EMD deposits" rows={se.emdHolds} party={party} />
            {se.sale_format === 'tender' && <Table title="Tender interest" rows={se.tenderInterest} party={party} />}
            <Table title="Settlement" rows={se.settlements} party={party} />
            <Table title="Disputes" rows={se.disputes} party={party} />
            <Table title="Chronicle" rows={se.chronicles} party={party} />
          </section>
        ))}

        {(d.versions.length > 0 || d.engagement.sellerMessages.length > 0) && (
          <section className="cc-card cc-card--pad">
            {d.versions.length > 0 && <Table title="Other versions of this Lot" rows={d.versions} party={party} />}
            {d.engagement.sellerMessages.length > 0 && <Table title="Seller messages" rows={d.engagement.sellerMessages} party={party} />}
          </section>
        )}

        <section className="cc-card cc-card--pad" aria-labelledby="af">
          <h2 id="af" className="cc-h2">Audit trail <span className="cc-lbl">{d.audit.length}</span></h2>
          {d.audit.length === 0 ? <p className="cl-empty">No entries.</p> : (
            <ol className="cl-audit">
              {d.audit.map((a) => (
                <li key={a.sequence_number}>
                  <span className="cc-mono cc-lbl">#{a.sequence_number} · {a.occurred_at}</span>
                  <b>{a.event_type}</b>
                  <span className="cc-lbl">{a.actor_party_id ? `${a.actor_name || ''} ${a.actor_mobile || ''}`.trim() || a.actor_party_id : 'System'}{a.ip_address ? ` · ${a.ip_address}` : ''}</span>
                  <code>{a.payload}</code>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </CustodianShell>
  );
}
