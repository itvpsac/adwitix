import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppHeader from '../../components/AppHeader.jsx';
import { listings, objections } from '../../api/endpoints.js';
import { unwrap, mediaUrl } from '../../api/client.js';
import { CATEGORIES } from '../../data/classification.js';
import './FixLot.css';

// D-140: the seller corrects a Lot the Custodian put on hold — what is
// wrong, what to do, the Lot's details and media, and "Submit the fix".
// The Lot stays on hold (no deadline) until the Custodian lifts it; then
// the TSX Master approves it again.
const FIELDS = [
  ['title', 'Title'], ['make_model', 'Make / model'], ['physical_condition', 'Condition'], ['quantity', 'Quantity'],
  ['subcategory', 'Subcategory'], ['micro_category', 'Type'],
  ['yard_location_address', 'Yard address'], ['city', 'City'], ['state', 'State'], ['yard_location_pin', 'PIN code'],
];
const errText = (e, f) => e.description || e.message || f;

export default function FixLot() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const fileRef = useRef(null);

  const load = useCallback(() => {
    listings.show(id).then((r) => {
      const d = unwrap(r) || {};
      setData(d);
      const l = d.listing || {};
      setForm(Object.fromEntries([...FIELDS.map(([k]) => [k, l[k] ?? '']), ['category', l.category || ''], ['description', l.description || '']]));
    }).catch((e) => setError(errText(e, 'Could not load this Lot.')));
  }, [id]);
  useEffect(() => { if (id) load(); }, [id, load]);

  const run = async (fn, ok) => {
    setBusy(true); setError(''); setNotice('');
    try { await fn(); setNotice(ok); load(); } catch (e) { setError(errText(e, 'That did not go through.')); } finally { setBusy(false); }
  };

  if (!id) return <Shell><p className="fl-muted">No Lot selected.</p></Shell>;
  if (error && !data) return <Shell><p className="fl-err">{error}</p></Shell>;
  if (!data || !form) return <Shell><p className="fl-muted">Loading…</p></Shell>;

  const l = data.listing;
  const o = data.objection;
  if (!data.isOwner) return <Shell><p className="fl-err">Only this Lot&apos;s seller can correct it.</p></Shell>;
  if (!o || !o.id) {
    return (
      <Shell>
        <h1 className="fl-h1">{l.title || l.category}</h1>
        <p className="fl-ok">This Lot is not on hold. {l.status === 'pending_approval' ? 'It is waiting for your TSX Master\'s approval.' : ''}</p>
        <Link to={`/lot-detail?id=${l.id}`} className="fl-link">Open the Lot →</Link>
      </Shell>
    );
  }
  const inReview = o.status === 'fix_submitted';
  const changed = Object.keys(form).filter((k) => String(form[k] ?? '') !== String(l[k] ?? ''));
  const media = data.media || [];
  const cats = CATEGORIES.some((c) => c.apiValue === l.category) ? CATEGORIES : [{ id: 'current', label: l.category, apiValue: l.category }, ...CATEGORIES];

  const upload = (files) => {
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append(f.type.startsWith('video/') ? 'videos[]' : f.type === 'application/pdf' ? 'documents[]' : 'photos[]', f, f.name));
    run(() => listings.uploadMedia(l.id, fd), `${files.length} file${files.length === 1 ? '' : 's'} added — photos appear once processed.`);
  };

  return (
    <Shell>
      <p className="fl-muted" style={{ margin: 0 }}><Link to={`/lot-detail?id=${l.id}`} className="fl-link">{l.title || l.category}</Link> / Fix this Lot</p>
      <h1 className="fl-h1">Fix your Lot</h1>

      <section className={`fl-card fl-card--${inReview ? 'info' : 'warn'}`}>
        <span className="fl-tag">{inReview ? 'With the Custodian for review' : 'On hold — not for sale'}</span>
        <h2 className="fl-h2">{o.reason_label}</h2>
        <p className="fl-pre">{o.note}</p>
        {o.review_note && !inReview && <div className="fl-returned"><b>The Custodian sent your fix back:</b><p className="fl-pre">{o.review_note}</p></div>}
        <p><b>What to do:</b> {o.what_to_fix}</p>
        <p className="fl-muted">There is no deadline — the Lot stays on hold, and cannot be approved, scheduled or sold, until it is corrected. After the Custodian lifts the hold, your TSX Master approves it again.</p>
        {o.cbs_offense_number ? <p className="fl-muted">Recorded as a Certified-by-Seller photo violation (offence #{o.cbs_offense_number}).</p> : null}
      </section>

      {notice && <p className="fl-ok" role="status">{notice}</p>}
      {error && <p className="fl-err" role="alert">{error}</p>}

      <fieldset className="fl-card" disabled={inReview || busy}>
        <legend className="fl-h2">Details</legend>
        <label className="fl-field">Description
          <textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is it, its make and model, condition, what is included…" />
        </label>
        <div className="fl-grid">
          <label className="fl-field">Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{cats.map((c) => <option key={c.id} value={c.apiValue}>{c.label}</option>)}</select>
          </label>
          {FIELDS.map(([k, t]) => (
            <label key={k} className="fl-field">{t}<input type="text" value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>
          ))}
        </div>
        <button type="button" className="fl-btn" disabled={!changed.length} onClick={() => run(() => objections.correct(l.id, Object.fromEntries(changed.map((k) => [k, form[k]]))), 'Changes saved.')}>Save changes</button>
      </fieldset>

      <fieldset className="fl-card" disabled={inReview || busy}>
        <legend className="fl-h2">Photos, video &amp; documents <span className="fl-muted">{media.filter((m) => m.media_type === 'photo').length} photos</span></legend>
        <p className="fl-muted" style={{ margin: 0 }}>Only genuine photos of this actual item — no stock, catalogue or generated images. At least 5 photos, one marked as the main photo.</p>
        <div className="fl-media">
          {media.map((m) => (
            <div key={m.id} className={`fl-thumb${Number(m.is_primary) ? ' fl-thumb--main' : ''}`}>
              {m.media_type === 'photo' ? <img src={mediaUrl(m.file_path)} alt={m.original_filename || 'Lot photo'} loading="lazy" /> : <span>{m.media_type}: {m.original_filename}</span>}
              <div className="fl-thumb__acts">
                {m.media_type === 'photo' && !Number(m.is_primary) && <button type="button" onClick={() => run(() => listings.setPrimaryMedia(l.id, m.id), 'Main photo set.')}>Make main</button>}
                {Number(m.is_primary) ? <em>Main photo</em> : null}
                <button type="button" className="fl-del" onClick={() => { if (window.confirm('Remove this from the Lot?')) run(() => objections.removeMedia(l.id, m.id), 'Removed.'); }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        {(data.queuedMediaJobs || []).length > 0 && <p className="fl-muted">{data.queuedMediaJobs.length} upload{data.queuedMediaJobs.length === 1 ? '' : 's'} still processing.</p>}
        <input ref={fileRef} type="file" multiple hidden accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,application/pdf" onChange={(e) => { upload(Array.from(e.target.files)); e.target.value = ''; }} />
        <button type="button" className="fl-btn fl-btn--ghost" onClick={() => fileRef.current?.click()}>Add photos or files</button>
      </fieldset>

      <section className="fl-card">
        <h2 className="fl-h2">{inReview ? 'Your fix' : 'Submit the fix'}</h2>
        {inReview ? (
          <>
            <p className="fl-pre">{o.fix_note}</p>
            <p className="fl-muted">The Custodian is checking it. You&apos;ll see the result here — if they send it back, you can change the Lot again.</p>
          </>
        ) : (
          <>
            <label className="fl-field">Tell the Custodian what you changed
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Removed the two catalogue photos and added 6 photos of the actual machine." />
            </label>
            <button type="button" className="fl-btn fl-btn--go" disabled={busy || !note.trim() || changed.length > 0} title={changed.length ? 'Save your changes first' : ''}
              onClick={() => run(() => objections.submitFix(o.id, note.trim()), 'Sent to the Custodian. The Lot stays on hold until they lift it.')}>Submit the fix</button>
            {changed.length > 0 && <p className="fl-muted">Save your changes to the details first.</p>}
          </>
        )}
      </section>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="fl-page">
      <AppHeader variant="light" />
      <main className="fl-main">{children}</main>
    </div>
  );
}
