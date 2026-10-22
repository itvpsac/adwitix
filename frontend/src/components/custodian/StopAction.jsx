import { useState } from 'react';
import { unwrap } from '../../api/client.js';

// Custodian "Stop" for a Lot or Trading Session (D-132). The Custodian
// never approves — that's the TSX Master's — but can stop anything live,
// with a reason that goes into the audit trail.
export default function StopAction({ label = 'Stop', what, onStop, onDone }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!reason.trim()) { setError('A reason is required.'); return; }
    setBusy(true); setError('');
    try {
      const res = unwrap(await onStop(reason.trim())) || {};
      setOpen(false); setReason('');
      onDone && onDone(res);
    } catch (e) {
      setError(e.description || e.message || 'Could not stop it.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={btn('#F0C9BE', 'var(--color-danger-bg)', 'var(--color-danger)')}>{label}</button>
    );
  }
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget && !busy) setOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(30,34,51,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <div role="dialog" aria-modal="true" aria-label={`Stop ${what}`} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 20, width: '100%', maxWidth: 420, boxSizing: 'border-box', background: '#fff', borderRadius: 14, boxShadow: '0 20px 50px rgba(30,34,51,.25)' }}>
      <b style={{ font: '700 16px var(--font-sans)' }}>Stop {what}?</b>
      <span style={{ font: '500 13px/1.5 var(--font-sans)', color: 'var(--color-text-muted)' }}>Any live bids are withdrawn and deposits released. The reason is shown to the seller and recorded in the Audit Ledger.</span>
      <textarea rows={3} autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" style={{ font: '500 13.5px var(--font-sans)', padding: 10, borderRadius: 8, border: '1px solid var(--color-border)', resize: 'vertical' }} />
      {error && <span style={{ color: 'var(--color-danger)', font: '600 11.5px var(--font-sans)' }}>{error}</span>}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => { setOpen(false); setError(''); }} disabled={busy} style={btn('var(--color-border)', '#fff', 'var(--color-text)')}>Cancel</button>
        <button type="button" onClick={submit} disabled={busy} style={btn('var(--color-danger)', 'var(--color-danger)', '#fff')}>{busy ? 'Stopping…' : 'Stop'}</button>
      </div>
    </div>
    </div>
  );
}

const btn = (border, bg, color) => ({ height: 30, padding: '0 12px', borderRadius: 100, border: `1px solid ${border}`, background: bg, color, font: '600 12px var(--font-sans)', cursor: 'pointer' });
