import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import './UserDetail.css';

const PARTY = {
  name: 'Ramesh Agarwal', mobile: '+91 98xxxxxx12', entityType: 'Individual', kyc: 'Verified',
  buyerStars: '4.2', buyerOffences: 0, sellerStars: '3.8', sellerOffences: 1, complaints: 0, cbsOffences: 0,
  delisted: false, delistedAt: '', delistedReason: '',
};
const TENANT_OPTIONS = [
  { id: 't1', name: 'Northline Industrial Auctions' }, { id: 't2', name: 'Coastal Salvage Co-op' }, { id: 't3', name: 'Apex Fleet Disposals' },
];
const ROLES = ['Trader — platform-wide', 'Market Maker — Northline Industrial Auctions'];
const PURCHASES = [{ amount: '₹3,10,000', status: 'Completed', date: '2026-07-18' }, { amount: '₹1,15,000', status: 'Stalled', date: '2026-06-25' }];
const SALES = [{ amount: '₹4,52,000', status: 'Completed', date: '2026-07-31' }];
const DISPUTES = [{ category: 'Condition/Delivery', status: 'Resolved', role: 'Filed by them', date: '2026-06-30' }];

export default function UserDetail() {
  const [promoteTenantId, setPromoteTenantId] = useState('');
  const [granted, setGranted] = useState(false);
  const grantedTenantName = (TENANT_OPTIONS.find((t) => t.id === promoteTenantId) || {}).name;

  return (
    <div className="udet-page">
      <DashboardHeader navItems={[{ label: '← Users', to: '/user-directory' }]} />
      <main className="udet-main">
        <h1 className="udet-title">{PARTY.name}</h1>
        <p className="udet-meta">{PARTY.mobile} · {PARTY.entityType} · KYC: {PARTY.kyc}</p>

        <div className="udet-stats">
          <div className="udet-stat-card"><div className="udet-stat-num">{PARTY.buyerStars}★</div><div className="udet-stat-label">Trader Rating · {PARTY.buyerOffences} offences</div></div>
          <div className="udet-stat-card"><div className="udet-stat-num">{PARTY.sellerStars}★</div><div className="udet-stat-label">Market Maker Rating · {PARTY.sellerOffences} offences</div></div>
          <div className="udet-stat-card"><div className="udet-stat-num">{PARTY.complaints}</div><div className="udet-stat-label">Standing Complaints · {PARTY.cbsOffences} CBS offenses</div></div>
        </div>

        {PARTY.delisted && <div className="udet-delisted">Delisted for confirmed fraud on {PARTY.delistedAt} — {PARTY.delistedReason}</div>}

        <h3 className="udet-h3">Roles</h3>
        <ul className="udet-roles">{ROLES.map((r) => <li key={r}>{r}</li>)}</ul>

        <div className="udet-promote-card">
          <div className="udet-promote-title">Promote to Tenant Admin</div>
          <p className="udet-promote-note">This auto-demotes whoever currently holds Tenant Admin for the selected TradeSphereX.</p>
          <div className="udet-promote-row">
            <select value={promoteTenantId} onChange={(e) => { setPromoteTenantId(e.target.value); setGranted(false); }} className="udet-promote-select">
              <option value="">Select a TradeSphereX…</option>
              {TENANT_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={() => promoteTenantId && setGranted(true)} disabled={!promoteTenantId} className="udet-grant-btn" style={{ background: promoteTenantId ? 'var(--color-success)' : '#E9EBF2', color: promoteTenantId ? '#fff' : 'var(--color-text-faint)' }}>Grant</button>
          </div>
          {granted && <p className="udet-granted-note">Granted Tenant Admin on {grantedTenantName}.</p>}
        </div>

        <h3 className="udet-h3">Recent Purchases (as Trader)</h3>
        <div className="udet-table">{PURCHASES.map((p, i) => (
          <div key={i} className="udet-table-row udet-table-row--3col"><span>{p.amount}</span><span className="udet-cell-muted">{p.status}</span><span className="udet-cell-faint">{p.date}</span></div>
        ))}</div>

        <h3 className="udet-h3">Recent Sales (as Market Maker)</h3>
        <div className="udet-table">{SALES.map((sl, i) => (
          <div key={i} className="udet-table-row udet-table-row--3col"><span>{sl.amount}</span><span className="udet-cell-muted">{sl.status}</span><span className="udet-cell-faint">{sl.date}</span></div>
        ))}</div>

        <h3 className="udet-h3">Disputes (filed or against)</h3>
        <div className="udet-table udet-table--last">{DISPUTES.map((d, i) => (
          <div key={i} className="udet-table-row udet-table-row--4col"><span>{d.category}</span><span className="udet-cell-muted">{d.status}</span><span className="udet-cell-faint">{d.role}</span><span className="udet-cell-faint">{d.date}</span></div>
        ))}</div>
      </main>
    </div>
  );
}
