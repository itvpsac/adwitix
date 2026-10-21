import { useState } from 'react';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { pushLedger } from '../../utils/auditLedger.js';
import { admin } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import '../compliance/CustodianShared.css';
import './RulesAndSpecifications.css';

const stamp = (v) => (v || '').slice(0, 16).replace('T', ' ');
const EMPTY = { title: '', statement: '', logic: '', reason: '' };

export default function RulesAndSpecifications() {
  const [showInfo, setShowInfo] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  // GET /admin/rules → { rules: [sovereign_rule] }; every edit is versioned
  // server side and needs a Reason for Modification.
  const { data, loading, error: loadError, reload } = useApiQuery(() => admin.rules(), []);
  const rules = (data && data.rules) || [];

  const startEdit = (rule) => {
    setEditingId(rule ? rule.id : 'new');
    setDraft(rule ? { title: rule.title, statement: rule.statement, logic: rule.logic, numeric_value: rule.numeric_value, reason: '' } : EMPTY);
    setActionError('');
  };
  const ready = draft.title.trim() && draft.statement.trim() && draft.reason.trim();
  const save = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setActionError('');
    const payload = { title: draft.title, statement: draft.statement, logic: draft.logic, reason_for_modification: draft.reason };
    try {
      if (editingId === 'new') {
        await admin.createRule(payload);
      } else {
        await admin.editRule(editingId, { ...payload, numeric_value: draft.numeric_value });
      }
      pushLedger(editingId === 'new' ? 'Created Sovereign Rule' : 'Edited Rules & Specifications', draft.title, draft.reason);
      setEditingId(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Could not save the rule.');
    } finally {
      setBusy(false);
    }
  };

  const editor = (
    <>
      <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" className="rs-textarea" />
      <textarea value={draft.statement} onChange={(e) => setDraft({ ...draft, statement: e.target.value })} placeholder="Statement" rows={4} className="rs-textarea" />
      <textarea value={draft.logic} onChange={(e) => setDraft({ ...draft, logic: e.target.value })} placeholder="Logic" rows={3} className="rs-textarea" />
      {editingId !== 'new' && draft.numeric_value != null && (
        <input type="number" value={draft.numeric_value} onChange={(e) => setDraft({ ...draft, numeric_value: e.target.value })} placeholder="Numeric value" className="rs-textarea" />
      )}
      <textarea value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} placeholder="Reason for modification (required)" rows={2} className="rs-textarea" />
      {actionError && <div className="rs-section__log" style={{ color: 'var(--color-danger)' }}>{actionError}</div>}
      <div className="custodian-btn-row">
        <button onClick={save} disabled={!ready || busy} className="rs-save-btn" style={{ opacity: ready && !busy ? 1 : 0.5 }}>{busy ? 'Saving…' : 'Save Change'}</button>
        <button onClick={() => setEditingId(null)} className="custodian-btn-outline">Cancel</button>
      </div>
    </>
  );

  return (
    <ConsoleFrame header={<DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Rules & Specifications', to: '/rules-and-specifications', active: true }]} />}>
    <div className="custodian-page">
      <main className="custodian-main">
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">Rules &amp; Specifications</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="custodian-info-btn">i</button>
        </div>
        <p className="custodian-sub">Platform-wide governing values — Trading Session formats, cooling-off periods, and rating point values. Changes apply platform-wide and are recorded to the Audit Ledger.</p>
        {showInfo && (
          <div className="custodian-info-box">
            <strong>Why this screen exists:</strong> These are the platform's governing values — fee schedules, Trading Session formats, cooling-off periods, and rating point values. Changes here apply platform-wide and are recorded to the Audit Ledger.
            <button onClick={() => setShowInfo(false)} className="custodian-info-close">Close</button>
          </div>
        )}

        <div className="custodian-btn-row" style={{ marginBottom: 16 }}>
          {editingId !== 'new' && <button onClick={() => startEdit(null)} className="rs-edit-btn">+ New Rule</button>}
        </div>
        {editingId === 'new' && <div className="rs-section">{editor}</div>}

        <div className="rs-list">
          {rules.map((rule) => {
            const editing = editingId === rule.id;
            return (
              <div key={rule.id} className="rs-section">
                <div className="rs-section__head">
                  <div>
                    <div className="rs-section__title">{rule.title}</div>
                    <div className="rs-section__log">v{rule.version} · last changed {stamp(rule.updated_at)}{rule.rule_key ? ` · ${rule.rule_key}` : ''}</div>
                  </div>
                  {!editing && <button onClick={() => startEdit(rule)} className="rs-edit-btn">Edit</button>}
                </div>
                {!editing && (
                  <div className="rs-value">
                    {rule.statement}
                    {rule.numeric_value != null && <div><strong>Value:</strong> {rule.numeric_value}</div>}
                    {rule.logic && <div style={{ marginTop: 6 }}><strong>Logic:</strong> {rule.logic}</div>}
                  </div>
                )}
                {editing && editor}
              </div>
            );
          })}
        </div>
        {loading && <div className="custodian-empty">Loading rules…</div>}
        {loadError && <div className="custodian-empty" style={{ color: 'var(--color-danger)' }}>Could not load rules — {loadError.message || 'the service is not reachable'}.</div>}
        {!loading && !loadError && rules.length === 0 && <div className="custodian-empty">No rules on record.</div>}
      </main>
    </div>
    </ConsoleFrame>
  );
}
