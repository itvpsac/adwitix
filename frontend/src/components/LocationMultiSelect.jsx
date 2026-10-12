import { useEffect, useMemo, useRef, useState } from 'react';
import './LocationMultiSelect.css';

// Grouped multi-select for LOC scope: named regions + individual
// states/UTs, all selectable together. Shows chips for the current
// selection and a searchable checklist panel.
export default function LocationMultiSelect({ options, value, onChange, placeholder = 'All India (no restriction)' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
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

  const toggle = (id) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(Array.from(next));
  };
  const removeChip = (id) => onChange(value.filter((v) => v !== id));
  const clearAll = (e) => { e.stopPropagation(); onChange([]); };

  const selectedOptions = options.filter((o) => selectedSet.has(o.id));

  return (
    <div ref={rootRef} className="lms-root">
      <button type="button" className="lms-control" onClick={() => setOpen((o) => !o)}>
        {selectedOptions.length === 0 ? (
          <span className="lms-placeholder">{placeholder}</span>
        ) : (
          <div className="lms-chips">
            {selectedOptions.slice(0, 4).map((o) => (
              <span key={o.id} className="lms-chip">
                {o.label}
                <span className="lms-chip__x" onClick={(e) => { e.stopPropagation(); removeChip(o.id); }}>×</span>
              </span>
            ))}
            {selectedOptions.length > 4 && <span className="lms-chip lms-chip--more">+{selectedOptions.length - 4} more</span>}
          </div>
        )}
        <span className="lms-control__icons">
          {selectedOptions.length > 0 && <span className="lms-clear" onClick={clearAll} title="Clear all">Clear</span>}
          <span className="lms-caret">{open ? '▲' : '▼'}</span>
        </span>
      </button>

      {open && (
        <div className="lms-panel">
          <input className="lms-search" placeholder="Search states, UTs, regions…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
          <div className="lms-list">
            {grouped.map((bucket) => (
              <div key={bucket.group}>
                <div className="lms-group-header">{bucket.group}</div>
                {bucket.items.map((opt) => (
                  <label key={opt.id} className="lms-option">
                    <input type="checkbox" checked={selectedSet.has(opt.id)} onChange={() => toggle(opt.id)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            ))}
            {grouped.length === 0 && <div className="lms-empty">No matches</div>}
          </div>
        </div>
      )}
    </div>
  );
}
