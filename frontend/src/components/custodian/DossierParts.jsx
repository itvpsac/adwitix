import { useState } from 'react';
import { formatCurrency } from '../../utils/format.js';

// Shared pieces of the Custodian's Lot file and User file (D-133/D-134):
// every stored field is listed, not a curated subset, so new columns show
// up without a code change.
const MONEY = /(amount|price|reserve_value|expected_value|sale_value|_fee|forfeited_to)/;
const HIDDEN = new Set(['bids', 'offers', 'emdHolds', 'tenderInterest', 'settlements', 'disputes', 'chronicles']);

export const label = (k) => k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
export function show(k, v) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  if (MONEY.test(k) && !Number.isNaN(Number(v))) return formatCurrency(v);
  return String(v);
}

export function Fields({ row, skip = HIDDEN }) {
  const [all, setAll] = useState(false);
  if (!row) return <p className="cl-empty">—</p>;
  const entries = Object.entries(row).filter(([k]) => !skip.has(k));
  const shown = all ? entries : entries.filter(([, v]) => v !== null && v !== '' && v !== undefined);
  return (
    <>
      <dl className="cl-kv">
        {shown.map(([k, v]) => <div key={k}><dt>{label(k)}</dt><dd>{show(k, v)}</dd></div>)}
      </dl>
      {shown.length < entries.length && <button type="button" className="cl-more" onClick={() => setAll(true)}>Show {entries.length - shown.length} empty fields</button>}
    </>
  );
}

export function Table({ title, rows, party }) {
  if (!rows || rows.length === 0) return <div className="cl-sub"><h4>{title}</h4><p className="cl-empty">None.</p></div>;
  const cols = Object.keys(rows[0]).filter((c) => c !== 'sale_event_id');
  return (
    <div className="cl-sub">
      <h4>{title} <span className="cc-lbl">{rows.length}</span></h4>
      <div className="cl-table">
        <table>
          <thead><tr>{cols.map((c) => <th key={c}>{label(c)}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id || JSON.stringify(r)}>
                {cols.map((c) => <td key={c}>{/party_id$/.test(c) && r[c] ? party(r[c]) : show(c, r[c])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

