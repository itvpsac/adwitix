import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CustodianShell from '../../components/custodian/CustodianShell.jsx';
import StopAction from '../../components/custodian/StopAction.jsx';
import RatingChart from '../../components/custodian/RatingChart.jsx';
import { Fields, Table, label } from '../../components/custodian/DossierParts.jsx';
import { admin } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import './CustodianLot.css';

// The Custodian's file on one person (D-134), across every TradeSphereX
// (BR-37): GET /admin/users/:id/dossier. Everything about them as a Trader,
// and as a Market Maker / TSX Master once they are one, their complete
// star-rating history, risk record and audit trail. Two limits, by the
// project owner's decision: BR-16 — their bids/offers/deposits on a session
// that is still live appear only after it closes — and browsing (searches,
// lots viewed, favourites) stays private. Control here: freeze / unfreeze
// and Promote to TSX Master; ratings move only through rating events (BR-36).
const SECTIONS = [['id', 'Identity & KYC'], ['roles', 'Roles'], ['ratings', 'Star ratings'], ['buying', 'Trading'], ['selling', 'Selling'], ['risk', 'Risk'], ['audit', 'Audit trail']];

export default function CustodianUser() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const [d, setD] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [error, setError] = useState('');
  const [promoteTo, setPromoteTo] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    if (!id) return;
    admin.userDossier(id).then((r) => setD(unwrap(r))).catch((e) => setError(e.description || e.message || 'Could not load this user.'));
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { admin.tenants().then((r) => setTenants((unwrap(r) || {}).tenants || [])).catch(() => {}); }, []);

  const promote = async () => {
    setNote('');
    try {
      const res = unwrap(await admin.promoteTenantAdmin(id, { tenant_id: promoteTo })) || {};
      setNote(res.message || 'Promoted to TSX Master.');
      setPromoteTo('');
      load();
    } catch (e) {
      setNote(e.description || e.message || 'Could not promote.');
    }
  };

  if (!id) return <CustodianShell><p className="cc-lbl">Pick someone from <Link to="/user-directory" className="cc-link">Users</Link>.</p></CustodianShell>;
  if (error) return <CustodianShell><p className="cc-error">{error}</p></CustodianShell>;
  if (!d) return <CustodianShell><p className="cc-lbl">Loading…</p></CustodianShell>;

  const p = d.party;
  const party = (pid) => (pid === id ? <span>this user</span> : <Link to={`/user-detail?id=${pid}`} className="cc-link cc-mono">{pid}</Link>);
  const activeRoles = d.roles.filter((r) => !r.revoked_at);
  const isSeller = activeRoles.some((r) => r.role === 'seller') || d.selling.lots.length > 0;
  const isMaster = activeRoles.some((r) => r.role === 'tenant_admin');
  const hidden = d.hiddenWhileLive || {};
  const hiddenCount = (hidden.bids || 0) + (hidden.offers || 0) + (hidden.emdHolds || 0) + (hidden.tenderInterest || 0);
  const masterActions = d.audit.filter((a) => a.actor_party_id === id && /approv|reject|emergency|suspend|decid|ruling/.test(a.event_type));

  return (
    <CustodianShell>
      <div className="cc-wrap">
        <div className="cc-head">
          <div>
            <p className="cc-lbl" style={{ margin: 0 }}><Link to="/user-directory" className="cc-link">Users</Link> / User file</p>
            <h1 className="cc-h1" style={{ marginTop: 6 }}>{p.full_name || 'Unnamed'}</h1>
            <p className="cc-sub">
              <span className="cc-mono">{p.mobile_number}</span> · {label(p.entity_type || 'individual')} · KYC {label(p.kyc_status || 'none')}
              {' · '}Trader {Number(p.star_rating ?? 3).toFixed(1)}★ · Market Maker {Number(p.seller_star_rating ?? 3).toFixed(1)}★
              {isMaster && ' · TSX Master'}
            </p>
          </div>
          {p.frozen_at
            ? <StopAction label="Unfreeze" verb="Unfreeze" what={`${p.full_name || p.mobile_number}'s account`} note="They will be able to bid, offer, pledge and sell again. The reason is recorded in the Audit Ledger." onStop={(r) => admin.unfreezeUser(id, r)} onDone={load} />
            : <StopAction label="Freeze account" verb="Freeze" what={`${p.full_name || p.mobile_number}'s account`} note="They keep their record and can still sign in and finish open settlements, but can't bid, offer, pledge, list or sell until unfrozen. Their live lots keep running — stop those separately if needed. The reason is recorded in the Audit Ledger." onStop={(r) => admin.freezeUser(id, r)} onDone={load} />}
        </div>

        {p.frozen_at && <p className="cl-banner cl-banner--bad" role="status">Frozen since {p.frozen_at}: {p.frozen_reason}</p>}
        {p.seller_delisted_at && <p className="cl-banner cl-banner--bad">Seller delisted {p.seller_delisted_at}{p.seller_delisted_reason ? `: ${p.seller_delisted_reason}` : ''}</p>}
        {hiddenCount > 0 && <p className="cl-banner cl-banner--info">{hiddenCount} bid/offer/deposit record{hiddenCount === 1 ? '' : 's'} on {hidden.sessions} live Trading Session{hidden.sessions === 1 ? '' : 's'} {hiddenCount === 1 ? 'is' : 'are'} hidden until {hidden.sessions === 1 ? 'it closes' : 'they close'} (BR-16).</p>}

        <nav className="cl-tabs" aria-label="Sections">{SECTIONS.filter(([k]) => k !== 'selling' || isSeller).map(([k, l]) => <a key={k} href={`#${k}`}>{l}</a>)}</nav>

        <section id="id" className="cc-card cc-card--pad">
          <h2 className="cc-h2">Identity &amp; KYC</h2>
          <Fields row={p} skip={new Set()} />
          <Table title="Addresses" rows={d.kyc.addresses} party={party} />
          <Table title="Documents" rows={d.kyc.documents} party={party} />
          <Table title="Consents (BR-51)" rows={d.kyc.consents} party={party} />
        </section>

        <section id="roles" className="cc-card cc-card--pad">
          <h2 className="cc-h2">Roles</h2>
          <Table title="Every role, active and revoked" rows={d.roles.map(({ tenant_id_key, revoked_at_key, active_tenant_admin_marker, ...r }) => r)} party={party} />
          <div className="cl-sub" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 14 }}>
            <select value={promoteTo} onChange={(e) => setPromoteTo(e.target.value)} className="dq-input" style={{ maxWidth: 280 }} aria-label="TradeSphereX to make them TSX Master of">
              <option value="">Make TSX Master of…</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button type="button" className="cc-btn cc-btn--ok" disabled={!promoteTo} onClick={promote}>Promote</button>
            <span className="cc-lbl">Replaces that TradeSphereX&apos;s current TSX Master (BR-44).</span>
          </div>
          {note && <p className="cc-lbl" role="status">{note}</p>}
          {isMaster && <Table title="Decisions taken as TSX Master" rows={masterActions.map(({ sequence_number, occurred_at, event_type, payload }) => ({ sequence_number, occurred_at, event_type, payload }))} party={party} />}
        </section>

        <section id="ratings" className="cc-card cc-card--pad">
          <h2 className="cc-h2">Star ratings</h2>
          <RatingChart events={d.ratings.events} start={p.created_at} current={p} />
          <Fields row={d.ratings.current} skip={new Set()} />
          <Table title="Every rating event — applied, pending, rejected, appealed" rows={d.ratings.events.map(({ party_id, ...e }) => e)} party={party} />
        </section>

        <section id="buying" className="cc-card cc-card--pad">
          <h2 className="cc-h2">Trading (as Trader)</h2>
          <Table title="Purchases" rows={d.buying.purchases} party={party} />
          <Table title="Bids" rows={d.buying.bids} party={party} />
          <Table title="Offers" rows={d.buying.offers} party={party} />
          <Table title="EMD deposits" rows={d.buying.emdHolds} party={party} />
          <Table title="Tender interest" rows={d.buying.tenderInterest} party={party} />
          <Table title="Tender eligibility" rows={d.buying.tenderEligibility} party={party} />
        </section>

        {isSeller && (
          <section id="selling" className="cc-card cc-card--pad">
            <h2 className="cc-h2">Selling (as Market Maker)</h2>
            <Table title="Seller applications" rows={d.selling.applications} party={party} />
            <div className="cl-sub">
              <h4>Lots <span className="cc-lbl">{d.selling.lots.length}</span></h4>
              {d.selling.lots.length === 0 ? <p className="cl-empty">None.</p> : (
                <ul style={{ margin: 0, paddingLeft: 18, font: '500 13px/1.7 var(--font-sans)' }}>
                  {d.selling.lots.map((l) => <li key={l.id}><Link to={`/custodian/lot?id=${l.id}`} className="cc-link">{l.title || l.category}</Link> · {label(l.status)} · {l.tenant_name} · {String(l.created_at).slice(0, 10)}</li>)}
                </ul>
              )}
            </div>
            <Table title="Trading Sessions on their lots" rows={d.selling.sessions} party={party} />
            <Table title="Sales" rows={d.selling.sales} party={party} />
            <Table title="Messages to buyers" rows={d.selling.sellerMessages} party={party} />
          </section>
        )}

        <section id="risk" className="cc-card cc-card--pad">
          <h2 className="cc-h2">Risk</h2>
          <Table title="Disputes" rows={d.risk.disputes} party={party} />
          <Table title="Chargebacks" rows={d.risk.chargebacks} party={party} />
          <Table title="AML flags" rows={d.risk.amlFlags} party={party} />
          <Table title="Payout reviews" rows={d.risk.payoutReviews} party={party} />
        </section>

        <section id="audit" className="cc-card cc-card--pad">
          <h2 className="cc-h2">Audit trail <span className="cc-lbl">{d.audit.length}</span></h2>
          <p className="cc-lbl" style={{ margin: '4px 0 0' }}>Everything they did, and everything that names them. Search history and lots viewed are not shown (privacy).</p>
          {d.audit.length === 0 ? <p className="cl-empty">No entries.</p> : (
            <ol className="cl-audit">
              {d.audit.map((a) => (
                <li key={a.sequence_number}>
                  <span className="cc-mono cc-lbl">#{a.sequence_number} · {a.occurred_at}{a.ip_address ? ` · ${a.ip_address}` : ''}</span>
                  <b>{a.event_type}</b>
                  <span className="cc-lbl">{a.actor_party_id === id ? 'By this user' : a.actor_party_id ? `By ${a.actor_name || a.actor_party_id}` : 'System'}</span>
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
