import { useState } from 'react';
import { unwrap } from '../../api/client.js';
import './UserFormModal.css';

// D-140: the Custodian's "Raise objection" on a Lot. The Custodian never
// edits a seller's Lot (BR-15) — it objects with a reason from a fixed list
// and a note; the Lot goes on hold until the seller corrects it.
export default function ObjectionAction({ reasons, lotTitle, sessionsLive, onRaise, onDone }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!reason) { setError('Choose a reason.'); return; }
    if (!note.trim()) { setError('Say what is wrong, so the seller knows what to fix.'); return; }
    setBusy(true); setError('');
    try {
      const res = unwrap(await onRaise({ reason, note: note.trim() })) || {};
      setOpen(false); setReason(''); setNote('');
      onDone && onDone(res);
    } catch (e) {
      setError(e.description || e.message || 'That did not go through.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return <button type="button" className="ob-btn" onClick={() => setOpen(true)}>Raise objection</button>;
  return (
    <div className="ufm-back" onClick={(e) => { if (e.target === e.currentTarget && !busy) setOpen(false); }}>
      <div className="ufm" role="dialog" aria-modal="true" aria-label="Raise an objection">
        <b className="ufm__title">Raise an objection to &ldquo;{lotTitle}&rdquo;</b>
        <span className="ufm__note">
          The Lot goes on hold at once{sessionsLive ? ` and its ${sessionsLive} live Trading Session${sessionsLive > 1 ? 's are' : ' is'} stopped — bids withdrawn, deposits returned` : ''}.
          It stays on hold, with no deadline, until the seller corrects it and you lift the hold; then its TSX Master approves it again. The seller and TSX Master are told, and the seller must acknowledge it.
        </span>
        <label className="ufm__field">Reason
          <select value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }}>
            <option value="">Choose…</option>
            {Object.entries(reasons || {}).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        {reason === 'stock_images' && <span className="ufm__warn">Recorded as a Certified-by-Seller photo violation on the seller&apos;s record (BR-59/BR-61) — unless an active media waiver covers this category on this TradeSphereX.</span>}
        <label className="ufm__field">What is wrong (the seller sees this)
          <textarea rows={4} value={note} onChange={(e) => { setNote(e.target.value); setError(''); }} placeholder="Be specific — e.g. photos 2 and 3 are catalogue images; the description doesn't say whether the engine runs." />
        </label>
        {error && <span className="ufm__err" role="alert">{error}</span>}
        <div className="ufm__acts">
          <button type="button" className="ufm__btn" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
          <button type="button" className="ufm__btn ufm__btn--bad" onClick={submit} disabled={busy}>{busy ? 'Working…' : 'Put Lot on hold'}</button>
        </div>
      </div>
    </div>
  );
}
