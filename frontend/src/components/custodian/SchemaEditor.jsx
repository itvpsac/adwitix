import { useEffect, useRef } from 'react';

// Form editor for a legal/help document (D-137), driven by the schema the
// server sends (LegalDocumentService::SCHEMAS): text, html (simple
// formatting), bool, int, path, slug, list (of objects) and listOf (of
// text). The server sanitises everything again on save.
const LABELS = {
  eyebrow: 'Small heading above the title', title: 'Title', meta: 'Line under the title (company, effective date, contact)',
  intro: 'Introduction', sections: 'Sections', body: 'Text', footer: 'Footer note', toc: 'Show a contents list beside the text',
  maxWidth: 'Page width (px)', backTo: 'Back link goes to', desc: 'Page description', categories: 'Categories', label: 'Label',
  items: 'Questions', code: 'Code', q: 'Question', buyer: 'Answer for Traders', seller: 'Answer for Market Makers', terms: 'Terms',
  term: 'Term', def: 'Definition', related: 'See also (one per line)', chip: 'Short label (jump links)', rows: 'Rows', do: 'Do',
  dont: "Don't", badges: 'Badges (one per line)', pillars: 'Pillars', emoji: 'Icon (emoji)', points: 'Points (one per line)', id: 'Anchor id',
};
const LONG_TEXT = new Set(['desc', 'def', 'buyer', 'seller', 'intro', 'q', 'do', 'dont']);
const label = (k) => LABELS[k] || k;
const itemTitle = (item) => item.title || item.label || item.term || item.q || item.do || item.code || '';

function blankFor(schema) {
  const o = {};
  Object.entries(schema).forEach(([k, t]) => {
    if (t && typeof t === 'object') o[k] = [];
    else o[k] = t === 'bool' ? false : t === 'int' ? 760 : '';
  });
  return o;
}

export function RichText({ value, onChange, ariaLabel }) {
  const ref = useRef(null);
  // Only push the value into the box when it changes from outside (a
  // restore, a new draft) — never while typing, which would move the caret.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) ref.current.innerHTML = value || '';
  }, [value]);
  const cmd = (name, arg) => {
    ref.current?.focus();
    document.execCommand(name, false, arg);
    onChange(ref.current.innerHTML);
  };
  const link = () => {
    const url = window.prompt('Link to (e.g. /privacy-policy, https://…, mailto:…)');
    if (url) cmd('createLink', url);
  };
  const tools = [['B', () => cmd('bold'), 'Bold'], ['I', () => cmd('italic'), 'Italic'], ['H', () => cmd('formatBlock', 'h3'), 'Sub-heading'],
    ['¶', () => cmd('formatBlock', 'p'), 'Paragraph'], ['• List', () => cmd('insertUnorderedList'), 'Bulleted list'],
    ['1. List', () => cmd('insertOrderedList'), 'Numbered list'], ['Link', link, 'Link'], ['Clear', () => cmd('removeFormat'), 'Clear formatting']];
  return (
    <div className="se-rich">
      <div className="se-rich__bar" role="toolbar" aria-label="Formatting">
        {tools.map(([t, fn, title]) => <button key={title} type="button" title={title} onMouseDown={(e) => { e.preventDefault(); fn(); }}>{t}</button>)}
      </div>
      <div ref={ref} className="se-rich__area legal-body" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={ariaLabel}
        onInput={() => onChange(ref.current.innerHTML)} />
    </div>
  );
}

function Field({ name, type, value, onChange }) {
  if (type && typeof type === 'object' && type.list) return <ListField name={name} schema={type.list} value={value || []} onChange={onChange} />;
  if (type && typeof type === 'object' && type.listOf) {
    return (
      <label className="dq-field">{label(name)}
        <textarea rows={Math.min(10, Math.max(3, (value || []).length + 1))} value={(value || []).join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} />
      </label>
    );
  }
  if (type === 'html') return <div className="dq-field">{label(name)}<RichText value={value} onChange={onChange} ariaLabel={label(name)} /></div>;
  if (type === 'bool') return <label className="se-check"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {label(name)}</label>;
  if (type === 'int') return <label className="dq-field">{label(name)}<input type="number" min="480" max="1400" step="20" value={value ?? 760} onChange={(e) => onChange(Number(e.target.value))} /></label>;
  if (LONG_TEXT.has(name)) return <label className="dq-field">{label(name)}<textarea rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>;
  return <label className="dq-field">{label(name)}<input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>;
}

function ListField({ name, schema, value, onChange }) {
  const set = (i, item) => onChange(value.map((x, j) => (j === i ? item : x)));
  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <fieldset className="se-list">
      <legend>{label(name)} <span className="cc-lbl">{value.length}</span></legend>
      {value.map((item, i) => (
        <details key={i} className="se-item" open={value.length <= 3}>
          <summary>
            <span className="se-item__n">{i + 1}</span>
            <span className="se-item__t">{itemTitle(item) || <em>Untitled</em>}</span>
            <span className="se-item__acts" onClick={(e) => e.preventDefault()}>
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
              <button type="button" onClick={() => { if (window.confirm('Remove this item?')) onChange(value.filter((_, j) => j !== i)); }} aria-label="Remove">✕</button>
            </span>
          </summary>
          <div className="se-item__body">
            <ObjectFields schema={schema} value={item} onChange={(v) => set(i, v)} />
          </div>
        </details>
      ))}
      <button type="button" className="cc-btn" onClick={() => onChange([...value, blankFor(schema)])}>+ Add {label(name).toLowerCase().replace(/s$/, '').replace(/ \(.*\)$/, '')}</button>
    </fieldset>
  );
}

function ObjectFields({ schema, value, onChange }) {
  return Object.entries(schema).map(([k, t]) => (
    <Field key={k} name={k} type={t} value={value?.[k]} onChange={(v) => onChange({ ...value, [k]: v })} />
  ));
}

export default function SchemaEditor({ schema, value, onChange }) {
  return <div className="se">{schema ? <ObjectFields schema={schema} value={value || {}} onChange={onChange} /> : null}</div>;
}
