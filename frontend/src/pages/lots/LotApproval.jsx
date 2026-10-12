import { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import './LotApproval.css';

const INITIAL_LOTS = [
  { id: 'LOT-48210', title: 'Repossessed Excavator, CAT 320D', category: 'Construction Equipment', condition: 'Working, Moderate Wear', submittedAt: '2026-07-31 10:20', marketMaker: 'Northline Salvage Co.', marketMakerMobile: '91xxxxxx02', preCheckScore: 84, description: 'Hydraulic excavator, 2016 model, decommissioned from municipal fleet. Undercarriage shows moderate wear; engine serviced 3 months ago.', decided: false, decision: null, wasEdited: false },
  { id: 'LOT-48233', title: 'Warehouse Racking Lot (40 units)', category: 'Furniture & Fixtures', condition: 'Used, Good Condition', submittedAt: '2026-07-31 14:05', marketMaker: 'Coastal Fleet Disposals', marketMakerMobile: '90xxxxxx55', preCheckScore: 91, description: 'Heavy-duty steel racking, dismantled from a closed distribution center. All units include mounting hardware.', decided: false, decision: null, wasEdited: false },
  { id: 'LOT-48250', title: 'Diesel Generator Set, 125kVA', category: 'Industrial Machinery', condition: 'Working, Minor Wear', submittedAt: '2026-08-01 09:12', marketMaker: 'Northline Salvage Co.', marketMakerMobile: '91xxxxxx02', preCheckScore: 76, description: 'Standby generator, low running hours, minor surface rust on housing. Full service history available on request.', decided: false, decision: null, wasEdited: false },
];
const INITIAL_SESSIONS = [
  { id: 's1', ern: 'ERN-20260731-042', lotTitle: 'Repossessed Excavator, CAT 320D', format: 'TENDER', reserveValue: '₹16,00,000', startDate: '2026-08-04', requestedAt: '2026-07-31 11:00', marketMaker: 'Northline Salvage Co.', marketMakerMobile: '91xxxxxx02', decided: false, decision: null },
  { id: 's2', ern: 'ERN-20260730-039', lotTitle: 'CNC Lathe Machine, 2018', format: 'EASY', reserveValue: '₹3,10,000', startDate: '2026-08-03', requestedAt: '2026-07-30 17:20', marketMaker: 'Coastal Fleet Disposals', marketMakerMobile: '90xxxxxx55', decided: false, decision: null },
];
const TSX_MASTER = { name: 'Rajesh Menon', mobile: '91xxxxxx10' };

export default function LotApproval() {
  const [tab, setTab] = useState('lots');
  const [view, setView] = useState('queue');
  const [selectedId, setSelectedId] = useState(null);
  const [lots, setLots] = useState(INITIAL_LOTS);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [lotReasonDraft, setLotReasonDraft] = useState('');
  const [lotError, setLotError] = useState('');
  const [sessionReasonDraft, setSessionReasonDraft] = useState('');
  const [sessionError, setSessionError] = useState('');
  const [editingLot, setEditingLot] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', category: '', condition: '', description: '' });

  const selectedLot = lots.find((l) => l.id === selectedId);
  const selectedSession = sessions.find((se) => se.id === selectedId);
  const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

  const decideLot = (label, reason) => {
    setLots(lots.map((l) => (l.id === selectedId ? { ...l, decided: true, decision: { label, reason, at: now() } } : l)));
  };
  const decideSession = (label, reason) => {
    setSessions(sessions.map((se) => (se.id === selectedId ? { ...se, decided: true, decision: { label, reason, at: now() } } : se)));
  };
  const saveLotEdit = () => {
    setLots(lots.map((l) => (l.id === selectedId ? { ...l, ...editForm, wasEdited: true, editedAt: now() } : l)));
    setEditingLot(false);
  };

  return (
    <div className="la-page">
      <DashboardHeader consoleLabel="TSX Master" navItems={[{ label: 'Dashboard', to: '/tenant-admin-dashboard' }, { label: 'Lot Approval', to: '/lot-approval', active: true }]} />
      <main className="la-main">
        <div className="legal-eyebrow">TSX Master · Northline Industrial Auctions</div>
        <h1 className="la-title">Lot &amp; Trading Session Approval</h1>
        <p className="la-sub">Review submitted Lots and requested Trading Sessions before they go live on this TradeSphereX.</p>
        <p className="la-reviewer">Reviewing as: {TSX_MASTER.name} · {TSX_MASTER.mobile}</p>

        <div className="la-tabs">
          <button onClick={() => { setTab('lots'); setView('queue'); }} className={`la-tab${tab === 'lots' ? ' la-tab--active' : ''}`}>Lots ({lots.filter((l) => !l.decided).length})</button>
          <button onClick={() => { setTab('sessions'); setView('queue'); }} className={`la-tab${tab === 'sessions' ? ' la-tab--active' : ''}`}>Trading Sessions ({sessions.filter((s) => !s.decided).length})</button>
        </div>

        {view === 'queue' && tab === 'lots' && (
          <div className="la-list">
            {lots.filter((l) => !l.decided).map((l) => (
              <button key={l.id} onClick={() => { setSelectedId(l.id); setLotReasonDraft(''); setLotError(''); setView('lotDetail'); }} className="la-row">
                <div className="la-thumb" />
                <div className="la-row__body">
                  <p className="la-row__meta">{l.id} · SUBMITTED {l.submittedAt} · {l.marketMaker} ({l.marketMakerMobile})</p>
                  <p className="la-row__title">{l.title}</p>
                  <p className="la-row__sub">{l.category} · {l.condition} · Pre-Check {l.preCheckScore}/100</p>
                </div>
                <span className="la-pending">Pending</span>
              </button>
            ))}
            {lots.filter((l) => !l.decided).length === 0 && <div className="la-empty">No Lots awaiting approval.</div>}
          </div>
        )}
        {view === 'queue' && tab === 'sessions' && (
          <div className="la-list">
            {sessions.filter((se) => !se.decided).map((se) => (
              <button key={se.id} onClick={() => { setSelectedId(se.id); setSessionReasonDraft(''); setSessionError(''); setView('sessionDetail'); }} className="la-row la-row--between">
                <div>
                  <p className="la-row__meta">{se.ern} · REQUESTED {se.requestedAt} · {se.marketMaker} ({se.marketMakerMobile})</p>
                  <p className="la-row__title">{se.lotTitle}</p>
                  <p className="la-row__sub">{se.format} · RV {se.reserveValue} · Starts {se.startDate}</p>
                </div>
                <span className="la-pending">Pending</span>
              </button>
            ))}
            {sessions.filter((se) => !se.decided).length === 0 && <div className="la-empty">No Trading Sessions awaiting approval.</div>}
          </div>
        )}

        {view === 'lotDetail' && selectedLot && (
          <>
            <button className="la-back" onClick={() => setView('queue')}>← Back to Queue</button>
            <div className="la-detail-card">
              <p className="la-row__meta">{selectedLot.id} · SUBMITTED {selectedLot.submittedAt}</p>
              <h2 className="la-h2">{selectedLot.title}</h2>
              <p className="la-detail-by">By {selectedLot.marketMaker} · CALL BACK: {selectedLot.marketMakerMobile}</p>
              <div className="la-thumbs">{[1,2,3,4,5].map((t) => <div key={t} className="la-thumb la-thumb--sq" />)}</div>

              {editingLot ? (
                <>
                  <label className="la-label">Title</label>
                  <input className="la-input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                  <div className="la-grid2">
                    <input className="la-input" placeholder="Category" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
                    <input className="la-input" placeholder="Condition" value={editForm.condition} onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })} />
                  </div>
                  <textarea className="la-textarea" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                  <div className="la-btn-row">
                    <button className="la-btn-dark" onClick={saveLotEdit}>Save Edit</button>
                    <button className="la-btn-outline" onClick={() => setEditingLot(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="la-desc">{selectedLot.description}</p>
                  <div className="la-facts">
                    <span><strong>Category:</strong> {selectedLot.category}</span>
                    <span><strong>Condition:</strong> {selectedLot.condition}</span>
                    <span><strong>AI Pre-Check:</strong> {selectedLot.preCheckScore}/100</span>
                  </div>
                  {selectedLot.wasEdited && <p className="la-edited-note">Edited by {TSX_MASTER.name} ({TSX_MASTER.mobile}) · {selectedLot.editedAt}</p>}
                  {!selectedLot.decided && <button className="la-edit-btn" onClick={() => { setEditingLot(true); setEditForm({ title: selectedLot.title, category: selectedLot.category, condition: selectedLot.condition, description: selectedLot.description }); }}>✎ Edit Lot Directly</button>}
                </>
              )}
            </div>

            {selectedLot.decided ? (
              <div className="la-decided">
                <p className="la-decided__meta">DECIDED {selectedLot.decision.at} BY {TSX_MASTER.name} ({TSX_MASTER.mobile})</p>
                <p className="la-decided__label">{selectedLot.decision.label}</p>
                {selectedLot.decision.reason && <p className="la-decided__reason">{selectedLot.decision.reason}</p>}
              </div>
            ) : (
              <>
                <textarea className="la-textarea" placeholder="Reason (required if requesting changes or rejecting)" rows={3} value={lotReasonDraft} onChange={(e) => { setLotReasonDraft(e.target.value); setLotError(''); }} />
                {lotError && <p className="la-error">{lotError}</p>}
                <div className="la-btn-row la-btn-row--wrap">
                  <button className="la-btn-dark" onClick={() => decideLot('Approved — Live on TradeSphereX', lotReasonDraft)}>Approve — Go Live</button>
                  <button className="la-btn-warn" onClick={() => { if (!lotReasonDraft.trim()) { setLotError('State what needs to change.'); return; } decideLot('Sent Back to Market Maker', lotReasonDraft); }}>Send Back to Market Maker</button>
                  <button className="la-btn-danger" onClick={() => { if (!lotReasonDraft.trim()) { setLotError('State a reason for rejection.'); return; } decideLot('Rejected', lotReasonDraft); }}>Reject</button>
                </div>
              </>
            )}
          </>
        )}

        {view === 'sessionDetail' && selectedSession && (
          <>
            <button className="la-back" onClick={() => setView('queue')}>← Back to Queue</button>
            <div className="la-detail-card">
              <p className="la-row__meta">{selectedSession.ern} · REQUESTED {selectedSession.requestedAt}</p>
              <h2 className="la-h2">{selectedSession.lotTitle}</h2>
              <p className="la-detail-by">By {selectedSession.marketMaker} · CALL BACK: {selectedSession.marketMakerMobile}</p>
              <div className="la-facts">
                <span><strong>Format:</strong> {selectedSession.format}</span>
                <span><strong>Reserve Value:</strong> {selectedSession.reserveValue}</span>
                <span><strong>Proposed Start:</strong> {selectedSession.startDate}</span>
              </div>
            </div>
            {selectedSession.decided ? (
              <div className="la-decided">
                <p className="la-decided__meta">DECIDED {selectedSession.decision.at} BY {TSX_MASTER.name} ({TSX_MASTER.mobile})</p>
                <p className="la-decided__label">{selectedSession.decision.label}</p>
                {selectedSession.decision.reason && <p className="la-decided__reason">{selectedSession.decision.reason}</p>}
              </div>
            ) : (
              <>
                <textarea className="la-textarea" placeholder="Reason (required if rejecting)" rows={3} value={sessionReasonDraft} onChange={(e) => { setSessionReasonDraft(e.target.value); setSessionError(''); }} />
                {sessionError && <p className="la-error">{sessionError}</p>}
                <div className="la-btn-row">
                  <button className="la-btn-dark" onClick={() => decideSession('Approved — Trading Session Starting', sessionReasonDraft)}>Approve — Start Session</button>
                  <button className="la-btn-danger" onClick={() => { if (!sessionReasonDraft.trim()) { setSessionError('State a reason for rejection.'); return; } decideSession('Rejected', sessionReasonDraft); }}>Reject</button>
                </div>
              </>
            )}
          </>
        )}
      </main>
      <footer className="la-footer"><p>Approved Lots and Trading Sessions go live immediately on this TradeSphereX. Every approval, rejection, and edit here is recorded in the <Link to="/audit-ledger">Audit Ledger</Link>.</p></footer>
    </div>
  );
}
