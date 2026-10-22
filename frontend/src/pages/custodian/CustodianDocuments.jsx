import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CustodianShell from '../../components/custodian/CustodianShell.jsx';
import SchemaEditor from '../../components/custodian/SchemaEditor.jsx';
import { admin } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { PreviewContent } from '../../utils/publishedContent.js';
import { diffContent } from '../../utils/contentDiff.js';
import './CustodianDocuments.css';

// The Custodian's Documents page (D-137): every published legal and help
// document — check it, edit a draft, preview it as the public will see it,
// publish, and keep every earlier version (compare, restore). A material
// change to the Terms of Usage or Privacy Policy makes every user accept
// the new version again (BR-51(d)).
const PAGES = {
  'terms-of-usage': lazy(() => import('../legal/TermsOfUsage.jsx')),
  'privacy-policy': lazy(() => import('../legal/PrivacyPolicy.jsx')),
  'cookie-policy': lazy(() => import('../legal/CookiePolicy.jsx')),
  'refund-and-cancellation-policy': lazy(() => import('../legal/RefundAndCancellationPolicy.jsx')),
  'grievance-redressal-policy': lazy(() => import('../legal/GrievanceRedressalPolicy.jsx')),
  'dispute-resolution-process': lazy(() => import('../legal/DisputeResolutionProcess.jsx')),
  'terms-and-privacy': lazy(() => import('../legal/TermsAndPrivacy.jsx')),
  faq: lazy(() => import('../legal/FAQ.jsx')),
  terminology: lazy(() => import('../legal/Terminology.jsx')),
  'dos-and-donts': lazy(() => import('../legal/DosAndDonts.jsx')),
  'security-and-trust': lazy(() => import('../legal/SecurityAndTrust.jsx')),
};
const day = (v) => (v ? String(v).slice(0, 10) : '—');
const errText = (e, fallback) => e.description || e.message || fallback;

export default function CustodianDocuments() {
  const [params] = useSearchParams();
  const slug = params.get('slug');
  return <CustodianShell>{slug ? <DocumentDetail key={slug} slug={slug} /> : <DocumentList />}</CustodianShell>;
}

function DocumentList() {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { admin.legalList().then((r) => setDocs((unwrap(r) || {}).documents || [])).catch((e) => setError(errText(e, 'Could not load documents.'))); }, []);
  const groups = [['legal', 'Legal'], ['help', 'Help']];
  return (
    <div className="cc-wrap">
      <div className="cc-head">
        <div>
          <h1 className="cc-h1">Documents</h1>
          <p className="cc-sub">The legal and help pages the public sees. Edit a draft, preview it, publish it — every earlier version is kept.</p>
        </div>
      </div>
      {error && <p className="cc-error">{error}</p>}
      {!docs && !error && <p className="cc-lbl">Loading…</p>}
      {docs && groups.map(([cat, title]) => (
        <section key={cat} className="cc-card">
          <div className="cc-card__head"><h2 className="cc-h2">{title}</h2></div>
          <div className="cc-table"><div style={{ minWidth: 760 }}>
            <div className="cc-trow cc-trow--head doc-cols"><span>Document</span><span>Live</span><span>Effective</span><span>Draft</span><span>Checks</span><span>Acceptance</span></div>
            {docs.filter((d) => d.category === cat).map((d) => {
              const warn = d.checks.length;
              return (
                <Link key={d.slug} to={`/custodian/documents?slug=${d.slug}`} className="cc-trow doc-cols">
                  <span><b style={{ fontWeight: 600 }}>{d.title}</b><br /><span className="cc-lbl cc-mono" style={{ fontSize: 11.5 }}>{d.path}</span></span>
                  <span className="cc-mono">v{d.published?.version ?? '—'}</span>
                  <span>{day(d.published?.effective_date)}</span>
                  <span>{d.draft ? <span className="cc-pill cc-pill--warn">v{d.draft.version} draft</span> : <span className="cc-lbl">—</span>}</span>
                  <span>{warn ? <span className="cc-pill cc-pill--warn">{warn} to check</span> : <span className="cc-pill cc-pill--ok">OK</span>}</span>
                  <span>{d.acceptances ? `${d.acceptances.accepted} accepted v${d.acceptances.version}` : <span className="cc-lbl">Not needed</span>}</span>
                </Link>
              );
            })}
          </div></div>
        </section>
      ))}
    </div>
  );
}

function Checks({ checks }) {
  if (!checks || checks.length === 0) return <p className="doc-ok">✓ No problems found.</p>;
  return (
    <ul className="doc-checks">
      {checks.map((c, i) => <li key={i} className={`doc-check doc-check--${c.level}`}><b>{c.level === 'error' ? 'Must fix' : 'Check'}</b> <span className="cc-mono">{c.where}</span> — {c.message}</li>)}
    </ul>
  );
}

function Preview({ slug, content }) {
  const Page = PAGES[slug];
  if (!Page) return <p className="cc-lbl">No preview for this document.</p>;
  return (
    <div className="doc-preview" aria-label="Preview">
      <PreviewContent.Provider value={{ slug, content }}>
        <Suspense fallback={<p className="cc-lbl" style={{ padding: 16 }}>Loading preview…</p>}><Page /></Suspense>
      </PreviewContent.Provider>
    </div>
  );
}

function Diff({ before, after, beforeLabel, afterLabel }) {
  const rows = useMemo(() => diffContent(before, after), [before, after]);
  if (rows.length === 0) return <p className="doc-ok">No differences.</p>;
  return (
    <div className="cl-table">
      <table className="doc-diff">
        <thead><tr><th>Where</th><th>{beforeLabel}</th><th>{afterLabel}</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.path} className={`doc-diff--${r.change}`}>
              <td className="cc-mono">{r.path}</td><td>{r.before || <em>—</em>}</td><td>{r.after || <em>—</em>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocumentDetail({ slug }) {
  const [d, setD] = useState(null);
  const [tab, setTab] = useState('edit');
  const [form, setForm] = useState(null);
  const [meta, setMeta] = useState({ effective_date: '', change_note: '', material: false });
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);

  const load = useCallback(() => {
    admin.legalDoc(slug).then((r) => {
      const x = unwrap(r) || {};
      setD(x);
      const src = x.draft || x.published;
      setForm(src ? src.content : {});
      setMeta({ effective_date: x.draft?.effective_date || '', change_note: x.draft?.change_note || '', material: !!x.draft?.material });
      setDirty(false);
    }).catch((e) => setError(errText(e, 'Could not load this document.')));
  }, [slug]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, done, then) => {
    setBusy(true); setError(''); setNote('');
    try {
      const res = unwrap(await fn()) || {};
      setNote(res.message || done);
      if (then) then(res); else load();
    } catch (e) {
      setError(errText(e, 'That did not go through.'));
    } finally {
      setBusy(false);
    }
  };
  const save = () => act(() => admin.legalSaveDraft(slug, { content: form, ...meta }), 'Draft saved.');
  const publish = async () => {
    const consent = d.document.requires_consent && meta.material;
    const msg = consent
      ? `Publish this as a MATERIAL change? Every user will have to accept the new ${d.document.title} before bidding or selling again.`
      : `Publish this version of ${d.document.title}? It replaces the live page now.`;
    if (!window.confirm(msg)) return;
    if (dirty) {
      setBusy(true);
      try { await admin.legalSaveDraft(slug, { content: form, ...meta }); } catch (e) { setError(errText(e, 'Could not save the draft.')); setBusy(false); return; }
      setBusy(false);
    }
    act(() => admin.legalPublish(slug), 'Published.');
  };
  const discard = () => { if (window.confirm('Discard this draft? The live page is not affected.')) act(() => admin.legalDiscard(slug), 'Draft discarded.'); };
  const restore = (n) => { if (window.confirm(`Copy version ${n} into a new draft? The live page stays as it is until you publish.`)) act(() => admin.legalRestore(slug, n), 'Restored into a draft.', () => { load(); setTab('edit'); }); };
  const view = (n) => admin.legalVersion(slug, n).then((r) => setViewing((unwrap(r) || {}).version)).catch((e) => setError(errText(e, 'Could not load that version.')));

  if (error && !d) return <p className="cc-error">{error}</p>;
  if (!d || !form) return <p className="cc-lbl">Loading…</p>;
  const doc = d.document;
  const live = d.published;
  const draft = d.draft;
  const change = (v) => { setForm(v); setDirty(true); };

  return (
    <div className="cc-wrap">
      <div className="cc-head">
        <div>
          <p className="cc-lbl" style={{ margin: 0 }}><Link to="/custodian/documents" className="cc-link">Documents</Link> / {doc.title}</p>
          <h1 className="cc-h1" style={{ marginTop: 6 }}>{doc.title}</h1>
          <p className="cc-sub">
            Live: <b>version {live?.version ?? '—'}</b>, effective {day(live?.effective_date)} · <a href={doc.path} target="_blank" rel="noreferrer" className="cc-link">Open live page ↗</a>
            {draft && <> · <span className="cc-pill cc-pill--warn">Draft v{draft.version}</span></>}
            {d.acceptances && <> · {d.acceptances.accepted} users have accepted v{d.acceptances.version}</>}
          </p>
        </div>
        <div className="doc-actions">
          {draft && <button type="button" className="cc-btn" disabled={busy} onClick={discard}>Discard draft</button>}
          <button type="button" className="cc-btn" disabled={busy || !dirty} onClick={save}>{busy ? 'Saving…' : 'Save draft'}</button>
          <button type="button" className="cc-btn cc-btn--gold" disabled={busy || (!draft && !dirty)} onClick={publish}>Publish</button>
        </div>
      </div>
      {note && <p className="dq-notice" role="status" style={{ display: 'block' }}>{note}</p>}
      {error && <p className="cc-error" role="alert">{error}</p>}

      <nav className="cl-tabs" aria-label="Views">
        {[['edit', draft ? `Edit draft v${draft.version}` : 'Edit (starts a draft)'], ['preview', 'Preview'], ['changes', 'Changes vs live'], ['history', `History (${d.versions.filter((v) => v.status !== 'draft').length})`]].map(([k, l]) => (
          <a key={k} href={`#${k}`} onClick={(e) => { e.preventDefault(); setTab(k); }} aria-current={tab === k ? 'page' : undefined} className={tab === k ? 'doc-tab--on' : ''}>{l}</a>
        ))}
      </nav>

      {tab === 'edit' && (
        <div className="cc-split">
          <section className="cc-card cc-card--pad cc-wide">
            <SchemaEditor schema={d.schema} value={form} onChange={change} />
          </section>
          <aside className="cc-narrow" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <section className="cc-card cc-card--pad">
              <h2 className="cc-h2" style={{ fontSize: 16 }}>This version</h2>
              <label className="dq-field">Effective date
                <input type="date" value={meta.effective_date || ''} onChange={(e) => { setMeta({ ...meta, effective_date: e.target.value }); setDirty(true); }} />
              </label>
              <label className="dq-field">What changed (for the history)
                <textarea rows={3} value={meta.change_note || ''} onChange={(e) => { setMeta({ ...meta, change_note: e.target.value }); setDirty(true); }} />
              </label>
              {doc.requires_consent ? (
                <label className="se-check doc-material">
                  <input type="checkbox" checked={!!meta.material} onChange={(e) => { setMeta({ ...meta, material: e.target.checked }); setDirty(true); }} />
                  <span><b>Material change</b> — every user must read and accept this version before bidding, offering, pledging or selling again (BR-51).</span>
                </label>
              ) : <p className="cc-lbl" style={{ margin: 0 }}>Users don&apos;t need to accept this document.</p>}
            </section>
            <section className="cc-card cc-card--pad">
              <h2 className="cc-h2" style={{ fontSize: 16 }}>Checks</h2>
              <p className="cc-lbl" style={{ margin: '4px 0 8px' }}>{dirty ? 'Save the draft to re-check.' : draft ? 'For this draft.' : 'For the live version.'}</p>
              <Checks checks={(draft || live)?.checks} />
            </section>
          </aside>
        </div>
      )}

      {tab === 'preview' && (
        <section className="cc-card cc-card--pad">
          <p className="cc-lbl" style={{ marginTop: 0 }}>{dirty || draft ? 'Your draft, exactly as the public page will show it.' : 'The live version.'}</p>
          <Preview slug={slug} content={form} />
        </section>
      )}

      {tab === 'changes' && (
        <section className="cc-card cc-card--pad">
          <h2 className="cc-h2" style={{ fontSize: 16 }}>{dirty || draft ? 'Your draft compared with the live version' : 'No draft — nothing differs from the live version.'}</h2>
          <Diff before={live?.content} after={form} beforeLabel={`Live v${live?.version ?? ''}`} afterLabel="Draft" />
        </section>
      )}

      {tab === 'history' && (
        <section className="cc-card cc-card--pad">
          <div className="cl-table">
            <table className="doc-diff">
              <thead><tr><th>Version</th><th>Status</th><th>Effective</th><th>Published</th><th>By</th><th>Material</th><th>What changed</th><th /></tr></thead>
              <tbody>
                {d.versions.map((v) => (
                  <tr key={v.id}>
                    <td className="cc-mono">v{v.version}</td>
                    <td><span className={`cc-pill cc-pill--${v.status === 'published' ? 'ok' : v.status === 'draft' ? 'warn' : 'muted'}`}>{v.status}</span></td>
                    <td>{day(v.effective_date)}</td><td>{day(v.published_at)}</td><td>{v.published_by || v.created_by || '—'}</td>
                    <td>{Number(v.material) ? 'Yes' : '—'}</td><td style={{ whiteSpace: 'normal', minWidth: 200 }}>{v.change_note || '—'}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {v.status !== 'draft' && <button type="button" className="cc-btn" onClick={() => view(v.version)}>View</button>}
                      {v.status === 'superseded' && <button type="button" className="cc-btn" disabled={busy} onClick={() => restore(v.version)}>Restore</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {viewing && (
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="cc-head" style={{ alignItems: 'center' }}>
                <h3 className="cc-h2" style={{ fontSize: 16 }}>Version {viewing.version} ({viewing.status})</h3>
                <button type="button" className="cc-btn" onClick={() => setViewing(null)}>Close</button>
              </div>
              <h4 className="cl-h4">Compared with live v{live?.version}</h4>
              <Diff before={viewing.content} after={live?.content} beforeLabel={`v${viewing.version}`} afterLabel={`Live v${live?.version ?? ''}`} />
              <h4 className="cl-h4">As it looked</h4>
              <Preview slug={slug} content={viewing.content} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
