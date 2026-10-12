import { useEffect, useMemo, useRef, useState } from 'react';
import './SearchableSelect.css';

// Single-select combobox: type-to-filter, grouped options with sticky
// group headers. Used for CAT/SUBCAT/MICROCAT — each of which has too
// many options (up to ~150) for a plain <select> to stay usable.
export default function SearchableSelect({ options, value, onChange, placeholder = 'Select…', disabled = false, clearable = true, emptyMessage = 'No matches' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const selected = useMemo(() => options.find((o) => o.id === value) || null, [options, value]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || (o.code || '').toLowerCase().includes(q));
  }, [options, query]);

  const grouped = useMemo(() => {
    const out = [];
    let bucket = null;
    for (const opt of filtered) {
      if (!bucket || opt.group !== bucket.group) {
        bucket = { group: opt.group, items: [] };
        out.push(bucket);
      }
      bucket.items.push(opt);
    }
    return out;
  }, [filtered]);

  const pick = (opt) => {
    onChange(opt ? opt.id : null);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`ssel-root${disabled ? ' ssel-root--disabled' : ''}`}>
      <button type="button" className="ssel-control" disabled={disabled} onClick={() => { if (!disabled) { setOpen((o) => !o); setTimeout(() => inputRef.current && inputRef.current.focus(), 0); } }}>
        <span className={`ssel-control__value${selected ? '' : ' ssel-control__value--placeholder'}`}>
          {selected ? (selected.code ? `${selected.code} — ${selected.label}` : selected.label) : placeholder}
        </span>
        <span className="ssel-control__icons">
          {clearable && selected && !disabled && (
            <span className="ssel-clear" onClick={(e) => { e.stopPropagation(); pick(null); }} title="Clear">×</span>
          )}
          <span className="ssel-caret">{open ? '▲' : '▼'}</span>
        </span>
      </button>

      {open && !disabled && (
        <div className="ssel-panel">
          <input
            ref={inputRef}
            className="ssel-search"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
          />
          <div className="ssel-list">
            {grouped.length === 0 && <div className="ssel-empty">{emptyMessage}</div>}
            {grouped.map((bucket) => (
              <div key={bucket.group || '__flat__'}>
                {bucket.group && <div className="ssel-group-header">{bucket.group}</div>}
                {bucket.items.map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    className={`ssel-option${opt.id === value ? ' ssel-option--active' : ''}`}
                    onClick={() => pick(opt)}
                  >
                    {opt.code && <span className="ssel-option__code">{opt.code}</span>}
                    <span className="ssel-option__label">{opt.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
