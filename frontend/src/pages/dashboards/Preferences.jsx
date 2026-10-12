import { useEffect, useState } from 'react';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';
import LocationMultiSelect from '../../components/LocationMultiSelect.jsx';
import ValueRangeSlider from '../../components/ValueRangeSlider.jsx';
import {
  CATEGORIES, SUBCATS_BY_CAT, MICROCATS_BY_SUBCAT, LOC_OPTIONS,
  VALUE_MAX_INDEX, formatValueRange, formatLocList,
} from '../../data/classification.js';
import './Preferences.css';

const CTAS = [{ label: '← Trader Dashboard', to: '/buyer/dashboard' }];
const STORAGE_KEY = 'adwitix_buyer_preferences_v2';

function newRow() {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    catId: '', subcatId: '', microcatId: '',
    overrideEnabled: false, loc: [], valueLo: 0, valueHi: VALUE_MAX_INDEX,
  };
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* noop */ }
  return null;
}

export default function Preferences() {
  const initial = loadInitial();
  const [universalLoc, setUniversalLoc] = useState(initial?.universalLoc || []);
  const [universalValueLo, setUniversalValueLo] = useState(initial?.universalValueLo ?? 0);
  const [universalValueHi, setUniversalValueHi] = useState(initial?.universalValueHi ?? VALUE_MAX_INDEX);
  const [rows, setRows] = useState(initial?.rows || []);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { setSaved(false); }, [universalLoc, universalValueLo, universalValueHi, rows]);

  const addRow = () => setRows((r) => [...r, newRow()]);
  const removeRow = (id) => setRows((r) => r.filter((row) => row.id !== id));

  const updateRow = (id, patch) => setRows((r) => r.map((row) => {
    if (row.id !== id) return row;
    const next = { ...row, ...patch };
    if ('catId' in patch) { next.subcatId = ''; next.microcatId = ''; }
    if ('subcatId' in patch) { next.microcatId = ''; }
    return next;
  }));

  const toggleOverride = (id) => setRows((r) => r.map((row) => {
    if (row.id !== id) return row;
    if (row.overrideEnabled) return { ...row, overrideEnabled: false };
    return { ...row, overrideEnabled: true, loc: row.loc.length ? row.loc : universalLoc, valueLo: universalValueLo, valueHi: universalValueHi };
  }));

  const save = () => {
    const payload = { universalLoc, universalValueLo, universalValueHi, rows };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setSaved(true);
  };

  const resetAll = () => {
    setUniversalLoc([]); setUniversalValueLo(0); setUniversalValueHi(VALUE_MAX_INDEX); setRows([]);
    localStorage.removeItem(STORAGE_KEY);
    setSaved(false); setConfirmReset(false);
  };

  const rowPreview = (row) => {
    const cat = CATEGORIES.find((c) => c.id === row.catId);
    if (!cat) return 'Choose a category to begin…';
    const subcats = SUBCATS_BY_CAT[row.catId] || [];
    const sub = subcats.find((s) => s.id === row.subcatId);
    const microcats = sub ? (MICROCATS_BY_SUBCAT[sub.id] || []) : [];
    const micro = microcats.find((m) => m.id === row.microcatId);
    const parts = [`${cat.code} — ${cat.label}`];
    if (sub) parts.push(`${sub.code} — ${sub.label}`);
    if (micro) parts.push(`${micro.code} — ${micro.label}`);
    const loc = row.overrideEnabled ? row.loc : universalLoc;
    const valueLo = row.overrideEnabled ? row.valueLo : universalValueLo;
    const valueHi = row.overrideEnabled ? row.valueHi : universalValueHi;
    parts.push(formatLocList(loc));
    parts.push(formatValueRange(valueLo, valueHi));
    return parts.join(' \u00b7 ');
  };

  return (
    <div className="prf-page">
      <LightDashboardHeader ctas={CTAS} />
      <main className="prf-main">
        <div className="prf-eyebrow">Account</div>
        <h1 className="prf-h1">My Preferences</h1>
        <p className="prf-sub">
          Built on the ADWITIX Master Classification Framework — CAT / SUBCAT / MICROCAT scope, plus location and value.
          You'll still see every Listing by default; this just curates what's highlighted for you on the feed and Live Ticker.
        </p>

        {saved && <div className="prf-saved-banner"><p>Preferences saved.</p></div>}

        <section className="prf-universal-card">
          <div className="prf-universal-head">
            <h2 className="prf-h2">Universal Defaults</h2>
            <p className="prf-hint">Applied to every preference row below, unless a row overrides them.</p>
          </div>
          <div className="prf-universal-grid">
            <div>
              <label className="prf-field-label">Location (LOC)</label>
              <LocationMultiSelect options={LOC_OPTIONS} value={universalLoc} onChange={setUniversalLoc} />
            </div>
            <div>
              <label className="prf-field-label">Value Range (VALUE)</label>
              <ValueRangeSlider loIndex={universalValueLo} hiIndex={universalValueHi} onChange={(lo, hi) => { setUniversalValueLo(lo); setUniversalValueHi(hi); }} />
            </div>
          </div>
        </section>

        <section className="prf-rows-section">
          <div className="prf-rows-head">
            <h2 className="prf-h2" style={{ margin: 0 }}>Preference Rows</h2>
            <button onClick={addRow} className="prf-add-btn">+ Add Preference</button>
          </div>

          {rows.length === 0 ? (
            <div className="prf-empty">
              <p className="prf-empty__title">No preferences yet</p>
              <p className="prf-empty__body">Add a row to start narrowing your feed by category, and optionally subcategory, microcategory, location or value.</p>
              <button onClick={addRow} className="prf-empty__cta">+ Add Your First Preference</button>
            </div>
          ) : (
            <div className="prf-rows-list">
              {rows.map((row, idx) => {
                const subcatOptions = row.catId ? (SUBCATS_BY_CAT[row.catId] || []) : [];
                const microcatOptions = row.subcatId ? (MICROCATS_BY_SUBCAT[row.subcatId] || []) : [];
                return (
                  <div key={row.id} className="prf-row-card">
                    <div className="prf-row-card__head">
                      <span className="prf-row-card__index">Row {idx + 1}</span>
                      <button onClick={() => removeRow(row.id)} className="prf-row-remove">Remove</button>
                    </div>

                    <div className="prf-row-grid">
                      <div>
                        <label className="prf-field-label">CAT</label>
                        <SearchableSelect
                          options={CATEGORIES.map((c) => ({ id: c.id, code: c.code, label: c.label }))}
                          value={row.catId || null}
                          onChange={(id) => updateRow(row.id, { catId: id || '' })}
                          placeholder="Choose a category…"
                        />
                      </div>
                      <div>
                        <label className="prf-field-label">SUBCAT <span className="prf-field-optional">optional</span></label>
                        <SearchableSelect
                          options={subcatOptions.map((s) => ({ id: s.id, code: s.code, label: s.label, group: s.group }))}
                          value={row.subcatId || null}
                          onChange={(id) => updateRow(row.id, { subcatId: id || '' })}
                          placeholder={row.catId ? 'Any subcategory…' : 'Choose a category first'}
                          disabled={!row.catId}
                        />
                      </div>
                      <div>
                        <label className="prf-field-label">MICROCAT <span className="prf-field-optional">optional</span></label>
                        <SearchableSelect
                          options={microcatOptions.map((m) => ({ id: m.id, code: m.code, label: m.label }))}
                          value={row.microcatId || null}
                          onChange={(id) => updateRow(row.id, { microcatId: id || '' })}
                          placeholder={row.subcatId ? 'Any microcategory…' : 'Choose a subcategory first'}
                          disabled={!row.subcatId}
                          emptyMessage="No microcategories under this subcategory"
                        />
                      </div>
                    </div>

                    <label className="prf-override-toggle">
                      <input type="checkbox" checked={row.overrideEnabled} onChange={() => toggleOverride(row.id)} />
                      Override location/value for this row
                    </label>

                    {row.overrideEnabled ? (
                      <div className="prf-row-grid prf-row-grid--override">
                        <div>
                          <label className="prf-field-label">Location (LOC)</label>
                          <LocationMultiSelect options={LOC_OPTIONS} value={row.loc} onChange={(loc) => updateRow(row.id, { loc })} />
                        </div>
                        <div>
                          <label className="prf-field-label">Value Range (VALUE)</label>
                          <ValueRangeSlider loIndex={row.valueLo} hiIndex={row.valueHi} onChange={(lo, hi) => updateRow(row.id, { valueLo: lo, valueHi: hi })} />
                        </div>
                      </div>
                    ) : (
                      <p className="prf-override-hint">(using universal defaults — {formatLocList(universalLoc)} \u00b7 {formatValueRange(universalValueLo, universalValueHi)})</p>
                    )}

                    <div className="prf-preview">
                      <span className="prf-preview__label">Preview</span>
                      <span className="prf-preview__text">{rowPreview(row)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="prf-actions">
          <button onClick={save} className="prf-save-btn">Save Preferences</button>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="prf-reset-btn">Reset all</button>
          ) : (
            <span className="prf-reset-confirm">
              Clear all rows and defaults? <button onClick={resetAll} className="prf-reset-confirm__yes">Yes, reset</button>
              <button onClick={() => setConfirmReset(false)} className="prf-reset-confirm__no">Cancel</button>
            </span>
          )}
        </div>
      </main>
    </div>
  );
}
