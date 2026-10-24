import { useState } from 'react';
import './UserFormModal.css';
import { unwrap } from '../../api/client.js';

// Custodian: add a user, or correct an existing user's details. Adding
// creates the account the way registration does (Trader, KYC pending); the
// person signs in with an OTP to that mobile and accepts the Terms
// themselves. A correction needs a reason and is written to the Audit Ledger.
const FIELDS = {
  full_name: { label: 'Full name', required: true },
  mobile_number: { label: 'Mobile number', required: true, type: 'tel', placeholder: '10-digit mobile' },
  recovery_email: { label: 'Email', type: 'email' },
  date_of_birth: { label: 'Date of birth', type: 'date' },
  occupation: { label: 'Occupation' },
  pan: { label: 'PAN', placeholder: 'ABCDE1234F' },
  org_gstin: { label: 'GSTIN', placeholder: '27ABCDE1234F1Z5' },
};
const CREATE = ['full_name', 'mobile_number', 'recovery_email'];
const EDIT = ['full_name', 'mobile_number', 'recovery_email', 'date_of_birth', 'occupation', 'pan', 'org_gstin'];
const IDENTITY = new Set(['full_name', 'date_of_birth', 'pan', 'org_gstin']);

export default function UserFormModal({ party, onSubmit, onClose, onDone }) {
  const editing = !!party;
  const keys = editing ? EDIT.filter((k) => k !== 'org_gstin' || party.entity_type === 'organization' || party.org_gstin) : CREATE;
  const initial = Object.fromEntries(keys.map((k) => [k, (party && party[k]) ? String(party[k]).slice(0, k === 'date_of_birth' ? 10 : undefined) : '']));
  const [form, setForm] = useState({ ...initial, entity_type: 'individual', reason: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const changed = keys.filter((k) => form[k] !== initial[k]);
  const identityChanged = editing && party.kyc_status === 'verified' && changed.some((k) => IDENTITY.has(k));

  const submit = async (e) => {
    e.preventDefault();
    if (editing && !changed.length) { setError('Nothing was changed.'); return; }
    if (editing && !form.reason.trim()) { setError('Give a reason for the correction.'); return; }
    setBusy(true); setError('');
    try {
      const payload = editing
        ? { ...Object.fromEntries(changed.map((k) => [k, form[k]])), reason: form.reason.trim() }
        : { ...Object.fromEntries(keys.map((k) => [k, form[k]])), entity_type: form.entity_type };
      const res = unwrap(await onSubmit(payload)) || {};
      onDone(res);
    } catch (err) {
      setError(err.description || err.message || 'That did not go through.');
      setBusy(false);
    }
  };

  return (
    <div className="ufm-back" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <form className="ufm" role="dialog" aria-modal="true" aria-label={editing ? 'Edit details' : 'Add user'} onSubmit={submit}>
        <b className="ufm__title">{editing ? `Edit ${party.full_name || party.mobile_number}` : 'Add a user'}</b>
        {!editing && <span className="ufm__note">They join as a Trader with KYC pending. They sign in with an OTP sent to this mobile, accept the Terms and Privacy Policy, and complete KYC themselves.</span>}
        {!editing && (
          <div className="ufm__seg" role="radiogroup" aria-label="Type">
            {[['individual', 'Individual'], ['organization', 'Business']].map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={form.entity_type === v} className={form.entity_type === v ? 'on' : ''} onClick={() => setForm({ ...form, entity_type: v })}>{l}</button>
            ))}
          </div>
        )}
        <div className="ufm__grid">
          {keys.map((k) => (
            <label key={k} className="ufm__field">{FIELDS[k].label}{FIELDS[k].required && ' *'}
              <input type={FIELDS[k].type || 'text'} value={form[k]} placeholder={FIELDS[k].placeholder} autoFocus={k === keys[0]}
                onChange={(e) => { setError(''); setForm({ ...form, [k]: e.target.value }); }} />
            </label>
          ))}
        </div>
        {editing && changed.includes('mobile_number') && <span className="ufm__warn">The new number must be verified by OTP at their next sign-in. They sign in with the new number from now on.</span>}
        {identityChanged && <span className="ufm__warn">KYC verified these details against their documents. The correction is flagged in the Audit Ledger — check the documents support it.</span>}
        {editing && (
          <label className="ufm__field">Reason for the correction *
            <textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </label>
        )}
        {error && <span className="ufm__err" role="alert">{error}</span>}
        <div className="ufm__acts">
          <button type="button" className="ufm__btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="ufm__btn ufm__btn--go" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save correction' : 'Add user'}</button>
        </div>
      </form>
    </div>
  );
}
