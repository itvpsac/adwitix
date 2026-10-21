import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import { unwrap } from '../../api/client.js';
import './UserDetail.css';

const titleCase = (v) => (v ? String(v).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—');
const money = (v) => (v == null ? '—' : `₹${Number(v).toLocaleString('en-IN')}`);
const day = (v) => (v || '').slice(0, 10);
const stars = (v) => (v == null ? '—' : Number(v).toFixed(1));

export default function UserDetail() {
  const [params] = useSearchParams();
  const partyId = params.get('id');
  const [promoteTenantId, setPromoteTenantId] = useState('');
  const [granted, setGranted] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // GET /admin/users/:id → { party, roles, tenantNames, purchases, sales, disputes, tenants }
  const { data, loading, error: loadError, reload } = useApiQuery(() => admin.userDetail(partyId), [partyId], { skip: !partyId });
  const p = (data && data.party) || {};
  const tenantNames = (data && data.tenantNames) || {};
  const TENANT_OPTIONS = (data && data.tenants) || [];
  const PARTY = {
    name: p.full_name || p.mobile_number || '—',
    mobile: p.mobile_number || '—',
    entityType: titleCase(p.entity_type),
    kyc: titleCase(p.kyc_status),
    buyerStars: stars(p.star_rating), buyerOffences: p.offence_count_buyer ?? 0,
    sellerStars: stars(p.seller_star_rating), sellerOffences: p.offence_count_seller ?? 0,
    // Standing Review counters (party.standing_review_*), not the forced-neutral counts.
    complaints: p.standing_review_complaint_count ?? 0, cbsOffences: p.standing_review_cbs_offense_count ?? 0,
    delisted: !!p.seller_delisted_at, delistedAt: day(p.seller_delisted_at), delistedReason: p.seller_delisted_reason,
  };
  const ROLES = ((data && data.roles) || []).map((r) => `${titleCase(r.role)} — ${r.tenant_id ? tenantNames[r.tenant_id] || r.tenant_id : 'platform-wide'}`);
  const settlementRow = (x) => ({ amount: money(x.final_price), status: titleCase(x.status), date: day(x.created_at) });
  const PURCHASES = ((data && data.purchases) || []).map(settlementRow);
  const SALES = ((data && data.sales) || []).map(settlementRow);
  const DISPUTES = ((data && data.disputes) || []).map((d) => ({
    category: titleCase(d.category), status: titleCase(d.status),
    role: d.filed_by_party_id === partyId ? 'Filed by them' : 'Filed against them', date: day(d.created_at),
  }));

  const promote = async () => {
    if (!promoteTenantId || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = unwrap(await admin.promoteTenantAdmin(partyId, { tenant_id: promoteTenantId }));
      const tenantName = (TENANT_OPTIONS.find((t) => t.id === promoteTenantId) || {}).name || 'the selected TradeSphereX';
      setGranted(res.message || `Granted Tenant Admin on ${tenantName}.`);
      reload();
    } catch (err) {
      setError(err.message || 'Could not grant Tenant Admin.');
    } finally {
      setBusy(false);
    }
  };

  if (!partyId || loadError) {
    return (
      <ConsoleFrame header={<DashboardHeader navItems={[{ label: '← Users', to: '/user-directory' }]} />}>
      <div className="udet-page">
        <main className="udet-main"><p className="udet-meta">{partyId ? (loadError.message || 'User not found.') : 'Select a user from the User Directory.'}</p></main>
      </div>
      </ConsoleFrame>
    );
  }

  return (
    <ConsoleFrame header={<DashboardHeader navItems={[{ label: '← Users', to: '/user-directory' }]} />}>
    <div className="udet-page">
      <main className="udet-main">
        <h1 className="udet-title">{loading ? 'Loading…' : PARTY.name}</h1>
        {loading ? null : (<>
        <p className="udet-meta">{PARTY.mobile} · {PARTY.entityType} · KYC: {PARTY.kyc}</p>

        <div className="udet-stats">
          <div className="udet-stat-card"><div className="udet-stat-num">{PARTY.buyerStars}★</div><div className="udet-stat-label">Trader Rating · {PARTY.buyerOffences} offences</div></div>
          <div className="udet-stat-card"><div className="udet-stat-num">{PARTY.sellerStars}★</div><div className="udet-stat-label">Market Maker Rating · {PARTY.sellerOffences} offences</div></div>
          <div className="udet-stat-card"><div className="udet-stat-num">{PARTY.complaints}</div><div className="udet-stat-label">Standing Complaints · {PARTY.cbsOffences} CBS offenses</div></div>
        </div>

        {PARTY.delisted && <div className="udet-delisted">Seller delisted on {PARTY.delistedAt}{PARTY.delistedReason ? ` — ${PARTY.delistedReason}` : ''}</div>}

        <h3 className="udet-h3">Roles</h3>
        <ul className="udet-roles">{ROLES.length ? ROLES.map((r, i) => <li key={i}>{r}</li>) : <li>No active roles.</li>}</ul>

        <div className="udet-promote-card">
          <div className="udet-promote-title">Promote to Tenant Admin</div>
          <p className="udet-promote-note">This auto-demotes whoever currently holds Tenant Admin for the selected TradeSphereX.</p>
          <div className="udet-promote-row">
            <select value={promoteTenantId} onChange={(e) => { setPromoteTenantId(e.target.value); setGranted(''); }} className="udet-promote-select">
              <option value="">Select a TradeSphereX…</option>
              {TENANT_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={promote} disabled={!promoteTenantId || busy} className="udet-grant-btn" style={{ background: promoteTenantId ? 'var(--color-success)' : '#E9EBF2', color: promoteTenantId ? '#fff' : 'var(--color-text-faint)' }}>Grant</button>
          </div>
          {granted && <p className="udet-granted-note">{granted}</p>}
          {error && <p className="udet-granted-note" style={{ color: 'var(--color-danger)' }}>{error}</p>}
        </div>

        <h3 className="udet-h3">Recent Purchases (as Trader)</h3>
        <div className="udet-table">{PURCHASES.length === 0 && <div className="udet-table-row"><span className="udet-cell-faint">No purchases.</span></div>}{PURCHASES.map((p, i) => (
          <div key={i} className="udet-table-row udet-table-row--3col"><span>{p.amount}</span><span className="udet-cell-muted">{p.status}</span><span className="udet-cell-faint">{p.date}</span></div>
        ))}</div>

        <h3 className="udet-h3">Recent Sales (as Market Maker)</h3>
        <div className="udet-table">{SALES.length === 0 && <div className="udet-table-row"><span className="udet-cell-faint">No sales.</span></div>}{SALES.map((sl, i) => (
          <div key={i} className="udet-table-row udet-table-row--3col"><span>{sl.amount}</span><span className="udet-cell-muted">{sl.status}</span><span className="udet-cell-faint">{sl.date}</span></div>
        ))}</div>

        <h3 className="udet-h3">Disputes (filed or against)</h3>
        <div className="udet-table udet-table--last">{DISPUTES.length === 0 && <div className="udet-table-row"><span className="udet-cell-faint">No disputes.</span></div>}{DISPUTES.map((d, i) => (
          <div key={i} className="udet-table-row udet-table-row--4col"><span>{d.category}</span><span className="udet-cell-muted">{d.status}</span><span className="udet-cell-faint">{d.role}</span><span className="udet-cell-faint">{d.date}</span></div>
        ))}</div>
        </>)}
      </main>
    </div>
    </ConsoleFrame>
  );
}
