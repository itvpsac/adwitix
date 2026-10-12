import { useState } from 'react';
import { Link } from 'react-router-dom';
import { nowStamp, pushLedger } from '../../utils/auditLedger.js';
import './TenderConciergeConsole.css';
import AppHeader from '../../components/AppHeader.jsx';

const LOT = { id: 'TSN-2026-3381', title: 'Repossessed Excavator, CAT 320D', rv: '₹16,00,000' };
const CONCIERGE = { name: 'Vikram Chauhan', mobile: '+91 96xxxxxx73' };
const TAB_DEFS = [
  { key: 'eligibility', label: 'Eligibility & Invitations' },
  { key: 'documents', label: 'Documents' },
  { key: 'emd', label: 'EMD Log' },
  { key: 'closing', label: 'Closing' },
];
const INITIAL_INVITEES = [
  { name: 'Ramesh Agarwal', mobile: '+91 98xxxxxx12', kyc: 'Verified', kycColor: 'var(--color-success)', status: 'Accepted', statusColor: 'var(--color-success)', link: 'ebidhub.com/t/tsn-3381/x7fq2' },
  { name: 'Priyanka Suresh Holdings', mobile: '+91 97xxxxxx45', kyc: 'Verified', kycColor: 'var(--color-success)', status: 'Invited', statusColor: '#9C7430', link: 'ebidhub.com/t/tsn-3381/m9la0' },
];
const INITIAL_DOCS = [
  { title: 'Bespoke Terms v1', version: 'v1', publishedAt: '2026-07-28', status: 'Published' },
  { title: 'Asset Specification Sheet', version: 'v1', publishedAt: '2026-07-28', status: 'Published' },
];
const INITIAL_EMD_LOG = [
  { stakeholder: 'Ramesh Agarwal', amount: '₹1,85,000', ref: 'UTR2607311842', at: '2026-07-31 09:20', status: 'Cleared' },
];
const OFFERS_SEED = [
  { stakeholder: 'Ramesh Agarwal', amount: '₹17,20,000' },
  { stakeholder: 'Priyanka Suresh Holdings', amount: '₹16,45,000' },
];

export default function TenderConciergeConsole() {
  const [tab, setTab] = useState('eligibility');
  const [showInfo, setShowInfo] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteMobile, setInviteMobile] = useState('');
  const [invitees, setInvitees] = useState(INITIAL_INVITEES);
  const [docTitle, setDocTitle] = useState('');
  const [documents, setDocuments] = useState(INITIAL_DOCS);
  const [emdStakeholder, setEmdStakeholder] = useState('');
  const [emdAmount, setEmdAmount] = useState('');
  const [emdRef, setEmdRef] = useState('');
  const [emdLog, setEmdLog] = useState(INITIAL_EMD_LOG);
  const [revealed, setRevealed] = useState(false);
  const [closed, setClosed] = useState(false);
  const [awardedName, setAwardedName] = useState('');
  const [awardedAt, setAwardedAt] = useState('');

  const inviteValid = !!(inviteName && inviteMobile.length >= 8);
  const sendInvite = () => {
    if (!inviteValid) return;
    const slug = Math.random().toString(36).slice(2, 7);
    setInvitees([...invitees, { name: inviteName, mobile: inviteMobile, kyc: 'Pending', kycColor: '#9C7430', status: 'Invited', statusColor: '#9C7430', link: `ebidhub.com/t/tsn-3381/${slug}` }]);
    pushLedger('Granted Tender eligibility', `${LOT.id} · ${inviteName}`, '', CONCIERGE.name);
    setInviteName(''); setInviteMobile('');
  };
  const revokeInvitee = (i) => {
    const inv = invitees[i];
    setInvitees(invitees.filter((_, idx) => idx !== i));
    pushLedger('Revoked Tender eligibility', `${LOT.id} · ${inv.name}`, '', CONCIERGE.name);
  };
  const copyLink = (link) => { try { navigator.clipboard.writeText(`https://${link}`); } catch (e) { /* noop */ } };

  const docValid = !!docTitle;
  const uploadDoc = () => {
    if (!docValid) return;
    setDocuments([...documents, { title: docTitle, version: 'v1', publishedAt: new Date().toISOString().slice(0, 10), status: 'Published' }]);
    setDocTitle('');
  };
  const toggleDoc = (i) => {
    const next = [...documents];
    next[i] = { ...next[i], status: next[i].status === 'Published' ? 'Unpublished' : 'Published' };
    setDocuments(next);
  };

  const emdValid = !!(emdStakeholder && emdAmount && emdRef);
  const logEmd = () => {
    if (!emdValid) return;
    setEmdLog([...emdLog, { stakeholder: emdStakeholder, amount: `₹${emdAmount}`, ref: emdRef, at: nowStamp(), status: 'Cleared' }]);
    pushLedger(`Logged manual EMD ₹${emdAmount}`, `${LOT.id} · ${emdStakeholder}`, `Ref ${emdRef}`, CONCIERGE.name);
    setEmdStakeholder(''); setEmdAmount(''); setEmdRef('');
  };

  const award = (o) => {
    setClosed(true); setAwardedName(o.stakeholder); setAwardedAt(nowStamp());
    pushLedger(`Awarded Tender to ${o.stakeholder}`, LOT.id, 'Concierge selection against curated terms', CONCIERGE.name);
  };

  return (
    <div className="tcc-page">
      <AppHeader variant="dark" contextLabel="CoCo Concierge" contextNav={[{ label: "Console", to: "/tender-concierge-console", active: true }, { label: "Eligibility", to: "/tender-eligibility" }, { label: "Report", to: "/tender-auction-report" }, { label: "Stakeholder View", to: "/tender-stakeholder-view" }]} />

      <main className="tcc-main">
        <div className="legal-eyebrow">CoCo Concierge · Salvage Managers TSX</div>
        <div className="tcc-title-row">
          <h1 className="tcc-title">Tender Auction Back Office</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="tcc-info-btn">i</button>
        </div>
        <p className="tcc-sub">Tender is fully private and invite-only, run exclusively through the Concierge team on Salvage Managers' own storefront — no self-service seller tools apply here.</p>
        <p className="tcc-lot-line">{LOT.id} · {LOT.title} · RV {LOT.rv}</p>

        {showInfo && (
          <div className="tcc-info-box">
            <strong>Why this screen exists:</strong> Tender Auctions carry no fixed edit-hold window, no gateway EMD routing, and no automatic close — every step is Concierge-operated by hand, per BR-12/BR-26. This console covers the four operational pieces that self-service Lot flows don't need: who's invited, what's published to them, manually-logged EMD, and the manual close itself.
            <button onClick={() => setShowInfo(false)} className="tcc-info-close">Close</button>
          </div>
        )}

        <div className="tcc-tabs">
          {TAB_DEFS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`tcc-tab${tab === t.key ? ' tcc-tab--active' : ''}`}>{t.label}</button>
          ))}
        </div>

        {tab === 'eligibility' && (
          <>
            <div className="tcc-card">
              <div className="tcc-card__title">Invite a Stakeholder</div>
              <div className="tcc-form-row">
                <input placeholder="Full name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="tcc-input tcc-input--grow" />
                <input placeholder="Mobile (+91)" value={inviteMobile} onChange={(e) => setInviteMobile(e.target.value)} className="tcc-input" style={{ width: 160 }} />
                <button onClick={sendInvite} disabled={!inviteValid} className="tcc-primary-btn" style={{ background: inviteValid ? 'var(--color-bg-dark)' : '#E9EBF2', color: inviteValid ? '#fff' : 'var(--color-text-faint)' }}>Grant Eligibility &amp; Invite</button>
              </div>
            </div>
            <div className="tcc-table">
              <div className="tcc-table-head tcc-cols-invitees"><div>Stakeholder</div><div>KYC</div><div>Status</div><div>Stakeholder Link</div><div>Action</div></div>
              {invitees.map((inv, i) => (
                <div key={i} className="tcc-table-row tcc-cols-invitees">
                  <div><div className="tcc-cell-strong">{inv.name}</div><div className="tcc-cell-mono-faint">{inv.mobile}</div></div>
                  <div style={{ color: inv.kycColor, fontSize: 11.5 }}>{inv.kyc}</div>
                  <div style={{ color: inv.statusColor, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{inv.status}</div>
                  <div className="tcc-cell-mono-faint tcc-ellipsis">{inv.link}</div>
                  <div className="tcc-row-actions">
                    <button onClick={() => copyLink(inv.link)} className="tcc-mini-btn">Copy</button>
                    <button onClick={() => revokeInvitee(i)} className="tcc-mini-btn tcc-mini-btn--danger">Revoke</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'documents' && (
          <>
            <div className="tcc-card">
              <div className="tcc-card__title">Publish a Document</div>
              <p className="tcc-card__note">Only invited stakeholders can view published documents for this Tender.</p>
              <div className="tcc-form-row">
                <input placeholder="Document title (e.g. Bespoke Terms v2)" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="tcc-input tcc-input--grow" style={{ minWidth: 220 }} />
                <button onClick={uploadDoc} disabled={!docValid} className="tcc-primary-btn" style={{ background: docValid ? 'var(--color-bg-dark)' : '#E9EBF2', color: docValid ? '#fff' : 'var(--color-text-faint)' }}>Upload &amp; Publish</button>
              </div>
            </div>
            <div className="tcc-doc-list">
              {documents.map((d, i) => (
                <div key={i} className="tcc-doc-row">
                  <div><div className="tcc-cell-strong">{d.title}</div><div className="tcc-doc-meta">{d.version} · published {d.publishedAt}</div></div>
                  <span className="tcc-doc-status" style={{ background: d.status === 'Published' ? 'var(--color-success-bg)' : '#F1F2ED', color: d.status === 'Published' ? 'var(--color-success)' : 'var(--color-text-faint)' }}>{d.status}</span>
                  <button onClick={() => toggleDoc(i)} className="tcc-mini-btn">{d.status === 'Published' ? 'Unpublish' : 'Publish'}</button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'emd' && (
          <>
            <div className="tcc-card">
              <div className="tcc-card__title">Log a Manual EMD Transfer</div>
              <p className="tcc-card__note">Tender EMD routes via manual offline bank transfer only — no payment gateway (BR-26). Log each transfer as it clears.</p>
              <div className="tcc-form-row">
                <select value={emdStakeholder} onChange={(e) => setEmdStakeholder(e.target.value)} className="tcc-input" style={{ minWidth: 160 }}>
                  <option value="">Stakeholder…</option>
                  {invitees.map((inv) => <option key={inv.name} value={inv.name}>{inv.name}</option>)}
                </select>
                <input placeholder="Amount (₹)" value={emdAmount} onChange={(e) => setEmdAmount(e.target.value)} className="tcc-input" style={{ width: 140 }} />
                <input placeholder="Bank reference no." value={emdRef} onChange={(e) => setEmdRef(e.target.value)} className="tcc-input" style={{ width: 180 }} />
                <button onClick={logEmd} disabled={!emdValid} className="tcc-primary-btn" style={{ background: emdValid ? 'var(--color-bg-dark)' : '#E9EBF2', color: emdValid ? '#fff' : 'var(--color-text-faint)' }}>Log Entry</button>
              </div>
            </div>
            <div className="tcc-table">
              <div className="tcc-table-head tcc-cols-emd"><div>Stakeholder</div><div>Amount</div><div>Bank Ref</div><div>Logged</div><div>Status</div></div>
              {emdLog.map((e, i) => (
                <div key={i} className="tcc-table-row tcc-cols-emd">
                  <div className="tcc-cell-strong">{e.stakeholder}</div>
                  <div>{e.amount}</div>
                  <div className="tcc-cell-mono-faint">{e.ref}</div>
                  <div className="tcc-cell-mono-faint">{e.at}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-success)' }}>{e.status}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'closing' && (
          <>
            {!closed && (
              <div className="tcc-card">
                <div className="tcc-card__title">Close Bidding</div>
                <p className="tcc-card__note" style={{ maxWidth: 600 }}>Closing reveals every sealed offer to the Concierge. Award is Concierge judgment against the curated terms of this Tender — not automatic highest-price close.</p>
                <button onClick={() => setRevealed(true)} className="tcc-primary-btn" style={{ background: 'var(--color-bg-dark)', color: '#fff' }}>Close Bidding &amp; Reveal Offers</button>
              </div>
            )}
            {(revealed || closed) && (
              <div className="tcc-table" style={{ marginBottom: 18 }}>
                <div className="tcc-table-head tcc-cols-offers"><div>Stakeholder</div><div>Sealed Offer</div><div>Award</div></div>
                {OFFERS_SEED.map((o, i) => {
                  const awarded = awardedName === o.stakeholder;
                  return (
                    <div key={i} className="tcc-table-row tcc-cols-offers">
                      <div className="tcc-cell-strong">{o.stakeholder}</div>
                      <div style={{ fontFamily: 'var(--font-mono)' }}>{o.amount}</div>
                      <div><button onClick={() => award(o)} disabled={closed} className="tcc-mini-btn" style={{ background: closed && awarded ? 'var(--color-success)' : '#fff', color: closed && awarded ? '#fff' : 'var(--color-text)' }}>{closed && awarded ? 'Awarded' : 'Award'}</button></div>
                    </div>
                  );
                })}
              </div>
            )}
            {closed && (
              <div className="tcc-awarded-card">
                <div className="tcc-awarded-title">Awarded to {awardedName}</div>
                <p className="tcc-awarded-body">Decided {awardedAt} by {CONCIERGE.name} · {CONCIERGE.mobile}. This Lot now proceeds to Settlement.</p>
                <Link to="/tender-auction-report" className="tcc-awarded-cta">View Full Auction Report →</Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
